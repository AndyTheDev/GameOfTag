// // "use server";

// // import { db } from "../db/index";
// // import { locations, players, logs, quests } from "../db/schema";
// // import { eq, and, desc } from "drizzle-orm";
// // import { checkRateLimit } from "../utils/rateLimit";
// // import { getClientKey } from "../utils/requestContext";
// // import { handleServerError } from "../utils/errorHandling";
// // import { logInfo } from "../utils/logger";
// // import { emitLogUpdate } from "../utils/logStream";
// // import { QUEST_LIMIT_SECONDS, LOCKOUT_SECONDS, LOG_TYPE_START, LOG_TYPE_TIMEOUT, LOG_TYPE_SUCCESS, CHECKPOINT_RADIUS_METERS } from '../constants';

// // // funkce

// // function parseLocationId(rawInput: string) {
// //   const match = rawInput.match(/^([a-zA-Z]{2,3})(\d{1,3})$/);
// //   if (match && match[1] && match[2]) {
// //     return { codeName: match[1], id: parseInt(match[2], 10) };
// //   }
// //   return null;
// // }

// // function normalizeLogTime(dbLogTime: string | Date): string {
// //     if (dbLogTime instanceof Date) {
// //         return dbLogTime.toISOString();
// //     }
// //     if (typeof dbLogTime === 'string' && !dbLogTime.endsWith('Z')) {
// //         return new Date(dbLogTime + 'Z').toISOString();
// //     }
// //     return new Date(dbLogTime).toISOString();
// // }

// // function getDiffSeconds(dbLogTime: string | Date): number {
// //     const now = new Date();
// //     const logDate = new Date(normalizeLogTime(dbLogTime));
// //     return (now.getTime() - logDate.getTime()) / 1000;
// // }

// // // --- GPS / Proximity functions ---

// // /**
// //  * Parse GPS string like "50.0847061N, 14.4610453E" into {lat, lng}
// //  */
// // function parseGpsString(gps: string): { lat: number; lng: number } | null {
// //   // Format: "50.0847061N, 14.4610453E"
// //   const match = gps.match(/^([\d.]+)([NS]),?\s*([\d.]+)([EW])$/i);
// //   if (!match) return null;
  
// //   let lat = parseFloat(match[1]);
// //   let lng = parseFloat(match[3]);
  
// //   if (match[2].toUpperCase() === 'S') lat = -lat;
// //   if (match[4].toUpperCase() === 'W') lng = -lng;
  
// //   return { lat, lng };
// // }

// // /**
// //  * Haversine distance in meters between two lat/lng points
// //  */
// // function haversineDistance(
// //   lat1: number, lng1: number,
// //   lat2: number, lng2: number
// // ): number {
// //   const R = 6371000; // Earth radius in meters
// //   const toRad = (deg: number) => (deg * Math.PI) / 180;
  
// //   const dLat = toRad(lat2 - lat1);
// //   const dLng = toRad(lng2 - lng1);
  
// //   const a =
// //     Math.sin(dLat / 2) ** 2 +
// //     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  
// //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// //   return R * c;
// // }

// // /**
// //  * Find nearest checkpoint to given coordinates
// //  */
// // // 1. Definice typu (Discriminated Union)
// // export type FindNearestResult = 
// //   | { 
// //       success: true; 
// //       withinRadius: boolean; 
// //       checkpoint: {
// //         id: number;
// //         name: string;
// //         code: string;
// //         type: number;
// //         distanceMeters: number;
// //         accuracyMeters: number; } 
// //     }
// //   | { 
// //       success: false; 
// //       message: string 
// //     };

// // export async function findNearestCheckpoint(
// //   playerLat: number,
// //   playerLng: number,
// //   accuracy: number
// // ): Promise<FindNearestResult> {
// //   const clientKey = await getClientKey();
// //   const limit = checkRateLimit(`findNearestCheckpoint:${clientKey}`, { windowMs: 10_000, max: 15 });
  
// //   if (!limit.allowed) {
// //     return { success: false, message: "Příliš mnoho požadavků, zkus to za chvíli." };
// //   }

