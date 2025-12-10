"use server";

import { db } from "../db/index";
import { locations, player, log, quests } from "../db/schema";
import { eq, sql } from "drizzle-orm";

// Pomocná funkce pro parsování ID (např. "1-JZQ1" -> 1)
function parseLocationId(rawCode: string): number | null {
  const match = rawCode.match(/[a-zA-Z](\d+)$/);
  return match && match[1] ? parseInt(match[1], 10) : null;
}

// 1. Získání detailů o lokaci (pro úvodní zobrazení)
export async function getLocationDetails(rawCode: string) {
  const locationId = parseLocationId(rawCode);
  if (!locationId) return { success: false, message: "Neplatný formát kódu." };

  try {
    const location = await db.query.locations.findFirst({
      where: eq(locations.idLocation, locationId),
      columns: { idLocation: true, name: true }
    });

    if (!location) return { success: false, message: "Lokace neexistuje." };

    return { success: true, name: location.name, id: location.idLocation };
  } catch (error) {
    return { success: false, message: "Chyba databáze." };
  }
}

// 2. Hlavní akce: Ověření hesla, Logování, Náhodný Quest
export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  try {
    // A) Ověření hráče
    const foundPlayer = await db.query.player.findFirst({
      where: eq(player.pass, playerPass),
    });

    if (!foundPlayer) {
      return { success: false, message: "Špatné heslo hráče." };
    }

    // B) Získání info o lokaci (potřebujeme gamesetId)
    const locationInfo = await db.query.locations.findFirst({
      where: eq(locations.idLocation, locationId),
    });
    
    if (!locationInfo) return { success: false, message: "Chyba lokace." };

    // C) Výběr NÁHODNÉHO úkolu (bez řazení databáze)
    // 1. Stáhneme všechna ID
    const allQuestIds = await db.query.quests.findMany({
      columns: { idQuest: true },
    });

    if (allQuestIds.length === 0) return { success: false, message: "Žádné úkoly v DB." };

    // 2. Vylosujeme index
    const randomIndex = Math.floor(Math.random() * allQuestIds.length);
    const randomQuestId = allQuestIds[randomIndex].idQuest;

    // 3. Načteme ten úkol
    const questInfo = await db.query.quests.findFirst({
      where: eq(quests.idQuest, randomQuestId),
    });

    // D) Zápis do LOGU
    await db.insert(log).values({
      gameId: 1, 
      gamesetId: locationInfo.gamesetId || 1,
      locationId: locationId,
      playerId: foundPlayer.idPlayer,
      logTypeId: 1, // Check-in
      questId: questInfo?.idQuest || null,
      // logTime se doplní automaticky v DB (default now())
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
}

/* 
"use server";

import { db } from "../db/index"; 
import { locations, player, log, quests } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { parseIdLocation } from "../utils/parser";

export async function handleGameCode(inputCode: string) {
  const locationId = parseIdLocation(inputCode);
  if (!locationId) {
    return { success: false, message: "Neplatný formát kódu." };
  }

  const foundLocation = await db.query.locations.findFirst({
    where: eq(locations.idLocation, locationId), 
  });

  if (!foundLocation) {
    return { success: false, message: "Lokace s tímto kódem neexistuje." };
  }

  return {
    success: true,
    action: "REQUEST_PASSWORD",
    locationName: foundLocation.name,
    locationId: foundLocation.idLocation
  };
}

export async function verifyAndLogQuest(locationId: number, playerPass: string) {
  try {
    // 1. Najdi hráče podle hesla
    const foundPlayer = await db.query.player.findFirst({
      where: eq(player.pass, playerPass), 
    });

    if (!foundPlayer) {
      return { success: false, message: "Špatné heslo hráče." };
    }

    // Detaily o lokaci (potřebujeme gamesetId pro log)
    const locationInfo = await db.query.locations.findFirst({
      where: eq(locations.idLocation, locationId),
    });

    if (!locationInfo) {
      return { success: false, message: "Lokace nenalezena." };
    }

    // Náhodný výběr questu z DB
    const allQuestIds = await db.query.quests.findMany({
      columns: {
        idQuest: true,
      },
    });

    if (allQuestIds.length === 0) {
      return { success: false, message: "V databázi nejsou žádné úkoly!" };
    }

    const randomIndex = Math.floor(Math.random() * allQuestIds.length);
    const randomQuestId = allQuestIds[randomIndex].idQuest;

    const questInfo = await db.query.quests.findFirst({
      where: eq(quests.idQuest, randomQuestId),
    });

    // 4. Vytvoříme LOG 
    await db.insert(log).values({
      gameId: 1,
      gamesetId: locationInfo.gamesetId || 1, 
      locationId: locationId,
      playerId: foundPlayer.idPlayer,
      logTypeId: 1, 
      questId: questInfo ? questInfo.idQuest : null,
    });

    // 5. Vrátíme úspěch a data o Questu
    return {
      success: true,
      playerName: foundPlayer.name,
      questName: questInfo?.name || "Chyba při zobrazování jména úkolu.",
      questDescription: questInfo?.description || "Chyba při zobrazování popisu úkolu.",
    };

  } catch (error) {
    console.error("Chyba logování:", error);
    return { success: false, message: "Chyba při ukládání postupu." };
  }
}
*/