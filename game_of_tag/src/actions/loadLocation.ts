/* "use server";

import { db } from "../db/index";
import { locations, player, log, quests } from "../db/schema";
import { eq, sql } from "drizzle-orm";

function parseLocationId(rawInput: string) {
  // Regex: ^([a-zA-Z]{2,3}) -> začátek, 2-3 písmena (skupina 1)
  // (\d{1,3})$ -> konec, 1-3 číslice (skupina 2)
  const match = rawInput.match(/^([a-zA-Z]{2,3})(\d{1,3})$/);
  
  if (match && match[1] && match[2]) {
    return {
      codeName: match[1],         // Textová část, např. "VZQ"
      id: parseInt(match[2], 10)  // Číselná část, např. 12
    };
  }
  return null;
}

// 1. Získání detailů o lokaci a VALIDACE KÓDU
export async function getLocationDetails(rawCode: string) {
  const parsed = parseLocationId(rawCode);
  
  if (!parsed) {
    return { success: false, message: "Neplatný formát kódu (očekáváno např. VZQ12)." };
  }

  try {
    const location = await db.query.locations.findFirst({
      where: eq(locations.idLocation, parsed.id),
      columns: { idLocation: true, name: true }
    });

    if (!location) {
      return { success: false, message: "Lokace s tímto ID neexistuje." };
    }

    if (location.name !== parsed.codeName) {
      return { 
        success: false, 
        message: "Tato lokace neexistuje" 
      };
    }
    return { success: true, name: location.name, id: location.idLocation };

  } catch (error) {
    console.error("Chyba DB:", error);
    return { success: false, message: "Chyba databáze." };
  }
}

// 2. Hlavní akce: Ověření hesla, Logování, Náhodný Quest
export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  try {
    const foundPlayer = await db.query.player.findFirst({
      where: eq(player.pass, playerPass),
    });

    if (!foundPlayer) {
      return { success: false, message: "Špatné heslo hráče." };
    }
    const locationInfo = await db.query.locations.findFirst({
      where: eq(locations.idLocation, locationId),
    });
    
    if (!locationInfo) return { success: false, message: "Chyba lokace." };

    const allQuestIds = await db.query.quests.findMany({
      columns: { idQuest: true },
    });

    if (allQuestIds.length === 0) return { success: false, message: "Nenalezeny žádné úkoly." };

    const randomIndex = Math.floor(Math.random() * allQuestIds.length);
    const randomQuestId = allQuestIds[randomIndex].idQuest;

    const questInfo = await db.query.quests.findFirst({
      where: eq(quests.idQuest, randomQuestId),
    });

    await db.insert(log).values({
      gameId: 1, 
      gamesetId: locationInfo.gamesetId || 1,
      locationId: locationId,
      playerId: foundPlayer.idPlayer,
      logTypeId: 1,
      questId: questInfo?.idQuest || null,
    });

    return {
      success: true,
      playerName: foundPlayer.name,
      questName: questInfo?.name || "Neznámý úkol",
      questDescription: questInfo?.description || "Bez popisu.",
    };

  } catch (error) {
    console.error("Chyba:", error);
    return { success: false, message: "Chyba serveru při ukládání." };
  }
} */