// //   try {
// //     const allLocations = await db.query.locations.findMany({
// //       columns: { idLocation: true, name: true, gps: true, typeId: true }
// //     });

// //     if (allLocations.length === 0) {
// //       return { success: false, message: "Žádné checkpointy v databázi." };
// //     }

// //     let nearest: { id: number; name: string; distance: number; type: number } | null = null;

// //     for (const loc of allLocations) {
// //       const coords = parseGpsString(loc.gps);
// //       if (!coords) continue;

// //       const distance = haversineDistance(playerLat, playerLng, coords.lat, coords.lng);
      
// //       if (!nearest || distance < nearest.distance) {
// //         nearest = {
// //           id: loc.idLocation,
// //           name: loc.name,
// //           distance,
// //           type: loc.typeId
// //         };
// //       }
// //     }

// //     if (!nearest) {
// //       return { success: false, message: "Nepodařilo se najít žádný checkpoint." };
// //     }

// //     const withinRadius = nearest.distance <= CHECKPOINT_RADIUS_METERS;
// //     const code = `${nearest.name}${nearest.id}`;

// //     return {
// //       success: true,
// //       withinRadius,
// //       checkpoint: {
// //         id: nearest.id,
// //         name: nearest.name,
// //         code,
// //         type: nearest.type,
// //         distanceMeters: Math.round(nearest.distance),
// //         accuracyMeters: Math.round(accuracy)
// //       }
// //     };

// //   } catch (error) {
// //     console.error("Chyba v findNearestCheckpoint:", error);
// //     return { 
// //       success: false, 
// //       message: "Nastala neočekávaná chyba na serveru." 
// //     };
// //   }
// // }

// // // 3. UKONČENÍ ÚKOLU (Beze změny)
// // export async function finishQuest(locationId: number, playerPass: string, resultStatus: 'success' | 'timeout') {
// //     const clientKey = await getClientKey();
// //     const limit = checkRateLimit(`finishQuest:${clientKey}`, { windowMs: 10_000, max: 10 });
// //     if (!limit.allowed) {
// //         return { success: false, message: "Příliš mnoho požadavků, zkus to později." };
// //     }

// //     try {
// //         const foundPlayer = await db.query.players.findFirst({ where: eq(players.pass, playerPass) });
// //         if (!foundPlayer) return { success: false, message: "Auth error" };

// //         const locationInfo = await db.query.locations.findFirst({ where: eq(locations.idLocation, locationId) });

// //         const lastLog = await db.query.logs.findFirst({
// //             where: and(eq(logs.playerId, foundPlayer.idPlayer), eq(logs.locationId, locationId)),
// //             orderBy: [desc(logs.logTime)],
// //         });

// //         await db.insert(logs).values({
// //             gameId: 1,
// //             locationId, playerId: foundPlayer.idPlayer,
// //             logTypeId: resultStatus === 'success' ? LOG_TYPE_SUCCESS : LOG_TYPE_TIMEOUT,
// //             questId: lastLog?.questId || null,
// //             logTime: new Date()
// //         });
// //         emitLogUpdate();
// //         logInfo("Log finish zapsan", { playerId: foundPlayer.idPlayer, locationId, resultStatus });

// //         return { success: true };
// //     } catch (e) {
// //         return handleServerError("Chyba při ukládání.", e, { action: "finishQuest" });
// //     }
// // }

// // --- VERSION 2 - VALIDACE PŘED SKENEM POLOHY ---
// "use server";

// import { db } from "../db/index";
// import { locations, players } from "../db/schema";
// import { eq } from "drizzle-orm";
// import { checkRateLimit } from "../utils/rateLimit";
// import { getClientKey } from "../utils/requestContext";
// import { CHECKPOINT_RADIUS_METERS } from '../constants';

// // --- Helper Functions ---

// function parseGpsString(gps: string): { lat: number; lng: number } | null {
//   const match = gps.match(/^([\d.]+)([NS]),?\s*([\d.]+)([EW])$/i);
//   if (!match) return null;
  
//   let lat = parseFloat(match[1]);
//   let lng = parseFloat(match[3]);
  
//   if (match[2].toUpperCase() === 'S') lat = -lat;
//   if (match[4].toUpperCase() === 'W') lng = -lng;
  
