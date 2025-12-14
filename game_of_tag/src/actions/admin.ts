/* "use server";

import { db } from "../db/index";
import { log, player, locations, quests, logType } from "../db/schema"; 
import { eq, desc } from "drizzle-orm";

const ADMINS = [
  { name: "Andy", pass: "741741", id: 1 },
  { name: "Ivo", pass: "245417", id: 2 }
];

export async function adminLogin(name: string, pass: string) {
  const admin = ADMINS.find(a => a.name === name && a.pass === pass);
  if (admin) {
    return { success: true, user: admin };
  }
  return { success: false, message: "Špatně zadané údaje" };
}

export async function getFullLogs() {
  try {

    const data = await db.select({
      id: log.idLog,
      time: log.logTime, 
      playerName: player.name,
      locationName: locations.name,
      locationId: locations.idLocation,
      action: logType.name,     
      questName: quests.name,
      logTypeId: log.logTypeId
    })
    .from(log)
    .leftJoin(player, eq(log.playerId, player.idPlayer))
    .leftJoin(locations, eq(log.locationId, locations.idLocation))
    .leftJoin(logType, eq(log.logTypeId, logType.idLogType))
    .leftJoin(quests, eq(log.questId, quests.idQuest))
    .orderBy(desc(log.logTime));

    return { success: true, data };
  } catch (e) {
    console.error("Admin fetch error:", e);
    return { success: false, data: [] };
  }
} */

// "use server";

// import { db } from "../db/index";
// import { log, player, locations, quests, logType } from "../db/schema"; 
// import { eq, desc, and } from "drizzle-orm";

// // Funkce pro přihlášení ADMINA (ověření vůči DB)
// export async function adminLogin(name: string, pass: string) {
//   try {
//     // 1. Hledáme v databázi hráče, který má zadané jméno A heslo
//     const foundUser = await db.query.player.findFirst({
//       where: and(
//         eq(player.name, name),
//         eq(player.pass, pass)
//       )
//     });

//     if (!foundUser) {
//       return { success: false, message: "Špatně zadané údaje." };
//     }

//     const ALLOWED_ADMIN_IDS = [1, 2];
    
//     if (!ALLOWED_ADMIN_IDS.includes(foundUser.idPlayer)) {
//        return { success: false, message: "Tento účet nemá oprávnění správce." };
//     }

//     return { 
//       success: true, 
//       user: { name: foundUser.name, id: foundUser.idPlayer } 
//     };

//   } catch (error) {
//     console.error("Chyba při přihlášení:", error);
//     return { success: false, message: "Chyba databáze při ověřování." };
//   }
// }

// export async function getFullLogs() {
//   try {
//     const data = await db.select({
//       id: log.idLog,
//       time: log.logTime, 
//       playerName: player.name,
//       locationName: locations.name,
//       locationId: locations.idLocation,
//       action: logType.name,     
//       questName: quests.name,
//       logTypeId: log.logTypeId
//     })
//     .from(log)
//     .leftJoin(player, eq(log.playerId, player.idPlayer))
//     .leftJoin(locations, eq(log.locationId, locations.idLocation))
//     .leftJoin(logType, eq(log.logTypeId, logType.idLogType))
//     .leftJoin(quests, eq(log.questId, quests.idQuest))
//     .orderBy(desc(log.logTime));

//     return { success: true, data };
//   } catch (e) {
//     console.error("Admin fetch error:", e);
//     return { success: false, data: [] };
//   }
// }

"use server";

import { db } from "../db/index";
import { log, player, locations, quests, logType } from "../db/schema"; 
import { eq, desc, and } from "drizzle-orm";

// ... (funkce adminLogin zůstává beze změny) ...
export async function adminLogin(name: string, pass: string) {
  try {
    const foundUser = await db.query.player.findFirst({
      where: and(
        eq(player.name, name),
        eq(player.pass, pass)
      )
    });

    if (!foundUser) {
      return { success: false, message: "Špatně zadané údaje." };
    }

    const ALLOWED_ADMIN_IDS = [1, 2];
    
    if (!ALLOWED_ADMIN_IDS.includes(foundUser.idPlayer)) {
       return { success: false, message: "Tento účet nemá oprávnění správce." };
    }

    return { 
      success: true, 
      user: { name: foundUser.name, id: foundUser.idPlayer } 
    };

  } catch (error) {
    console.error("Chyba při přihlášení:", error);
    return { success: false, message: "Chyba databáze při ověřování." };
  }
}

export async function getFullLogs() {
  try {
    const data = await db.select({
      id: log.idLog,
      time: log.logTime, 
      playerName: player.name,
      // PŘIDÁNO: Tým hráče (pokud se sloupec v DB jmenuje player_name a obsahuje barvy, 
      // ujistěte se, že ve schema.ts máte např. 'team: text("player_name")')
      playerTeam: player.playName, 
      
      locationName: locations.name,
      locationId: locations.idLocation,
      // PŘIDÁNO: Typ lokace pro výpočet bodů (quest/finish)
      locationType: locations.type, 
      
      action: logType.name,     
      questName: quests.name,
      logTypeId: log.logTypeId
    })
    .from(log)
    .leftJoin(player, eq(log.playerId, player.idPlayer))
    .leftJoin(locations, eq(log.locationId, locations.idLocation))
    .leftJoin(logType, eq(log.logTypeId, logType.idLogType))
    .leftJoin(quests, eq(log.questId, quests.idQuest))
    .orderBy(desc(log.logTime));

    return { success: true, data };
  } catch (e) {
    console.error("Admin fetch error:", e);
    return { success: false, data: [] };
  }
}