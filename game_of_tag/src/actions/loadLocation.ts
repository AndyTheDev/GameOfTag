"use server";

import { db } from "../db/index";
import { locations, players, logs, quests, gameSessions, teams } from "../db/schema";
import { eq, and, desc, sql, gt } from "drizzle-orm";
import { checkRateLimit } from "../utils/rateLimit";
import { getClientKey } from "../utils/requestContext";
import { 
  CHECKPOINT_RADIUS_METERS, 
  QUEST_LIMIT_SECONDS, 
  LOCKOUT_SECONDS, 
  LOG_TYPE_START,
  LOG_TYPE_TIMEOUT,
  LOG_TYPE_SUCCESS,
  LOG_TYPE_GPS_NOT_ACCURATE,
  ROLE_RUNNER_ID
} from '../constants';

// --- POMOCNÉ FUNKCE ---
function parseGpsString(gps: string): { lat: number; lng: number } | null {
  const match = gps.match(/^([\d.]+)([NS]),?\s*([\d.]+)([EW])$/i);
  if (!match) return null;
  let lat = parseFloat(match[1]);
  let lng = parseFloat(match[3]);
  if (match[2].toUpperCase() === 'S') lat = -lat;
  if (match[4].toUpperCase() === 'W') lng = -lng;
  return { lat, lng };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; 
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- VALIDACE ---
async function validatePlayerStatus(password: string) {
  const player = await db.query.players.findFirst({
    where: eq(players.pass, password),
  });

  if (!player) {
    return { valid: false, message: "Neplatné heslo.", player: null };
  }

  if (player.roleId !== ROLE_RUNNER_ID) {
    return { valid: false, message: "Lovci nemohou hledat a plnit checkpointy.", player };
  }

  // FIX: Kontrola zámku s ošetřením záporných hodnot nebo nesmyslně dlouhých časů
  if (player.questLock && player.questLockEndtime) {
    const now = new Date();
    const lockEnd = new Date(player.questLockEndtime);
    
    if (lockEnd > now) {
      const remainingMs = lockEnd.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      
      // Pokud by náhodou výpočet hodil nesmysl (např. > 60 min), zobrazíme max 5 min (standardní lock)
      // To řeší tvůj "10 minutový" bug, pokud vznikl posunem času.
      const displayMinutes = remainingMinutes > 10 ? 5 : remainingMinutes;

      return { 
        valid: false, 
        message: `Máš aktivní trest. Zbývá ${displayMinutes} min.`,
        player 
      };
    }
  }

  return { valid: true, player };
}

// --- EXPORTED ACTIONS ---

export async function verifyPlayer(password: string) {
  const status = await validatePlayerStatus(password);
  
  if (status.valid && status.player) {
    const displayName = status.player.playName || status.player.name;
    return { success: true, playerName: displayName };
  }

  return { success: false, message: status.message };
}

export async function logGpsError(password: string, accuracy: number) {
    try {
        const validation = await validatePlayerStatus(password);
        if (!validation.player) return { success: false };

        const player = validation.player;
        const lastSession = await db.query.gameSessions.findFirst({ orderBy: [desc(gameSessions.idGameSession)]});
        const gameId = lastSession ? lastSession.idGameSession : 1;

        await db.insert(logs).values({
            gameId: gameId,
            logTypeId: LOG_TYPE_GPS_NOT_ACCURATE,
            playerId: player.idPlayer,
            logTime: new Date()
        });

        return { success: true };
    } catch (e) {
        console.error("logGpsError failed", e);
        return { success: false };
    }
}


export type FindNearestResult = 
  | { 
      success: true; 
      withinRadius: boolean; 
      checkpoint: {
        id: number;
        name: string;
        code: string;
        type: number;
        distanceMeters: number;
        accuracyMeters: number; 
      } 
    }
  | { 
      success: false; 
      message: string 
    };

export async function findNearestCheckpoint(
  password: string,
  playerLat: number,
  playerLng: number,
  accuracy: number
): Promise<FindNearestResult> {
  const clientKey = await getClientKey();
  const limit = checkRateLimit(`findNearestCheckpoint:${clientKey}`, { windowMs: 10_000, max: 15 });
  
  if (!limit.allowed) {
    return { success: false, message: "Příliš mnoho požadavků, zkus to za chvíli." };
  }

  try {
    const validation = await validatePlayerStatus(password);
    if (!validation.player) { 
        return { success: false, message: validation.message || "Neautorizovaný přístup." };
    }
    if (!validation.valid) {
        return { success: false, message: validation.message || "Nemůžeš hledat checkpointy." };
    }

    const player = validation.player;

    if (!player.teamId) {
      return { success: false, message: "Hráč není přiřazen k žádnému týmu." };
    }

    // B. Získání POUZE ÚSPĚŠNĚ splněných lokací
    // Díky podmínce logTypeId === LOG_TYPE_SUCCESS se zde neobjeví lokace, 
    // kde hráč dostal Timeout. Tyto lokace tedy budou pro algoritmus "neviditelné" v seznamu hotových,
    // a proto je najde jako dostupné (což řeší tvůj Problém 1).
    const completedLogs = await db.query.logs.findMany({
      where: and(
        eq(logs.playerId, player.idPlayer), 
        eq(logs.logTypeId, LOG_TYPE_SUCCESS) 
      ),
      columns: {
        locationId: true
      }
    });

    const completedLocationIds = new Set(completedLogs.map(log => log.locationId));

    const teamLocations = await db.query.locations.findMany({
      where: eq(locations.teamId, player.teamId),
      columns: { idLocation: true, name: true, gps: true, typeId: true }
    });

    if (teamLocations.length === 0) {
      return { success: false, message: "Tvůj tým nemá žádné aktivní checkpointy." };
    }

    let nearest: { id: number; name: string; distance: number; type: number } | null = null;

    for (const loc of teamLocations) {
      if (completedLocationIds.has(loc.idLocation)) continue;

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
      return { success: false, message: "Všechny dostupné checkpointy máš splněné!" };
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
        distanceMeters: Math.round(nearest.distance),
        accuracyMeters: Math.round(accuracy)
      }
    };

  } catch (error) {
    console.error("Chyba v findNearestCheckpoint:", error);
    return { 
      success: false, 
      message: "Nastala neočekávaná chyba na serveru." 
    };
  }
}