//   return { lat, lng };
// }

// function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371000; 
//   const toRad = (deg: number) => (deg * Math.PI) / 180;
  
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);
  
//   const a = Math.sin(dLat / 2) ** 2 +
//             Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// /**
//  * Validuje, zda hráč může hrát (existuje, je běžec, nemá ban).
//  */
// async function validatePlayerStatus(password: string) {
//   const player = await db.query.players.findFirst({
//     where: eq(players.pass, password),
//   });

//   if (!player) {
//     return { valid: false, message: "Neplatné heslo." };
//   }

//   // 1. Kontrola Role (1 = Běžec)
//   // Předpokládáme, že role_id 1 je Běžec. Pokud je to jinak v DB seedu, upravit.
//   if (player.roleId !== 1) {
//     return { valid: false, message: "Lovci nemohou hledat a plnit checkpointy." };
//   }

//   // 2. Kontrola Trestu (Quest Lock)
//   if (player.questLock && player.questLockEndtime) {
//     const now = new Date();
//     const lockEnd = new Date(player.questLockEndtime);
    
//     if (lockEnd > now) {
//       const remainingMs = lockEnd.getTime() - now.getTime();
//       const remainingMinutes = Math.ceil(remainingMs / 60000);
//       return { 
//         valid: false, 
//         message: `Ještě nemůžeš plnit úkoly. Zbývá ti ${remainingMinutes} min trestu.` 
//       };
//     }
//   }

//   return { valid: true, player };
// }

// // --- Exported Actions ---

// /**
//  * Pouze ověří hráče pro UI (login screen)
//  */
// export async function verifyPlayer(password: string) {
//   const status = await validatePlayerStatus(password);
//   return { success: status.valid, message: status.message };
// }

// export type FindNearestResult = 
//   | { 
//       success: true; 
//       withinRadius: boolean; 
//       checkpoint: {
//         id: number;
//         name: string;
//         code: string;
//         type: number;
//         distanceMeters: number;
//         accuracyMeters: number; 
//       } 
//     }
//   | { 
//       success: false; 
//       message: string 
//     };

// export async function findNearestCheckpoint(
//   password: string, // PŘIDÁNO: Heslo je nutné pro každé volání
//   playerLat: number,
//   playerLng: number,
//   accuracy: number
// ): Promise<FindNearestResult> {
//   const clientKey = await getClientKey();
//   const limit = checkRateLimit(`findNearestCheckpoint:${clientKey}`, { windowMs: 10_000, max: 15 });
  
//   if (!limit.allowed) {
//     return { success: false, message: "Příliš mnoho požadavků, zkus to za chvíli." };
//   }

//   try {
//     // A. Validace hráče před hledáním
//     const validation = await validatePlayerStatus(password);
//     if (!validation.valid) {
//         return { success: false, message: validation.message || "Neautorizovaný přístup." };
//     }

//     // B. Logika hledání (původní kód)
//     const allLocations = await db.query.locations.findMany({
//       columns: { idLocation: true, name: true, gps: true, typeId: true }
//     });

//     if (allLocations.length === 0) {
//       return { success: false, message: "Žádné checkpointy v databázi." };
//     }

//     let nearest: { id: number; name: string; distance: number; type: number } | null = null;

//     for (const loc of allLocations) {
//       const coords = parseGpsString(loc.gps);
//       if (!coords) continue;

//       const distance = haversineDistance(playerLat, playerLng, coords.lat, coords.lng);
      
//       if (!nearest || distance < nearest.distance) {
//         nearest = {
//           id: loc.idLocation,
//           name: loc.name,
//           distance,
//           type: loc.typeId
//         };
//       }
//     }

//     if (!nearest) {
//       return { success: false, message: "Nepodařilo se najít žádný checkpoint." };
//     }

//     const withinRadius = nearest.distance <= CHECKPOINT_RADIUS_METERS;
//     // Code je kombinace jména a ID pro URL, např. "Vaclavak12"
//     const code = `${nearest.name}${nearest.id}`; 

