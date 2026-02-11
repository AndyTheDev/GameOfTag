// --- VERZE 3 - KONTROLA PRIVILEGIÍ A OPRAVA PŘIDÁVÁNÍ HRÁČŮ + CHECKPOINTŮ
"use server";

import { db } from "../db/index";
import { 
  logs, players, locations, quests, logTypes, 
  teams, playerRoles, privilegeLevels, questTypes, playerProgress 
} from "../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { checkRateLimit } from "../utils/rateLimit";
import { getClientKey } from "../utils/requestContext";
import { createAdminSession, clearAdminSession, requireAdminSession } from "../utils/adminAuth";
import { handleServerError } from "../utils/errorHandling";
import { logInfo, logWarn } from "../utils/logger";
import {    LOG_TYPE_START,
   LOG_TYPE_TIMEOUT,
   LOG_TYPE_SUCCESS,
   LOG_TYPE_TIMEOUT_RESET,
   LOG_TYPE_GPS_NOT_ACCURATE,
   LOG_TYPE_CATCH, 
   LOG_TYPE_BUBBLE,
   LOG_TYPE_BUBBLE_BURST,
   LOG_TYPE_HUNTER_TIMEOUT,
   LOG_TYPE_HUNTER_TIMEOUT_RESET
 } from "../constants";

// --- TYPY PRO VSTUP ---
type PlayerInput = {
  id?: number;
  name: string;
  playName: string | null;
  pass: string;
  teamId: number | null;
  roleId: number | null;
  privilegeLevel: number;
};

type LocationInput = {
  id?: number;
  customId?: number;
  name: string;
  typeId: number;
  teamId: number | null;
  gps: string;
};

// --- AUTH ---
export async function adminLogin(name: string, pass: string) {
  const clientKey = await getClientKey();
  const limit = checkRateLimit(`adminLogin:${clientKey}`, { windowMs: 60_000, max: 6 });
  if (!limit.allowed) return { success: false, message: "Příliš mnoho pokusů." };

  try {
    const foundUser = await db.query.players.findFirst({
      where: and(eq(players.name, name), eq(players.pass, pass))
    });

    if (!foundUser) return { success: false, message: "Špatně zadané údaje." };
    
    // --- LOGIKA OVĚŘENÍ ADMINA ---
    if (foundUser.privilegeLevel !== 1) {
       return { success: false, message: "Tento účet nemá oprávnění správce." };
    }

    await createAdminSession(foundUser.idPlayer);
    return { success: true, user: { name: foundUser.name, id: foundUser.idPlayer } };
  } catch (error) {
    console.error("Login Error:", error);
    return handleServerError("Chyba DB.", error, { action: "adminLogin" });
  }
}

export async function adminLogout() {
  await clearAdminSession();
  return { success: true };
}

// --- DATA FETCHING ---

export async function getFullLogs() {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false, data: [], message: "Nejsi přihlášen." };

  try {
    const data = await db.select({
      id: logs.idLog,
      time: logs.logTime, 
      playerName: players.name,
      playerPlayName: players.playName,
      playerTeam: teams.name,
      locationName: locations.name,
      locationId: locations.idLocation,
      locationType: locations.typeId, 
      action: logTypes.name,     
      questName: quests.name,
      logTypeId: logs.logTypeId
    })
    .from(logs)
    .leftJoin(players, eq(logs.playerId, players.idPlayer))
    .leftJoin(teams, eq(players.teamId, teams.idTeam))
    .leftJoin(locations, eq(logs.locationId, locations.idLocation))
    .leftJoin(logTypes, eq(logs.logTypeId, logTypes.idLogType))
    .leftJoin(quests, eq(logs.questId, quests.idQuest))
    .orderBy(desc(logs.logTime));

    return { success: true, data };
  } catch (e) {
    console.error("Logs Error:", e);
    return handleServerError("Chyba logů.", e);
  }
}

export async function getAdminMetadata() {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false };

  try {
    const [allTeams, allRoles, allPrivileges, allQuestTypes] = await Promise.all([
      db.select().from(teams),
      db.select().from(playerRoles),
      db.select().from(privilegeLevels),
      db.select().from(questTypes),
    ]);
    return { success: true, data: { teams: allTeams, roles: allRoles, privileges: allPrivileges, types: allQuestTypes } };
  } catch (e) {
    return { success: false, message: "Chyba metadat" };
  }
}