/*  "use server";

import { db } from "../db/index";
import { locations, player, log, quests } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

// KONFIGURACE ČASU
const QUEST_LIMIT_SECONDS = 300; 
const LOCKOUT_SECONDS = 300;     

// ID typů logů (uprav dle své databáze)
const LOG_TYPE_START = 1;
const LOG_TYPE_SUCCESS = 2;
const LOG_TYPE_TIMEOUT = 3;

// --- POMOCNÉ FUNKCE ---

function parseLocationId(rawInput: string) {
  const match = rawInput.match(/^([a-zA-Z]{2,3})(\d{1,3})$/);
  if (match && match[1] && match[2]) {
    return { codeName: match[1], id: parseInt(match[2], 10) };
  }
  return null;
}

// 1. ZÍSKÁNÍ DETAILŮ O LOKACI (Beze změny logiky, jen validace)
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

// 2. HLAVNÍ AKCE: LOGIKA HRY
export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  try {
    // A) Ověření hráče a lokace
    const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
    if (!foundPlayer) return { success: false, message: "Špatné heslo hráče." };

    const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });
    if (!locationInfo) return { success: false, message: "Chyba lokace." };

    // B) KONTROLA HISTORIE LOGŮ
    // Najdeme poslední log pro tohoto hráče na této lokaci
    const lastLog = await db.query.log.findFirst({
      where: and(
        eq(log.playerId, foundPlayer.idPlayer),
        eq(log.locationId, locationId)
      ),
      orderBy: [desc(log.logTime)], // Předpokládám sloupec 'logTime' nebo 'createdAt'
    });

    const now = new Date();

    // --- SCÉNÁŘ 1: Úkol už byl úspěšně splněn ---
    if (lastLog && lastLog.logTypeId === LOG_TYPE_SUCCESS) {
        return { 
            success: false, 
            message: "Tento checkpoint už máš splněný!", 
            status: "completed" 
        };
    }

    // --- SCÉNÁŘ 2: Hráč je v trestu (Timeout) ---
    if (lastLog && lastLog.logTypeId === LOG_TYPE_TIMEOUT) {
        const diffSeconds = (now.getTime() - new Date(lastLog.logTime).getTime()) / 1000;
        if (diffSeconds < LOCKOUT_SECONDS) {
            const remaining = Math.ceil(LOCKOUT_SECONDS - diffSeconds);
            return { 
                success: false, 
                message: `Jsi uzamčen! Zkus to znovu za ${remaining}s.`, 
                status: "locked",
                remainingTime: remaining
            };
        }
        // Pokud trest vypršel, pokračujeme dál a vygenerujeme nový úkol (nebo ten samý, viz níže)
    }

    // --- SCÉNÁŘ 3: Úkol běží (nebo běžel a vypršel, ale nebyl uzavřen) ---
    if (lastLog && lastLog.logTypeId === LOG_TYPE_START) {
        const diffSeconds = (now.getTime() - new Date(lastLog.logTime).getTime()) / 1000;

        // Pokud čas vypršel a hráč se snaží přihlásit -> ZAPÍŠEME TIMEOUT a zamkneme ho
        if (diffSeconds > QUEST_LIMIT_SECONDS) {
            await db.insert(log).values({
                gameId: 1, 
                gamesetId: locationInfo.gamesetId || 1, 
                locationId, 
                playerId: foundPlayer.idPlayer,
                logTypeId: LOG_TYPE_TIMEOUT, //
                questId: lastLog.questId,
                logTime: now.toISOString()
            });

            return { 
                success: false, 
                message: "Čas na úkol vypršel. Jsi dočasně uzamčen.", 
                status: "locked",
                remainingTime: LOCKOUT_SECONDS
            };
        }

        // Pokud čas ještě běží -> VRÁTÍME STÁVAJÍCÍ ÚKOL
        const activeQuest = await db.query.quests.findFirst({ where: eq(quests.idQuest, lastLog.questId!) });
        return {
            success: true,
            status: "active",
            playerName: foundPlayer.name,
            questName: activeQuest?.name || "Neznámý úkol",
            questDescription: activeQuest?.description || "",
            remainingTime: Math.ceil(QUEST_LIMIT_SECONDS - diffSeconds),
            questId: lastLog.questId // Potřebujeme pro dokončení
        };
    }

    // --- SCÉNÁŘ 4: Nový start (čistý štít nebo po vypršení trestu) ---
    
    // Losování úkolu
    const allQuestIds = await db.query.quests.findMany({ columns: { idQuest: true } });
    if (allQuestIds.length === 0) return { success: false, message: "Žádné úkoly v DB." };
    
    const randomQuestId = allQuestIds[Math.floor(Math.random() * allQuestIds.length)].idQuest;
    const questInfo = await db.query.quests.findFirst({ where: eq(quests.idQuest, randomQuestId) });

    // Zápis START logu
    await db.insert(log).values({
        gameId: 1, 
        gamesetId: locationInfo.gamesetId || 1, 
        locationId, 
        playerId: foundPlayer.idPlayer,
        logTypeId: LOG_TYPE_START,
        questId: randomQuestId,
        logTime: now.toISOString()
    });

    return {
        success: true,
        status: "active",
        playerName: foundPlayer.name,
        questName: questInfo?.name || "",
        questDescription: questInfo?.description || "",
        remainingTime: QUEST_LIMIT_SECONDS,
        questId: randomQuestId
    };

  } catch (error) {
    console.error("Chyba:", error);
    return { success: false, message: "Chyba serveru." };
  }
}

// 3. NOVÁ AKCE: UKONČENÍ ÚKOLU (Úspěch nebo Timeout vyvolaný klientem)
export async function finishQuest(locationId: number, playerPass: string, resultStatus: 'success' | 'timeout') {
    try {
        const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
        if (!foundPlayer) return { success: false, message: "Auth error" };

        const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });

        // Zjistíme poslední quest ID z logu (pro zachování kontinuity)
        const lastLog = await db.query.log.findFirst({
            where: and(eq(log.playerId, foundPlayer.idPlayer), eq(log.locationId, locationId)),
            orderBy: [desc(log.logTime)],
        });

        // Zapíšeme výsledek
        await db.insert(log).values({
            gameId: 1,
            gamesetId: locationInfo?.gamesetId || 1,
            locationId, playerId: foundPlayer.idPlayer,
            logTypeId: resultStatus === 'success' ? LOG_TYPE_SUCCESS : LOG_TYPE_TIMEOUT,
            questId: lastLog?.questId || null,
        });

        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Chyba při ukládání." };
    }
} */

 /*    "use server";

import { db } from "../db/index";
import { locations, player, log, quests } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

// KONFIGURACE ČASU
const QUEST_LIMIT_SECONDS = 300; 
const LOCKOUT_SECONDS = 300;     

// ID typů logů
const LOG_TYPE_START = 1;
const LOG_TYPE_SUCCESS = 2;
const LOG_TYPE_TIMEOUT = 3;

// --- POMOCNÉ FUNKCE ---

function parseLocationId(rawInput: string) {
  const match = rawInput.match(/^([a-zA-Z]{2,3})(\d{1,3})$/);
  if (match && match[1] && match[2]) {
    return { codeName: match[1], id: parseInt(match[2], 10) };
  }
  return null;
}

// 1. ZÍSKÁNÍ DETAILŮ O LOKACI
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

// 2. HLAVNÍ AKCE: LOGIKA HRY
export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  try {
    // A) Ověření hráče a lokace
    const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
    if (!foundPlayer) return { success: false, message: "Špatné heslo hráče." };

    const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });
    if (!locationInfo) return { success: false, message: "Chyba lokace." };

    const now = new Date();

    // --- 1. GLOBÁLNÍ KONTROLA (Co dělal hráč naposledy KDEKOLI?) ---
    // Hledáme poslední log hráče bez ohledu na lokaci
    const globalLastLog = await db.query.log.findFirst({
        where: eq(log.playerId, foundPlayer.idPlayer),
        orderBy: [desc(log.logTime)], // Nejnovější záznam
    });

    // Pokud existuje nějaká historie, podíváme se, jestli neběží úkol
    if (globalLastLog && globalLastLog.logTypeId === LOG_TYPE_START) {
        const diffSeconds = (now.getTime() - new Date(globalLastLog.logTime).getTime()) / 1000;

        // Pokud čas limitu ještě nevypršel
        if (diffSeconds <= QUEST_LIMIT_SECONDS) {
            
            // SITUACE A: Hráč je na SPRÁVNÉM místě (Resume)
            if (globalLastLog.locationId === locationId) {
                const activeQuest = await db.query.quests.findFirst({ where: eq(quests.idQuest, globalLastLog.questId!) });
                return {
                    success: true,
                    status: "active",
                    playerName: foundPlayer.name,
                    questName: activeQuest?.name || "Neznámý úkol",
                    questDescription: activeQuest?.description || "",
                    remainingTime: Math.ceil(QUEST_LIMIT_SECONDS - diffSeconds),
                    questId: globalLastLog.questId
                };
            } 

            // SITUACE B: Hráč je na JINÉM místě, ale má aktivní úkol jinde (Cheating/Confusion prevention)
            else {
                // Zjistíme název té druhé lokace, kde má resty
                const otherLocation = await db.query.locations.findFirst({
                    where: eq(locations.idLocation, globalLastLog.locationId),
                    columns: { name: true, idLocation: true }
                });
                
                return {
                    success: false,
                    message: `Máš nedokončený úkol na lokaci ${otherLocation?.name}${otherLocation?.idLocation}! Musíš ho nejdřív splnit nebo počkat, až vyprší čas.`,
                    status: "error" // Nepustíme ho dál
                };
            }
        }
        
        // Pokud čas VYPRŠEL (ale nebyl zapsán Timeout log), musíme to vyřešit.
        // Pokud vypršel čas na TÉTO lokaci -> zapíšeme Timeout a zamkneme.
        if (diffSeconds > QUEST_LIMIT_SECONDS && globalLastLog.locationId === locationId) {
             await db.insert(log).values({
                gameId: 1, 
                gamesetId: locationInfo.gamesetId || 1, 
                locationId, 
                playerId: foundPlayer.idPlayer,
                logTypeId: LOG_TYPE_TIMEOUT, 
                questId: globalLastLog.questId,
                logTime: now.toISOString()
            });
            return { 
                success: false, 
                message: "Čas na úkol vypršel. Jsi dočasně uzamčen.", 
                status: "locked", 
                remainingTime: LOCKOUT_SECONDS 
            };
        }
        
        // Pokud vypršel čas na JINÉ lokaci, teoreticky ho můžeme nechat hrát tady (čistý štít),
        // protože tamten úkol už "propadl". Pokračujeme tedy dál v kódu k Lokální kontrole.
    }


    // --- 2. LOKÁLNÍ KONTROLA (Specifika této lokace) ---
    // Tady už víme, že hráč nikde jinde aktivně nehraje (nebo mu to tam propadlo).
    // Musíme zkontrolovat, jestli na TÉTO lokaci nemá splněno nebo zámek.

    const localLastLog = await db.query.log.findFirst({
      where: and(
        eq(log.playerId, foundPlayer.idPlayer),
        eq(log.locationId, locationId)
      ),
      orderBy: [desc(log.logTime)], 
    });

    if (localLastLog) {
        // Zámek (Timeout)
        if (localLastLog.logTypeId === LOG_TYPE_TIMEOUT) {
            const diffSeconds = (now.getTime() - new Date(localLastLog.logTime).getTime()) / 1000;
            if (diffSeconds < LOCKOUT_SECONDS) {
                const remaining = Math.ceil(LOCKOUT_SECONDS - diffSeconds);
                return { 
                    success: false, 
                    message: `Jsi uzamčen! Zkus to znovu za ${remaining}s.`, 
                    status: "locked",
                    remainingTime: remaining
                };
            }
        }
        // Splněno
        if (localLastLog.logTypeId === LOG_TYPE_SUCCESS) {
            return { 
                success: false, 
                message: "Tento checkpoint už máš splněný!", 
                status: "completed" 
            };
        }
    }

    // --- 3. START NOVÉHO ÚKOLU ---
    // Všechny kontroly prošly, generujeme nový úkol.

    const allQuestIds = await db.query.quests.findMany({ columns: { idQuest: true } });
    if (allQuestIds.length === 0) return { success: false, message: "Žádné úkoly v DB." };
    
    const randomIndex = Math.floor(Math.random() * allQuestIds.length);
    const randomQuestId = allQuestIds[randomIndex].idQuest;
    const questInfo = await db.query.quests.findFirst({ where: eq(quests.idQuest, randomQuestId) });

    await db.insert(log).values({
        gameId: 1, 
        gamesetId: locationInfo.gamesetId || 1, 
        locationId, 
        playerId: foundPlayer.idPlayer,
        logTypeId: LOG_TYPE_START,
        questId: randomQuestId,
        logTime: now.toISOString()
    });

    return {
        success: true,
        status: "active",
        playerName: foundPlayer.name,
        questName: questInfo?.name || "",
        questDescription: questInfo?.description || "",
        remainingTime: QUEST_LIMIT_SECONDS,
        questId: randomQuestId
    };

  } catch (error) {
    console.error("Chyba:", error);
    return { success: false, message: "Chyba serveru." };
  }
}

// 3. UKONČENÍ ÚKOLU (Stejné jako předtím, jen kontrola)
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
            logTime: new Date().toISOString() // Konzistentní ukládání
        });

        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Chyba při ukládání." };
    }
} */

 /*"use server";

import { db } from "../db/index";
import { locations, player, log, quests } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

// KONFIGURACE ČASU
const QUEST_LIMIT_SECONDS = 300; // 5 minut na splnění
const LOCKOUT_SECONDS = 300;     // 5 minut trest

const LOG_TYPE_START = 1;
const LOG_TYPE_SUCCESS = 2;
const LOG_TYPE_TIMEOUT = 3;

// --- POMOCNÉ FUNKCE ---
function parseLocationId(rawInput: string) {
  const match = rawInput.match(/^([a-zA-Z]{2,3})(\d{1,3})$/);
  if (match && match[1] && match[2]) {
    return { codeName: match[1], id: parseInt(match[2], 10) };
  }
  return null;
}

// 1. ZÍSKÁNÍ DETAILŮ O LOKACI
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

// 2. HLAVNÍ LOGIKA HRY
export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  try {
    const now = new Date();

    // A) Ověření hráče
    const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
    if (!foundPlayer) return { success: false, message: "Špatné heslo hráče." };

    // B) Ověření lokace
    const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });
    if (!locationInfo) return { success: false, message: "Chyba lokace." };

    // C) ZÍSKÁNÍ POSLEDNÍHO LOGU HRÁČE (KDEKOLI)
    // Toto je klíčové - zajímá nás, co hráč dělal naposledy, jedno kde.
    const lastLogAnywhere = await db.query.log.findFirst({
        where: eq(log.playerId, foundPlayer.idPlayer),
        orderBy: [desc(log.logTime)], 
    });

    if (lastLogAnywhere) {
        const diffSeconds = (now.getTime() - new Date(lastLogAnywhere.logTime).getTime()) / 1000;

        // --- 1. KONTROLA: GLOBÁLNÍ TREST (TIMEOUT) ---
        // Pokud má hráč trest z jakékoli lokace a neuplynulo 5 minut -> STOP.
        if (lastLogAnywhere.logTypeId === LOG_TYPE_TIMEOUT) {
            if (diffSeconds < LOCKOUT_SECONDS) {
                const remaining = Math.ceil(LOCKOUT_SECONDS - diffSeconds);
                return { 
                    success: false, 
                    message: `Máš globální trest za nesplnění úkolu! Čekej.`, 
                    status: "locked",
                    remainingTime: remaining
                };
            }
            // Pokud trest vypršel, hráč je volný a kód pokračuje dolů...
        }

        // --- 2. KONTROLA: GLOBÁLNÍ AKTIVNÍ ÚKOL (START) ---
        if (lastLogAnywhere.logTypeId === LOG_TYPE_START) {
            
            // a) Čas na úkol VYPRŠEL (hráč ho nestihl splnit)
            if (diffSeconds > QUEST_LIMIT_SECONDS) {
                // Musíme okamžitě zapsat TIMEOUT, aby dostal trest.
                await db.insert(log).values({
                    gameId: 1, 
                    gamesetId: locationInfo.gamesetId || 1, 
                    locationId: lastLogAnywhere.locationId, // Trest patří k původní lokaci
                    playerId: foundPlayer.idPlayer,
                    logTypeId: LOG_TYPE_TIMEOUT, 
                    questId: lastLogAnywhere.questId,
                    logTime: now.toISOString() // Odteď běží trest
                });
                
                return { 
                    success: false, 
                    message: "Čas na předchozí úkol vypršel. Jsi uzamčen.", 
                    status: "locked", 
                    remainingTime: LOCKOUT_SECONDS 
                };
            }

            // b) Čas stále BĚŽÍ (úkol je aktivní)
            else {
                // Je hráč na SPRÁVNÉM místě? (Resume)
                if (lastLogAnywhere.locationId === locationId) {
                    // Načteme detaily úkolu
                    const activeQuest = await db.query.quests.findFirst({ where: eq(quests.idQuest, lastLogAnywhere.questId!) });
                    
                    // !!! NEGENERUJEME NOVÝ LOG, JEN VRACÍME STAV !!!
                    return {
                        success: true,
                        status: "active",
                        playerName: foundPlayer.name,
                        questName: activeQuest?.name || "Neznámý úkol",
                        questDescription: activeQuest?.description || "",
                        // Spočítáme zbývající čas dynamicky
                        remainingTime: Math.ceil(QUEST_LIMIT_SECONDS - diffSeconds),
                        questId: lastLogAnywhere.questId
                    };
                } 
                // Je hráč na ŠPATNÉM místě? (Cheating prevention)
                else {
                    const otherLoc = await db.query.locations.findFirst({
                        where: eq(locations.idLocation, lastLogAnywhere.locationId),
                        columns: { name: true, idLocation: true }
                    });
                    return {
                        success: false,
                        message: `Máš rozdělaný úkol jinde! (${otherLoc?.name}${otherLoc?.idLocation}). Musíš ho dokončit tam.`,
                        status: "error"
                    };
                }
            }
        }
    }

    // --- 3. KONTROLA: LOKÁLNÍ SPLNĚNÍ (SUCCESS) ---
    // Pokud jsme prošli sem, hráč nemá žádný aktivní úkol ani aktivní trest.
    // Jediné, co musíme ověřit, je, jestli už TUTO lokaci nemá hotovou.
    
    const localLog = await db.query.log.findFirst({
      where: and(
        eq(log.playerId, foundPlayer.idPlayer),
        eq(log.locationId, locationId),
        eq(log.logTypeId, LOG_TYPE_SUCCESS) // Hledáme jen úspěch
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
    // Vše čisté -> generujeme nový úkol.

    const allQuestIds = await db.query.quests.findMany({ columns: { idQuest: true } });
    if (allQuestIds.length === 0) return { success: false, message: "Žádné úkoly v DB." };
    
    const randomIndex = Math.floor(Math.random() * allQuestIds.length);
    const randomQuestId = allQuestIds[randomIndex].idQuest;
    const questInfo = await db.query.quests.findFirst({ where: eq(quests.idQuest, randomQuestId) });

    await db.insert(log).values({
        gameId: 1, 
        gamesetId: locationInfo.gamesetId || 1, 
        locationId, 
        playerId: foundPlayer.idPlayer,
        logTypeId: LOG_TYPE_START,
        questId: randomQuestId,
        logTime: now.toISOString()
    });

    return {
        success: true,
        status: "active",
        playerName: foundPlayer.name,
        questName: questInfo?.name || "",
        questDescription: questInfo?.description || "",
        remainingTime: QUEST_LIMIT_SECONDS,
        questId: randomQuestId
    };

  } catch (error) {
    console.error("Chyba:", error);
    return { success: false, message: "Chyba serveru." };
  }
}

// 3. UKONČENÍ ÚKOLU (Tlačítko nebo Client Timeout)
export async function finishQuest(locationId: number, playerPass: string, resultStatus: 'success' | 'timeout') {
    try {
        const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
        if (!foundPlayer) return { success: false, message: "Auth error" };

        const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });

        // Najdeme aktivní úkol, abychom k němu přiřadili výsledek
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
} */