//     return {
//       success: true,
//       withinRadius,
//       checkpoint: {
//         id: nearest.id,
//         name: nearest.name,
//         code,
//         type: nearest.type,
//         distanceMeters: Math.round(nearest.distance),
//         accuracyMeters: Math.round(accuracy)
//       }
//     };

//   } catch (error) {
//     console.error("Chyba v findNearestCheckpoint:", error);
//     return { 
//       success: false, 
//       message: "Nastala neočekávaná chyba na serveru." 
//     };
//   }
// }

// --- VERSION 3 - OVĚŘENÍ SE ZOBRAZENÍM HRÁČE ---
"use server";

import { db } from "../db/index";
import { locations, players, logs } from "../db/schema";
import { eq, and} from "drizzle-orm";
import { checkRateLimit } from "../utils/rateLimit";
import { getClientKey } from "../utils/requestContext";
import { CHECKPOINT_RADIUS_METERS } from '../constants';

// ... (funkce parseGpsString a haversineDistance zůstávají beze změny) ...

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

// ... (konec neměnných funkcí)

/**
 * Validuje, zda hráč může hrát (existuje, je běžec, nemá ban).
 */
async function validatePlayerStatus(password: string) {
  const player = await db.query.players.findFirst({
    where: eq(players.pass, password),
  });

  if (!player) {
    return { valid: false, message: "Neplatné heslo." };
  }

  // 1. Kontrola Role (1 = Běžec)
  if (player.roleId !== 1) {
    return { valid: false, message: "Lovci nemohou hledat a plnit checkpointy." };
  }

  // 2. Kontrola Trestu (Quest Lock)
  if (player.questLock && player.questLockEndtime) {
    const now = new Date();
    const lockEnd = new Date(player.questLockEndtime);
    
    if (lockEnd > now) {
      const remainingMs = lockEnd.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return { 
        valid: false, 
        message: `Ještě nemůžeš plnit úkoly. Zbývá ti ${remainingMinutes} min trestu.` 
      };
    }
  }

  return { valid: true, player };
}

// --- Exported Actions ---

/**
 * Upraveno: Vrací i jméno hráče
 */
export async function verifyPlayer(password: string) {
  const status = await validatePlayerStatus(password);
  
  if (status.valid && status.player) {
    // Preferujeme herní jméno, pokud existuje
    const displayName = status.player.playName || status.player.name;
    return { success: true, playerName: displayName };
  }

  return { success: false, message: status.message };
}

// Typ pro výsledek hledání
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
    // A. Validace hráče před hledáním
    const validation = await validatePlayerStatus(password);
    if (!validation.valid || !validation.player) {
        return { success: false, message: validation.message || "Neautorizovaný přístup." };
    }

    const player = validation.player;

    if (!player.teamId) {
      return { success: false, message: "Hráč není přiřazen k žádnému týmu." };
    }

    // B. Získání splněných lokací (Log Type 3 = Splněno)
    // Optimalizace: Stáhneme jen ID lokací, které hráč už splnil
    const completedLogs = await db.query.logs.findMany({
      where: and(
        eq(logs.playerId, player.idPlayer),
        eq(logs.logTypeId, 3)
      ),
      columns: {
        locationId: true
      }
    });

    // Převedeme na Set pro rychlé vyhledávání (O(1))
    const completedLocationIds = new Set(completedLogs.map(log => log.locationId));

    // C. Logika hledání - Filtrujeme pouze lokace týmu hráče
    const teamLocations = await db.query.locations.findMany({
      where: eq(locations.teamId, player.teamId),
      columns: { idLocation: true, name: true, gps: true, typeId: true }
    });

    if (teamLocations.length === 0) {
      return { success: false, message: "Tvůj tým nemá žádné aktivní checkpointy." };
    }

    let nearest: { id: number; name: string; distance: number; type: number } | null = null;

    for (const loc of teamLocations) {
      // Pokud hráč lokaci již splnil, přeskočíme ji (nebude se počítat jako nejbližší)
      if (completedLocationIds.has(loc.idLocation)) {
        continue;
      }

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
      // Může nastat, pokud jsou všechny checkpointy týmu již splněné
      return { success: false, message: "Všechny dostupné checkpointy máš splněné! Dobrá práce." };
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