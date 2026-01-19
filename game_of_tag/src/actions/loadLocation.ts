"use server";

import { db } from "../db/index";
import { locations, player, log, quests } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const QUEST_LIMIT_SECONDS = 360; // 6 minut na splnění
const LOCKOUT_SECONDS = 300;     // 5 minut timeout

const LOG_TYPE_START = 1;
const LOG_TYPE_TIMEOUT = 2;
const LOG_TYPE_SUCCESS = 3;

// --- funkce ---

function parseLocationId(rawInput: string) {
  const match = rawInput.match(/^([a-zA-Z]{2,3})(\d{1,3})$/);
  if (match && match[1] && match[2]) {
    return { codeName: match[1], id: parseInt(match[2], 10) };
  }
  return null;
}

function normalizeLogTime(dbLogTime: string | Date): string {
    if (dbLogTime instanceof Date) {
        return dbLogTime.toISOString();
    }
    if (typeof dbLogTime === 'string' && !dbLogTime.endsWith('Z')) {
        return new Date(dbLogTime + 'Z').toISOString();
    }
    return new Date(dbLogTime).toISOString();
}

function getDiffSeconds(dbLogTime: string | Date): number {
    const now = new Date();
    const logDate = new Date(normalizeLogTime(dbLogTime));
    return (now.getTime() - logDate.getTime()) / 1000;
}


// --- získáni infa o lokaci ---
export async function getLocationDetails(rawCode: string) {
  const parsed = parseLocationId(rawCode);
  if (!parsed) return { success: false, message: "Neplatný formát kódu." };

  try {
    const location = await db.query.locations.findFirst({
      where: eq(locations.idLocation, parsed.id),
      columns: { idLocation: true, name: true }
    });

    if (!location) return { success: false, message: "Lokace neexistuje." };
    if (location.name !== parsed.codeName) return { success: false, message: "Nesprávný kód lokace." };

    return { success: true, name: location.name, id: location.idLocation };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Chyba databáze." };
  }
}

// --- hlavní logika ---
export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  try {
    const now = new Date(); 

    // A) Ověření hráče
    const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
    if (!foundPlayer) return { success: false, message: "Špatné heslo hráče." };

    // B) Ověření lokace
    const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });
    if (!locationInfo) return { success: false, message: "Chyba lokace." };

    // C) ZÍSKÁNÍ POSLEDNÍHO LOGU (KDEKOLIV)
    // Toto je klíčové - bereme poslední akci hráče bez ohledu na to, kde se stala.
    const lastLogAnywhere = await db.query.log.findFirst({
        where: eq(log.playerId, foundPlayer.idPlayer),
        orderBy: [desc(log.logTime)], 
    });

    if (lastLogAnywhere) {
        const diffSeconds = getDiffSeconds(lastLogAnywhere.logTime);

        // --- 1. KONTROLA: GLOBÁLNÍ TREST (TIMEOUT) ---
        // Pokud je poslední log TIMEOUT, znamená to, že hráč je v trestu.
        // Nezáleží na tom, na jaké lokaci se to stalo - trest je globální.
        if (lastLogAnywhere.logTypeId === LOG_TYPE_TIMEOUT) {
            
            if (diffSeconds < LOCKOUT_SECONDS) {
                // NOVÁ LOGIKA: Zjistíme, jestli je trest odsud, nebo odjinud
                let msg = "Máš aktivní trest (Freeze)!";
                
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
                const timeoutLogTime = now.toISOString();
                
                // Zapíšeme TIMEOUT (globálně platný)
                await db.insert(log).values({
                    gameId: 1, 
                    gamesetId: locationInfo.gamesetId || 1, 
                    locationId: lastLogAnywhere.locationId, 
                    playerId: foundPlayer.idPlayer,
                    logTypeId: LOG_TYPE_TIMEOUT, 
                    questId: lastLogAnywhere.questId,
                    logTime: timeoutLogTime
                });
                
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
    const localLog = await db.query.log.findFirst({
      where: and(
        eq(log.playerId, foundPlayer.idPlayer),
        eq(log.locationId, locationId),
        eq(log.logTypeId, LOG_TYPE_SUCCESS)
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

    await db.insert(log).values({
        gameId: 1, 
        gamesetId: locationInfo.gamesetId || 1, 
        locationId, 
        playerId: foundPlayer.idPlayer,
        logTypeId: LOG_TYPE_START,
        questId: randomQuestId,
        logTime: startTimeISO 
    });

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
    console.error("Chyba:", error);
    return { success: false, message: "Chyba serveru." };
  }
}

// 3. UKONČENÍ ÚKOLU (Beze změny)
export async function finishQuest(locationId: number, playerPass: string, resultStatus: 'success' | 'timeout') {
    try {
        const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
        if (!foundPlayer) return { success: false, message: "Auth error" };

        const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });

        const lastLog = await db.query.log.findFirst({
            where: and(eq(log.playerId, foundPlayer.idPlayer), eq(log.locationId, locationId)),
            orderBy: [desc(log.logTime)],
        });

        await db.insert(log).values({
            gameId: 1,
            gamesetId: locationInfo?.gamesetId || 1,
            locationId, playerId: foundPlayer.idPlayer,
            logTypeId: resultStatus === 'success' ? LOG_TYPE_SUCCESS : LOG_TYPE_TIMEOUT,
            questId: lastLog?.questId || null,
            logTime: new Date().toISOString() 
        });

        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Chyba při ukládání." };
    }
}