/* "use server";

import { db } from "../db/index";
import { locations, player, log, quests } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

// KONFIGURACE ČASU
const QUEST_LIMIT_SECONDS = 300; // 5 minut na splnění
const LOCKOUT_SECONDS = 300;     // 5 minut trest

const LOG_TYPE_START = 1;
const LOG_TYPE_SUCCESS = 2;
const LOG_TYPE_TIMEOUT = 3;

// --- POMOCNÉ FUNKCE ---
function parseLocationId(rawInput: string) {
  const match = rawInput.match(/^([a-zA-Z]{2,3})(\d{1,3})$/);
  if (match && match[1] && match[2]) {
    return { codeName: match[1], id: parseInt(match[2], 10) };
  }
  return null;
}

function getDiffSeconds(dbLogTime: string | Date): number {
    const now = new Date();
    
    // Převedeme čas z DB na objekt Date
    let logDate = new Date(dbLogTime);

    // FIX: Pokud DB vrací string bez 'Z' na konci (např. "2023-12-10 18:33:00"),
    // JavaScript to bere jako lokální čas (ČR). My ale víme, že ukládáme UTC.
    // Musíme tedy říct: "Tohle je UTC čas".
    if (typeof dbLogTime === 'string' && !dbLogTime.endsWith('Z')) {
        // Zkusíme přidat Z, aby to JS parsoval jako UTC
        logDate = new Date(dbLogTime + 'Z');
    }
    
    // Pokud je formát v pořádku nebo už je to Date objekt, logDate je správně.
    // Výpočet rozdílu v sekundách:
    return (now.getTime() - logDate.getTime()) / 1000;
}

// 1. ZÍSKÁNÍ DETAILŮ O LOKACI
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

// 2. HLAVNÍ LOGIKA HRY
export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  try {
    const now = new Date();

    // A) Ověření hráče
    const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
    if (!foundPlayer) return { success: false, message: "Špatné heslo hráče." };

    // B) Ověření lokace
    const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });
    if (!locationInfo) return { success: false, message: "Chyba lokace." };

    // C) ZÍSKÁNÍ POSLEDNÍHO LOGU HRÁČE (KDEKOLI)
    // Toto je klíčové - zajímá nás, co hráč dělal naposledy, jedno kde.
    const lastLogAnywhere = await db.query.log.findFirst({
        where: eq(log.playerId, foundPlayer.idPlayer),
        orderBy: [desc(log.logTime)], 
    });

    if (lastLogAnywhere) {
        const diffSeconds = (now.getTime() - new Date(lastLogAnywhere.logTime).getTime()) / 1000;

        // --- 1. KONTROLA: GLOBÁLNÍ TREST (TIMEOUT) ---
        // Pokud má hráč trest z jakékoli lokace a neuplynulo 5 minut -> STOP.
        if (lastLogAnywhere.logTypeId === LOG_TYPE_TIMEOUT) {
            if (diffSeconds < LOCKOUT_SECONDS) {
                const remaining = Math.ceil(LOCKOUT_SECONDS - diffSeconds);
                return { 
                    success: false, 
                    message: `Máš globální trest za nesplnění úkolu! Čekej.`, 
                    status: "locked",
                    remainingTime: remaining
                };
            }
            // Pokud trest vypršel, hráč je volný a kód pokračuje dolů...
        }

        // --- 2. KONTROLA: GLOBÁLNÍ AKTIVNÍ ÚKOL (START) ---
        if (lastLogAnywhere.logTypeId === LOG_TYPE_START) {
            
            // a) Čas na úkol VYPRŠEL (hráč ho nestihl splnit)
            if (diffSeconds > QUEST_LIMIT_SECONDS) {
                // Musíme okamžitě zapsat TIMEOUT, aby dostal trest.
                await db.insert(log).values({
                    gameId: 1, 
                    gamesetId: locationInfo.gamesetId || 1, 
                    locationId: lastLogAnywhere.locationId, // Trest patří k původní lokaci
                    playerId: foundPlayer.idPlayer,
                    logTypeId: LOG_TYPE_TIMEOUT, 
                    questId: lastLogAnywhere.questId,
                    logTime: now.toISOString() // Odteď běží trest
                });
                
                return { 
                    success: false, 
                    message: "Čas na předchozí úkol vypršel. Jsi uzamčen.", 
                    status: "locked", 
                    remainingTime: LOCKOUT_SECONDS 
                };
            }

            // b) Čas stále BĚŽÍ (úkol je aktivní)
            else {
                // Je hráč na SPRÁVNÉM místě? (Resume)
                if (lastLogAnywhere.locationId === locationId) {
                    // Načteme detaily úkolu
                    const activeQuest = await db.query.quests.findFirst({ where: eq(quests.idQuest, lastLogAnywhere.questId!) });
                    
                    // !!! NEGENERUJEME NOVÝ LOG, JEN VRACÍME STAV !!!
                    return {
                        success: true,
                        status: "active",
                        playerName: foundPlayer.name,
                        questName: activeQuest?.name || "Neznámý úkol",
                        questDescription: activeQuest?.description || "",
                        // Spočítáme zbývající čas dynamicky
                        remainingTime: Math.ceil(QUEST_LIMIT_SECONDS - diffSeconds),
                        questId: lastLogAnywhere.questId
                    };
                } 
                // Je hráč na ŠPATNÉM místě? (Cheating prevention)
                else {
                    const otherLoc = await db.query.locations.findFirst({
                        where: eq(locations.idLocation, lastLogAnywhere.locationId),
                        columns: { name: true, idLocation: true }
                    });
                    return {
                        success: false,
                        message: `Máš rozdělaný úkol jinde! (${otherLoc?.name}${otherLoc?.idLocation}). Musíš ho dokončit tam.`,
                        status: "error"
                    };
                }
            }
        }
    }

    // --- 3. KONTROLA: LOKÁLNÍ SPLNĚNÍ (SUCCESS) ---
    // Pokud jsme prošli sem, hráč nemá žádný aktivní úkol ani aktivní trest.
    // Jediné, co musíme ověřit, je, jestli už TUTO lokaci nemá hotovou.
    
    const localLog = await db.query.log.findFirst({
      where: and(
        eq(log.playerId, foundPlayer.idPlayer),
        eq(log.locationId, locationId),
        eq(log.logTypeId, LOG_TYPE_SUCCESS) // Hledáme jen úspěch
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
    // Vše čisté -> generujeme nový úkol.

    const allQuestIds = await db.query.quests.findMany({ columns: { idQuest: true } });
    if (allQuestIds.length === 0) return { success: false, message: "Žádné úkoly v DB." };
    
    const randomIndex = Math.floor(Math.random() * allQuestIds.length);
    const randomQuestId = allQuestIds[randomIndex].idQuest;
    const questInfo = await db.query.quests.findFirst({ where: eq(quests.idQuest, randomQuestId) });

    await db.insert(log).values({
        gameId: 1, 
        gamesetId: locationInfo.gamesetId || 1, 
        locationId, 
        playerId: foundPlayer.idPlayer,
        logTypeId: LOG_TYPE_START,
        questId: randomQuestId,
        logTime: now.toISOString()
    });

    return {
        success: true,
        status: "active",
        playerName: foundPlayer.name,
        questName: questInfo?.name || "",
        questDescription: questInfo?.description || "",
        remainingTime: QUEST_LIMIT_SECONDS,
        questId: randomQuestId
    };

  } catch (error) {
    console.error("Chyba:", error);
    return { success: false, message: "Chyba serveru." };
  }
}

// 3. UKONČENÍ ÚKOLU (Tlačítko nebo Client Timeout)
export async function finishQuest(locationId: number, playerPass: string, resultStatus: 'success' | 'timeout') {
    try {
        const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
        if (!foundPlayer) return { success: false, message: "Auth error" };

        const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });

        // Najdeme aktivní úkol, abychom k němu přiřadili výsledek
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
} */