export async function checkActiveQuest(password: string) {
  const validation = await validatePlayerStatus(password);
  
  if (!validation.player) {
    return { hasActive: false };
  }

  const player = validation.player;

  const lastStartLog = await db.query.logs.findFirst({
    where: and(
      eq(logs.playerId, player.idPlayer),
      eq(logs.logTypeId, LOG_TYPE_START)
    ),
    orderBy: [desc(logs.logTime)],
  });

  if (!lastStartLog || !lastStartLog.locationId) {
      return { hasActive: false }; 
  }

  // Kontrola, zda úkol neskončil (úspěchem nebo timeoutem)
  const endLog = await db.query.logs.findFirst({
    where: and(
      eq(logs.playerId, player.idPlayer),
      gt(logs.logTime, lastStartLog.logTime),
      sql`${logs.logTypeId} IN (${LOG_TYPE_SUCCESS}, ${LOG_TYPE_TIMEOUT})`
    )
  });

  if (endLog) return { hasActive: false };

  // Kontrola času - pokud CRON selhal a neuzavřel úkol, zde zjistíme, že už je expirovaný.
  // Vracíme false, aby hráč mohl "jakoby" skenovat, ale verifyAndLogQuest ho pak potrestá (Lazy Cleanup).
  // Toto je fail-safe mechanismus.
  const startTime = new Date(lastStartLog.logTime).getTime();
  const now = Date.now();
  const timeLimitMs = QUEST_LIMIT_SECONDS * 1000;
  const endTime = startTime + timeLimitMs;

  if (now > endTime) {
      return { hasActive: false };
  }

  const location = await db.query.locations.findFirst({
      where: eq(locations.idLocation, lastStartLog.locationId)
  });

  if (!location) {
      return { hasActive: false };
  }

  const code = `${location.name}${location.idLocation}`;

  return { 
    hasActive: true, 
    code: code,
    locationId: location.idLocation 
  };
}