export async function getPlayers() {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false };
  try {
    const data = await db.select().from(players).orderBy(players.idPlayer);
    return { success: true, data };
  } catch (e) {
    return handleServerError("Chyba hráčů.", e);
  }
}

export async function getCheckpoints() {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false };
  try {
    const data = await db.select().from(locations).orderBy(locations.idLocation);
    return { success: true, data };
  } catch (e) {
    return handleServerError("Chyba lokací.", e);
  }
}

export async function getPlayerStatus() {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false };

  try {
    // 1. Získáme hráče VČETNĚ jejich bodů (sloupec points)
    const playersData = await db.select({
      id: players.idPlayer,
      name: players.name,
      playName: players.playName,
      team: teams.name,
      role: playerRoles.name,
      points: players.points, // <--- TOTO JSME PŘIDALI (čteme přímo z DB)
    })
    .from(players)
    .leftJoin(teams, eq(players.teamId, teams.idTeam))
    .leftJoin(playerRoles, eq(players.roleId, playerRoles.idPlayerRole));

    // Poznámka: Starý výpočet přes playerProgress jsem smazal, 
    // protože teď je zdrojem pravdy sloupec players.points.

    // 2. Získáme poslední log každého hráče (pro zobrazení aktivity)
    const lastLogs = await db.selectDistinctOn([logs.playerId], {
      playerId: logs.playerId,
      time: logs.logTime,
      action: logTypes.name
    })
    .from(logs)
    .leftJoin(logTypes, eq(logs.logTypeId, logTypes.idLogType))
    .orderBy(logs.playerId, desc(logs.logTime));

    // 3. Spojení dat
    const result = playersData.map(p => {
      const lastLog = lastLogs.find(l => l.playerId === p.id);
      
      return {
        ...p,
        points: p.points || 0, // Použijeme hodnotu přímo z tabulky hráčů
        lastLogTime: lastLog?.time || null,
        lastLogAction: lastLog?.action || null,
      };
    });

    // 4. Seřadit podle bodů (od nejvyššího)
    result.sort((a, b) => b.points - a.points);

    return { success: true, data: result };

  } catch (e) {
    return handleServerError("Chyba statusu.", e);
  }
}

// --- CRUD OPERACE ---

export async function savePlayer(data: PlayerInput) {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false, message: "Neautorizováno" };

  try {
    const sanitizedData = {
        name: data.name,
        playName: data.playName || "",
        pass: data.pass,
        teamId: data.teamId ? Number(data.teamId) : null, 
        roleId: data.roleId ? Number(data.roleId) : null,
        privilegeLevel: Number(data.privilegeLevel),
        questLock: false
    };

    if (data.id) {
      // UPDATE
      await db.update(players).set({
        name: sanitizedData.name,
        playName: sanitizedData.playName,
        pass: sanitizedData.pass,
        teamId: sanitizedData.teamId,
        roleId: sanitizedData.roleId,
        privilegeLevel: sanitizedData.privilegeLevel
      }).where(eq(players.idPlayer, data.id));
    } else {
      // CREATE
      await db.insert(players).values(sanitizedData);
    }
    return { success: true };
  } catch (e: any) {
    console.error("CHYBA SAVE PLAYER:", e);
    if (e.code === '23505') { 
        return { success: false, message: "Hráč s tímto heslem již existuje." };
    }
    
    return handleServerError("Nelze uložit hráče.", e);
  }
}

export async function saveCheckpoint(data: LocationInput) {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false, message: "Neautorizováno" };

  try {
    const sanitizedData = {
        name: data.name,
        typeId: Number(data.typeId),
        teamId: data.teamId ? Number(data.teamId) : null,
        gps: data.gps || "0,0",
        ...(data.customId ? { idLocation: Number(data.customId) } : {})
    };

    if (data.id) {
      // UPDATE
      await db.update(locations).set({
        name: sanitizedData.name,
        typeId: sanitizedData.typeId,
        teamId: sanitizedData.teamId,
        gps: sanitizedData.gps
      }).where(eq(locations.idLocation, data.id));
    } else {
      // CREATE
      await db.insert(locations).values(sanitizedData);
    }
    return { success: true };
  } catch (e) {
    console.error("CHYBA SAVE CHECKPOINT:", e);
    return handleServerError("Nelze uložit lokaci.", e);
  }
}