"use server";

import { db } from "../db/index";
import { locations, player, log, quests } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

// KONFIGURACE ČASU
const QUEST_LIMIT_SECONDS = 360; // 6 minut na splnění
const LOCKOUT_SECONDS = 300;     // 5 minut timeout


const LOG_TYPE_START = 1;
const LOG_TYPE_TIMEOUT = 2;
const LOG_TYPE_SUCCESS = 3;


// --- POMOCNÉ FUNKCE ---

function parseLocationId(rawInput: string) {
  const match = rawInput.match(/^([a-zA-Z]{2,3})(\d{1,3})$/);
  if (match && match[1] && match[2]) {
    return { codeName: match[1], id: parseInt(match[2], 10) };
  }
  return null;
}

/**
 * Vypočítá rozdíl mezi TEĎ a časem z DB v sekundách.
 * ŘEŠÍ PROBLÉM S ČASOVÝMI PÁSMY (UTC vs CET).
 */
function getDiffSeconds(dbLogTime: string | Date): number {
    const now = new Date();
    
    // Převedeme čas z DB na objekt Date
    let logDate = new Date(dbLogTime);

    // FIX: Pokud DB vrací string bez 'Z' na konci (např. "2023-12-10 18:33:00"),
    // JavaScript to bere jako lokální čas (ČR). My ale víme, že ukládáme UTC.
    // Musíme tedy říct: "Tohle je UTC čas".
    if (typeof dbLogTime === 'string' && !dbLogTime.endsWith('Z')) {
        // Zkusíme přidat Z, aby to JS parsoval jako UTC
        logDate = new Date(dbLogTime + 'Z');
    }
    
    // Pokud je formát v pořádku nebo už je to Date objekt, logDate je správně.
    // Výpočet rozdílu v sekundách:
    return (now.getTime() - logDate.getTime()) / 1000;
}


