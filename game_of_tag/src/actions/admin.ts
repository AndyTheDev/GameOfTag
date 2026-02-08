"use server";

import { db } from "../db/index";
import { logs, players, locations, quests, logTypes } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { checkRateLimit } from "../utils/rateLimit";
import { getClientKey } from "../utils/requestContext";
import { createAdminSession, clearAdminSession, requireAdminSession } from "../utils/adminAuth";
import { handleServerError } from "../utils/errorHandling";
import { logInfo, logWarn } from "../utils/logger";

export async function adminLogin(name: string, pass: string) {
  const clientKey = await getClientKey();
  const limit = checkRateLimit(`adminLogin:${clientKey}`, { windowMs: 60_000, max: 6 });
  if (!limit.allowed) {
    return { success: false, message: "Příliš mnoho pokusů, zkus to později." }; // Ochrana proti bruteforce.
  }

  try {
    const foundUser = await db.query.players.findFirst({
      where: and(
        eq(players.name, name),
        eq(players.pass, pass)
      )
    });

    if (!foundUser) {
      logWarn("Admin login zamitnut", { name });
      return { success: false, message: "Špatně zadané údaje." };
    }

    const ALLOWED_ADMIN_IDS = [1, 2];
    
    if (!ALLOWED_ADMIN_IDS.includes(foundUser.idPlayer)) {
       logWarn("Admin login bez opravneni", { userId: foundUser.idPlayer });
       return { success: false, message: "Tento účet nemá oprávnění správce." };
    }

    await createAdminSession(foundUser.idPlayer);
    logInfo("Admin login OK", { userId: foundUser.idPlayer });
    return { 
      success: true, 
      user: { name: foundUser.name, id: foundUser.idPlayer } 
    };

  } catch (error) {
    return handleServerError("Chyba databáze při ověřování.", error, { action: "adminLogin" });
  }
}

export async function getFullLogs() {
  const session = await requireAdminSession();
  if (!session.ok) {
    return { success: false, data: [], message: "Nejsi přihlášen." }; // Server-side ochrana logu pred cizimi pristupy.
  }

  const clientKey = await getClientKey();
  const limit = checkRateLimit(`adminLogs:${clientKey}`, { windowMs: 10_000, max: 10 });
  if (!limit.allowed) {
    return { success: false, data: [], message: "Příliš mnoho požadavků, zpomal." };
  }

  try {
    const data = await db.select({
      id: logs.idLog,
      time: logs.logTime, 
      playerName: players.name,
      playerTeam: players.playName, 
      locationName: locations.name,
      locationId: locations.idLocation,
      locationType: locations.typeId, 
      action: logTypes.name,     
      questName: quests.name,
      logTypeId: logs.logTypeId
    })
    .from(logs)
    .leftJoin(players, eq(logs.playerId, players.idPlayer))
    .leftJoin(locations, eq(logs.locationId, locations.idLocation))
    .leftJoin(logTypes, eq(logs.logTypeId, logTypes.idLogType))
    .leftJoin(quests, eq(logs.questId, quests.idQuest))
    .orderBy(desc(logs.logTime));

    return { success: true, data };
  } catch (e) {
    return handleServerError("Chyba při načítání logů.", e, { action: "getFullLogs" });
  }
}

export async function adminLogout() {
  // Logout maze serverovou session, aby zustalo opravneni jen na serveru.
  await clearAdminSession();
  return { success: true };
}