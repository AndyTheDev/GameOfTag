"use server";

import { db } from "../db/index";
import { locations, players, logs, quests } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { checkRateLimit } from "../utils/rateLimit";
import { getClientKey } from "../utils/requestContext";
import { handleServerError } from "../utils/errorHandling";
import { logInfo } from "../utils/logger";
import { emitLogUpdate } from "../utils/logStream";

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

// --- GPS / Proximity functions ---

const CHECKPOINT_RADIUS_METERS = 100;

/**
 * Parse GPS string like "50.0847061N, 14.4610453E" into {lat, lng}
 */
function parseGpsString(gps: string): { lat: number; lng: number } | null {
  // Format: "50.0847061N, 14.4610453E"
  const match = gps.match(/^([\d.]+)([NS]),?\s*([\d.]+)([EW])$/i);
  if (!match) return null;
  
  let lat = parseFloat(match[1]);
  let lng = parseFloat(match[3]);
  
  if (match[2].toUpperCase() === 'S') lat = -lat;
  if (match[4].toUpperCase() === 'W') lng = -lng;
  
  return { lat, lng };
}

/**
 * Haversine distance in meters between two lat/lng points
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearest checkpoint to given coordinates
 */
export async function findNearestCheckpoint(playerLat: number, playerLng: number) {
  const clientKey = await getClientKey();
  const limit = checkRateLimit(`findNearestCheckpoint:${clientKey}`, { windowMs: 10_000, max: 15 });
  if (!limit.allowed) {
    return { success: false, message: "Příliš mnoho požadavků, zkus to za chvíli." };
  }

  try {
    const allLocations = await db.query.locations.findMany({
      columns: { idLocation: true, name: true, gps: true, typeId: true }
    });

    if (allLocations.length === 0) {
      return { success: false, message: "Žádné checkpointy v databázi." };
    }

    let nearest: { id: number; name: string; distance: number; type: number } | null = null;

    for (const loc of allLocations) {
      const coords = parseGpsString(loc.gps);
      if (!coords) continue;

      const distance = haversineDistance(playerLat, playerLng, coords.lat, coords.lng);
      
      if (!nearest || distance < nearest.distance) {
        nearest = {
          id: loc.idLocation,
          name: loc.name,
          distance,
          type: loc.typeId
        };
      }
    }

    if (!nearest) {
      return { success: false, message: "Nepodařilo se najít žádný checkpoint." };
    }

    const withinRadius = nearest.distance <= CHECKPOINT_RADIUS_METERS;
    const code = `${nearest.name}${nearest.id}`;

    return {
      success: true,
      withinRadius,
      checkpoint: {
        id: nearest.id,
        name: nearest.name,
        code,
        type: nearest.type,
        distanceMeters: Math.round(nearest.distance)
      }
    };
  } catch (error) {
    return handleServerError("Chyba serveru.", error, { action: "findNearestCheckpoint" });
  }
}

// 3. UKONČENÍ ÚKOLU (Beze změny)
export async function finishQuest(locationId: number, playerPass: string, resultStatus: 'success' | 'timeout') {
    const clientKey = await getClientKey();
    const limit = checkRateLimit(`finishQuest:${clientKey}`, { windowMs: 10_000, max: 10 });
    if (!limit.allowed) {
        return { success: false, message: "Příliš mnoho požadavků, zkus to později." };
    }

    try {
        const foundPlayer = await db.query.players.findFirst({ where: eq(players.pass, playerPass) });
        if (!foundPlayer) return { success: false, message: "Auth error" };

        const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });

        const lastLog = await db.query.logs.findFirst({
            where: and(eq(logs.playerId, foundPlayer.idPlayer), eq(logs.locationId, locationId)),
            orderBy: [desc(logs.logTime)],
        });

        await db.insert(logs).values({
            gameId: 1,
            locationId, playerId: foundPlayer.idPlayer,
            logTypeId: resultStatus === 'success' ? LOG_TYPE_SUCCESS : LOG_TYPE_TIMEOUT,
            questId: lastLog?.questId || null,
            logTime: new Date()
        });
        emitLogUpdate();
        logInfo("Log finish zapsan", { playerId: foundPlayer.idPlayer, locationId, resultStatus });

        return { success: true };
    } catch (e) {
        return handleServerError("Chyba při ukládání.", e, { action: "finishQuest" });
    }
}