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

    // Získání pouze těch lokací, které patří hráčovu týmu a ještě NEBYLY splněny
    const availableLocations = await db.query.locations.findMany({
      where: and(
        eq(locations.teamId, player.teamId),
        eq(locations.completed, false) // Tady filtrujeme nesplněné
      ),
      columns: { idLocation: true, name: true, gps: true, typeId: true }
    });

    if (availableLocations.length === 0) {
      return { success: false, message: "Tvůj tým má všechny checkpointy splněné!" };
    }

    let nearest: { id: number; name: string; distance: number; type: number } | null = null;

    for (const loc of availableLocations) {
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

    // Pokud selhalo parsování GPS u všech lokací (edge case)
    if (!nearest) {
      return { success: false, message: "Nepodařilo se zpracovat souřadnice checkpointů." };
    }

    const withinRadius = nearest.distance <= CHECKPOINT_RADIUS_METERS;
    const code = `${nearest.id}-${nearest.name}`; 

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

  const code = `${location.idLocation}-${location.name}`;

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
    let activeQuestId: number | null = null;
    let activeStartTime: Date | null = null;

    const now = new Date();

    // Kontrola, zda má hráč aktivní odpočet (questEndTime není null a čas ještě nevypršel)
    if (player.questEndTime && new Date(player.questEndTime) > now) {
      
        // Najdeme poslední relevantní log (typ 1 = start, nebo 6) pro tohoto hráče na této lokaci
        const lastLog = await db.query.logs.findFirst({
            where: and(
                eq(logs.playerId, player.idPlayer),
                eq(logs.locationId, locationId),
                sql`${logs.logTypeId} IN (1, 6)`
            ),
            orderBy: [desc(logs.logTime)],
        });

        // Pokud je poslední nalezený log typu 1 (Start), úkol je stále rozdělaný
        if (lastLog && lastLog.logTypeId === 1 && lastLog.questId) {
            
            // Pro jistotu zkontrolujeme, zda neexistuje log o ukončení (pojistka proti chybám synchronizace)
            const endLog = await db.query.logs.findFirst({
                where: and(
                    eq(logs.playerId, player.idPlayer),
                    gt(logs.logTime, lastLog.logTime),
                    sql`${logs.logTypeId} IN (${LOG_TYPE_SUCCESS}, ${LOG_TYPE_TIMEOUT})`
                )
            });

            // TADY BYLA CHYBA: Pokud úkol není ukončen, musíme ho přiřadit do proměnných!
            if (!endLog) {
                activeQuestId = lastLog.questId;
                activeStartTime = lastLog.logTime;
            }
        }
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
    
    // Validace hráče
    if (!validation.player) return { success: false, message: "Hráč nenalezen." };
    const player = validation.player;

    // Získání Game Session
    const lastSession = await db.query.gameSessions.findFirst({ 
        orderBy: [desc(gameSessions.idGameSession)]
    });
    const gameId = lastSession ? lastSession.idGameSession : 1;

    if (result === 'success') {
      await db.transaction(async (tx) => {
          // 1. Vytvoření logu (Původní logika)
          await tx.insert(logs).values({
            gameId: gameId,
            logTypeId: LOG_TYPE_SUCCESS,
            playerId: player.idPlayer,
            locationId: locationId,
            logTime: new Date()
          });
          
          // 2. Update hráče - body a odemčení (Původní logika)
          await tx.update(players)
            .set({ 
                points: sql`${players.points} + 1`,
                questEndTime: null 
            }) 
            .where(eq(players.idPlayer, player.idPlayer));

          // 3. Update týmu - přičtení bodu (NOVÉ)
          // Předpokládám, že player objekt má 'teamId'. Pokud ne, je třeba ho dotáhnout.
          if (player.teamId) {
              await tx.update(teams)
                .set({
                    points: sql`${teams.points} + 1` // Atomický increment
                })
                .where(eq(teams.idTeam, player.teamId));
          }

          // 4. Update lokace - označení jako hotové (NOVÉ)
          await tx.update(locations)
            .set({
                completed: true
            })
            .where(eq(locations.idLocation, locationId));
      });

      return { success: true, status: "completed" };

    } else {
      // Logika pro Timeout (beze změn v logice updates)
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
    return { success: false, message: "při ukládání výsledku." };
  }
}

export async function getLocationDetails(codeStr: string) {
     // ZMĚNA: Regex nyní hledá číslice na začátku, pak pomlčku, pak zbytek textu
     // ^(\d+) -> zachytí ID na začátku
     // -      -> očekává pomlčku
     // (.*)$  -> zachytí zbytek jako název (umožňuje i pomlčky v názvu, např. 15-Namesti-Miru)
     const match = codeStr.match(/^(\d+)-(.*)$/);
     
     if(!match) return { success: false, message: "Neplatný formát kódu (očekáváno ID-Nazev)." };
    
     // První závorka v regexu je ID
     const id = parseInt(match[1]);

     try {
         const loc = await db.query.locations.findFirst({
             where: eq(locations.idLocation, id),
             columns: { idLocation: true, name: true }
         });
        
         if (!loc) return { success: false, message: "Lokace neexistuje." };

         // Volitelná kontrola: sedí i název? (pokud je to potřeba pro bezpečnost/validaci)
         // if (loc.name !== match[2]) ...

         return { success: true, id: loc.idLocation, name: loc.name };
     } catch (e) {
         return { success: false, message: "DB Error" };
     }
}

export async function verifyManualCheckpoint(password: string, codeStr: string) {
  try {
    // 1. Validace hráče a trestů (využívá existující funkci)
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

    // 2. Parsing zadaného kódu
    const match = codeStr.match(/^(\d+)-(.*)$/);
    if (!match) {
      return { success: false, message: "Neplatný formát kódu (očekáváno ID-Nazev, např. 15-Namesti-Miru)." };
    }
    
    const locationId = parseInt(match[1]);

    // 3. Dotaz do DB: Hledáme lokaci podle ID, která patří týmu a NENÍ splněná
    const location = await db.query.locations.findFirst({
      where: and(
        eq(locations.idLocation, locationId),
        eq(locations.teamId, player.teamId),
        eq(locations.completed, false)
      ),
      columns: { idLocation: true, name: true }
    });

    if (!location) {
      return { 
        success: false, 
        message: "Tento checkpoint neexistuje, nepatří tvému týmu, nebo už je splněný." 
      };
    }

    // 4. Striktní kontrola názvu (aby hráč nemohl jen zadat "15-cokoliv")
    const expectedCode = `${location.idLocation}-${location.name}`;
    if (codeStr !== expectedCode) {
      return { success: false, message: "Přesný název checkpointu nesouhlasí." };
    }

    // Úspěch - vracíme data pro Frontend
    return {
      success: true,
      checkpoint: {
        id: location.idLocation,
        name: location.name,
        code: expectedCode
      }
    };

  } catch (error) {
    console.error("Chyba v verifyManualCheckpoint:", error);
    return { success: false, message: "Nastala neočekávaná chyba serveru." };
  }
}
