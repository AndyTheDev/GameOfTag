// --- získáni infa o lokaci ---
export async function getLocationDetails(rawCode: string) {
  const parsed = parseLocationId(rawCode);
  if (!parsed) return { success: false, message: "Neplatný formát kódu." };

  const clientKey = await getClientKey();
  const limit = checkRateLimit(`getLocationDetails:${clientKey}`, { windowMs: 10_000, max: 20 });
  if (!limit.allowed) {
    return { success: false, message: "Příliš mnoho pokusů, zpomal." }; // Zakladni ochrana proti spamovani endpointu.
  }

  try {
    const location = await db.query.locations.findFirst({
      where: eq(locations.idLocation, parsed.id),
      columns: { idLocation: true, name: true }
    });

    if (!location) return { success: false, message: "Lokace neexistuje." };
    if (location.name !== parsed.codeName) return { success: false, message: "Nesprávný kód lokace." };

    return { success: true, name: location.name, id: location.idLocation };
  } catch (error) {
    return handleServerError("Chyba databáze.", error, { action: "getLocationDetails" });
  }
}

// --- hlavní logika ---
export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  const clientKey = await getClientKey();
  const limit = checkRateLimit(`verifyAndLogQuest:${clientKey}`, { windowMs: 10_000, max: 10 });
  if (!limit.allowed) {
    return { success: false, message: "Příliš mnoho pokusů, počkej chvíli." };
  }

  try {
    const now = new Date(); 

    // A) Ověření hráče
    const foundPlayer = await db.query.players.findFirst({ where: eq(players.pass, playerPass) });
    if (!foundPlayer) return { success: false, message: "Špatné heslo hráče." };

    // B) Ověření lokace
    const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });
    if (!locationInfo) return { success: false, message: "Chyba lokace." };

    // C) ZÍSKÁNÍ POSLEDNÍHO LOGU (KDEKOLIV)
    // Toto je klíčové - bereme poslední akci hráče bez ohledu na to, kde se stala.
    const lastLogAnywhere = await db.query.logs.findFirst({
        where: eq(logs.playerId, foundPlayer.idPlayer),
        orderBy: [desc(logs.logTime)], 
    });

    if (lastLogAnywhere) {
        const diffSeconds = getDiffSeconds(lastLogAnywhere.logTime);

        // --- 1. KONTROLA: GLOBÁLNÍ TREST (TIMEOUT) ---
        // Pokud je poslední log TIMEOUT, znamená to, že hráč je v trestu.
        // Nezáleží na tom, na jaké lokaci se to stalo - trest je globální.
        if (lastLogAnywhere.logTypeId === LOG_TYPE_TIMEOUT) {
            
            if (diffSeconds < LOCKOUT_SECONDS) {
                // NOVÁ LOGIKA: Zjistíme, jestli je trest odsud, nebo odjinud
                let msg = "Máš aktivní trest!";
                
                if (lastLogAnywhere.locationId !== locationId) {
                    // Trest je z jiné lokace -> zjistíme její jméno pro lepší UX
                    const punishmentLoc = await db.query.locations.findFirst({
                        where: eq(locations.idLocation, lastLogAnywhere.locationId),
                        columns: { name: true, idLocation: true }
                    });
                    const locName = punishmentLoc ? `${punishmentLoc.name}${punishmentLoc.idLocation}` : "jiné lokaci";
                    msg = `Stále máš aktivní trest z lokace ${locName}! Nemůžeš plnit úkoly nikde.`;
                }

                return { 
                    success: false, 
                    message: msg, 
                    status: "locked",
                    startTime: normalizeLogTime(lastLogAnywhere.logTime)
                };
            }
        }

        // --- 2. KONTROLA: GLOBÁLNÍ AKTIVNÍ ÚKOL (START) ---
        if (lastLogAnywhere.logTypeId === LOG_TYPE_START) {
            
            // a) Čas na úkol VYPRŠEL (kdekoliv)
            if (diffSeconds > QUEST_LIMIT_SECONDS) {
                // Trest timeout začne běžet ihned po vypršení času na úkol, ne až se uživatel vrátí na stránku.
                const startTimeMs = new Date(normalizeLogTime(lastLogAnywhere.logTime)).getTime();
                const timeoutLogTime = new Date(startTimeMs + (QUEST_LIMIT_SECONDS * 1000)).toISOString();
                
                // Zapíšeme TIMEOUT (globálně platný)
                await db.insert(logs).values({
                    gameId: 1,
                    locationId: lastLogAnywhere.locationId, 
                    playerId: foundPlayer.idPlayer,
                    logTypeId: LOG_TYPE_TIMEOUT, 
                    questId: lastLogAnywhere.questId,
                    logTime: new Date(timeoutLogTime)
                });
                emitLogUpdate(); // Notifikace pro admin SSE, at se logy aktualizuji v real-time.
                logInfo("Log timeout zapsan", { playerId: foundPlayer.idPlayer, locationId: lastLogAnywhere.locationId });
                
                return { 
                    success: false, 
                    message: "Čas na předchozí úkol vypršel. Nyní máš aktivní trest.", 
                    status: "locked", 
                    startTime: timeoutLogTime 
                };
            }

            // b) Čas stále BĚŽÍ
            else {
                // Pokud je hráč na SPRÁVNÉM místě (resume)
                if (lastLogAnywhere.locationId === locationId) {
                    const activeQuest = await db.query.quests.findFirst({ where: eq(quests.idQuest, lastLogAnywhere.questId!) });
                    
                    return {
                        success: true,
                        status: "active",
                        playerName: foundPlayer.name,
                        questName: activeQuest?.name || "Neznámý úkol",
                        questDescription: activeQuest?.description || "",
                        questId: lastLogAnywhere.questId,
                        startTime: normalizeLogTime(lastLogAnywhere.logTime)
                    };
                } 
                // Pokud se snaží přihlásit JINDE, zatímco mu běží čas
                else {
                    const otherLoc = await db.query.locations.findFirst({
                        where: eq(locations.idLocation, lastLogAnywhere.locationId),
                        columns: { name: true, idLocation: true }
                    });
                    return {
                        success: false,
                        message: `Sem nemůžeš! Máš rozdělaný úkol na lokaci ${otherLoc?.name}${otherLoc?.idLocation}.`,
                        status: "error"
                    };
                }
            }
        }
    }

    // --- 3. KONTROLA: LOKÁLNÍ SPLNĚNÍ ---
    // (Tady kontrolujeme jen tuto lokaci, protože splněná lokace neblokuje ostatní)
    const localLog = await db.query.logs.findFirst({
      where: and(
        eq(logs.playerId, foundPlayer.idPlayer),
        eq(logs.locationId, locationId),
        eq(logs.logTypeId, LOG_TYPE_SUCCESS)
      ),
    });

    if (localLog) {
        return { 
            success: false, 
            message: "Tento checkpoint už máš splněný!", 
            status: "completed" 
        };
    }

    // --- 4. START NOVÉHO ÚKOLU ---
    // Pokud prošel všemi kontrolami (nemá trest, nemá aktivní úkol, nemá splněno zde)
    const allQuestIds = await db.query.quests.findMany({ columns: { idQuest: true } });
    if (allQuestIds.length === 0) return { success: false, message: "Žádné úkoly v DB." };
    
    const randomQuestId = allQuestIds[Math.floor(Math.random() * allQuestIds.length)].idQuest;
    const questInfo = await db.query.quests.findFirst({ where: eq(quests.idQuest, randomQuestId) });
    const startTimeISO = now.toISOString();

    await db.insert(logs).values({
        gameId: 1,
        locationId, 
        playerId: foundPlayer.idPlayer,
        logTypeId: LOG_TYPE_START,
        questId: randomQuestId,
        logTime: new Date(startTimeISO) 
    });
    emitLogUpdate();
    logInfo("Log start zapsan", { playerId: foundPlayer.idPlayer, locationId });

    return {
        success: true,
        status: "active",
        playerName: foundPlayer.name,
        questName: questInfo?.name || "",
        questDescription: questInfo?.description || "",
        questId: randomQuestId,
        startTime: startTimeISO
    };

  } catch (error) {
    return handleServerError("Chyba serveru.", error, { action: "verifyAndLogQuest" });
  }
}