export async function verifyAndLogQuest(locationId: number, password: string) {
  try {
    const validation = await validatePlayerStatus(password);
    
    if (!validation.valid) {
         if (validation.player && validation.player.questLockEndtime) {
             return { 
                success: true, 
                status: "locked", 
                startTime: validation.player.questLockEndtime 
             };
        }
        return { success: false, message: validation.message || "Chyba ověření." };
    }

    const player = validation.player!;

    let teamName = "Neznámý tým";
    if (player.teamId) {
        const team = await db.query.teams.findFirst({
            where: eq(teams.idTeam, player.teamId)
        });
        if (team) teamName = team.name;
    }

    // 1. RESUME LOGIKA
    const lastStartLog = await db.query.logs.findFirst({
      where: and(
        eq(logs.playerId, player.idPlayer),
        eq(logs.locationId, locationId),
        eq(logs.logTypeId, LOG_TYPE_START)
      ),
      orderBy: [desc(logs.logTime)],
    });

    let activeQuestId: number | null = null;
    let activeStartTime: Date | null = null;

    if (lastStartLog) {
      // Zkontrolujeme, zda tento konkrétní start log už nebyl ukončen
      const endLog = await db.query.logs.findFirst({
        where: and(
            eq(logs.playerId, player.idPlayer),
            gt(logs.logTime, lastStartLog.logTime),
            sql`${logs.logTypeId} IN (${LOG_TYPE_SUCCESS}, ${LOG_TYPE_TIMEOUT})`
        )
      });

      // Pokud NEBYL ukončen (tzn. je aktivní nebo "zombie"), řešíme ho
      if (!endLog) {
        const startTimeMs = new Date(lastStartLog.logTime).getTime();
        const limitMs = QUEST_LIMIT_SECONDS * 1000;
        
        // ZOMBIE CHECK (Fallback, pokud CRON nejel)
        if (Date.now() > startTimeMs + limitMs) {
          // Voláme finishQuest s timeoutem
          await finishQuest(locationId, password, 'timeout');
          
          const refreshedPlayer = await db.query.players.findFirst({
            where: eq(players.idPlayer, player.idPlayer)
          });
          
          return {
            success: true,
            status: "locked",
            startTime: refreshedPlayer?.questLockEndtime
          };
        }

        activeQuestId = lastStartLog.questId || null;
        activeStartTime = lastStartLog.logTime;
      }
      // Pokud BYL ukončen (endLog existuje), activeQuestId zůstane null a kód spadne do bloku "2. NOVÝ ÚKOL", což umožní RESCAN.
    }

    // 2. NOVÝ ÚKOL
    if (!activeQuestId) {
      const location = await db.query.locations.findFirst({
        where: eq(locations.idLocation, locationId)
      });

      if (!location) return { success: false, message: "Lokace nenalezena." };

      const randomQuest = await db.query.quests.findFirst({
         where: eq(quests.questTypeId, location.typeId),
         orderBy: sql`RANDOM()`
      });

      if (!randomQuest) {
        return { success: false, message: "Pro tuto lokaci nejsou definovány žádné úkoly." };
      }

      activeQuestId = randomQuest.idQuest;
      const now = new Date();
      activeStartTime = now;
      const questDeadline = new Date(activeStartTime.getTime() + QUEST_LIMIT_SECONDS * 1000);

      const lastSession = await db.query.gameSessions.findFirst({ orderBy: [desc(gameSessions.idGameSession)]});
      const gameId = lastSession ? lastSession.idGameSession : 1; 

      await db.transaction(async (tx) => {
          await tx.insert(logs).values({
            gameId: gameId,
            logTypeId: LOG_TYPE_START,
            playerId: player.idPlayer,
            locationId: locationId,
            questId: activeQuestId!,
            logTime: now
          });

          await tx.update(players)
            .set({ questEndTime: questDeadline })
            .where(eq(players.idPlayer, player.idPlayer));
      });
    }

    const questDetails = await db.query.quests.findFirst({
      where: eq(quests.idQuest, activeQuestId!)
    });

    if (!questDetails) return { success: false, message: "Detaily úkolu nenalezeny." };

    return {
      success: true,
      status: "active",
      startTime: activeStartTime,
      playerName: player.playName || player.name,
      teamName: teamName,
      questName: questDetails.name,
      questDescription: questDetails.description
    };

  } catch (e) {
    console.error("verifyAndLogQuest error:", e);
    return { success: false, message: "Chyba serveru při načítání úkolu." };
  }
}

export async function finishQuest(locationId: number, password: string, result: 'success' | 'timeout') {
  try {
    const validation = await validatePlayerStatus(password);
    if (!validation.player) return { success: false, message: "Hráč nenalezen." };
    const player = validation.player;

    const lastSession = await db.query.gameSessions.findFirst({ orderBy: [desc(gameSessions.idGameSession)]});
    const gameId = lastSession ? lastSession.idGameSession : 1;

    if (result === 'success') {
      await db.transaction(async (tx) => {
          await tx.insert(logs).values({
            gameId: gameId,
            logTypeId: LOG_TYPE_SUCCESS,
            playerId: player.idPlayer,
            locationId: locationId,
            logTime: new Date()
          });
          
          await tx.update(players)
            .set({ 
                points: sql`${players.points} + 1`,
                questEndTime: null 
            }) 
            .where(eq(players.idPlayer, player.idPlayer));
      });
      return { success: true, status: "completed" };

    } else {
      const now = new Date();
      const lockUntil = new Date(now.getTime() + LOCKOUT_SECONDS * 1000);

      await db.transaction(async (tx) => {
          await tx.insert(logs).values({
            gameId: gameId,
            logTypeId: LOG_TYPE_TIMEOUT,
            playerId: player.idPlayer,
            locationId: locationId,
            logTime: now
          });

          await tx.update(players).set({
            questLock: true,
            questLockEndtime: lockUntil,
            questEndTime: null 
          }).where(eq(players.idPlayer, player.idPlayer));
      });
      return { success: true, status: "locked" };
    }

  } catch (e) {
    console.error("finishQuest error:", e);
    return { success: false, message: "Chyba při ukládání výsledku." };
  }
}

export async function getLocationDetails(codeStr: string) {
     const match = codeStr.match(/^([^\d]+)(\d+)$/);
     if(!match) return { success: false, message: "Neplatný formát kódu." };
    
     const id = parseInt(match[2]);

     try {
         const loc = await db.query.locations.findFirst({
             where: eq(locations.idLocation, id),
             columns: { idLocation: true, name: true }
         });
        
         if (!loc) return { success: false, message: "Lokace neexistuje." };

         return { success: true, id: loc.idLocation, name: loc.name };
     } catch (e) {
         return { success: false, message: "DB Error" };
     }
}