// 1. ZÍSKÁNÍ DETAILŮ O LOKACI
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

// 2. HLAVNÍ LOGIKA HRY
export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  try {
    const now = new Date(); // Aktuální čas (UTC timestamp uvnitř)

    // A) Ověření hráče
    const foundPlayer = await db.query.player.findFirst({ where: eq(player.pass, playerPass) });
    if (!foundPlayer) return { success: false, message: "Špatné heslo hráče." };

    // B) Ověření lokace
    const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });
    if (!locationInfo) return { success: false, message: "Chyba lokace." };

    // C) ZÍSKÁNÍ POSLEDNÍHO LOGU HRÁČE (KDEKOLI)
    const lastLogAnywhere = await db.query.log.findFirst({
        where: eq(log.playerId, foundPlayer.idPlayer),
        orderBy: [desc(log.logTime)], 
    });

    if (lastLogAnywhere) {
        // POUŽITÍ OPRAVENÉHO VÝPOČTU ČASU
        const diffSeconds = getDiffSeconds(lastLogAnywhere.logTime);

        // --- 1. KONTROLA: GLOBÁLNÍ TREST (TIMEOUT) ---
        if (lastLogAnywhere.logTypeId === LOG_TYPE_TIMEOUT) {
            if (diffSeconds < LOCKOUT_SECONDS) {
                const remaining = Math.ceil(LOCKOUT_SECONDS - diffSeconds);
                return { 
                    success: false, 
                    message: `Máš globální trest! Čekej.`, 
                    status: "locked",
                    remainingTime: remaining
                };
            }
        }

        // --- 2. KONTROLA: GLOBÁLNÍ AKTIVNÍ ÚKOL (START) ---
        if (lastLogAnywhere.logTypeId === LOG_TYPE_START) {
            
            // a) Čas na úkol VYPRŠEL
            if (diffSeconds > QUEST_LIMIT_SECONDS) {
                // Zapíšeme TIMEOUT
                await db.insert(log).values({
                    gameId: 1, 
                    gamesetId: locationInfo.gamesetId || 1, 
                    locationId: lastLogAnywhere.locationId, 
                    playerId: foundPlayer.idPlayer,
                    logTypeId: LOG_TYPE_TIMEOUT, 
                    questId: lastLogAnywhere.questId,
                    logTime: now.toISOString()
                });
                
                return { 
                    success: false, 
                    message: "Čas na předchozí úkol vypršel. Jsi uzamčen.", 
                    status: "locked", 
                    remainingTime: LOCKOUT_SECONDS 
                };
            }

            // b) Čas stále BĚŽÍ
            else {
                // Resume na správné lokaci
                if (lastLogAnywhere.locationId === locationId) {
                    const activeQuest = await db.query.quests.findFirst({ where: eq(quests.idQuest, lastLogAnywhere.questId!) });
                    
                    return {
                        success: true,
                        status: "active",
                        playerName: foundPlayer.name,
                        questName: activeQuest?.name || "Neznámý úkol",
                        questDescription: activeQuest?.description || "",
                        remainingTime: Math.ceil(QUEST_LIMIT_SECONDS - diffSeconds),
                        questId: lastLogAnywhere.questId
                    };
                } 
                // Pokus o start jinde během aktivního úkolu
                else {
                    const otherLoc = await db.query.locations.findFirst({
                        where: eq(locations.idLocation, lastLogAnywhere.locationId),
                        columns: { name: true, idLocation: true }
                    });
                    return {
                        success: false,
                        message: `Máš rozdělaný úkol jinde! (${otherLoc?.name}${otherLoc?.idLocation}).`,
                        status: "error"
                    };
                }
            }
        }
    }

    // --- 3. KONTROLA: LOKÁLNÍ SPLNĚNÍ (SUCCESS) ---
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
    const allQuestIds = await db.query.quests.findMany({ columns: { idQuest: true } });
    if (allQuestIds.length === 0) return { success: false, message: "Žádné úkoly v DB." };
    
    const randomQuestId = allQuestIds[Math.floor(Math.random() * allQuestIds.length)].idQuest;
    const questInfo = await db.query.quests.findFirst({ where: eq(quests.idQuest, randomQuestId) });

    await db.insert(log).values({
        gameId: 1, 
        gamesetId: locationInfo.gamesetId || 1, 
        locationId, 
        playerId: foundPlayer.idPlayer,
        logTypeId: LOG_TYPE_START,
        questId: randomQuestId,
        logTime: now.toISOString() // Ukládáme jako UTC ISO string
    });

    return {
        success: true,
        status: "active",
        playerName: foundPlayer.name,
        questName: questInfo?.name || "",
        questDescription: questInfo?.description || "",
        remainingTime: QUEST_LIMIT_SECONDS,
        questId: randomQuestId
    };

  } catch (error) {
    console.error("Chyba:", error);
    return { success: false, message: "Chyba serveru." };
  }
}

// 3. UKONČENÍ ÚKOLU
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