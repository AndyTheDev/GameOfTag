"use server";

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
}