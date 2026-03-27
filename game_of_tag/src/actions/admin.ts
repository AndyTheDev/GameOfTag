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
import { configuration } from "../db/schema";
import { processGameTimeouts } from "../lib/gameCron";
import {
  LOG_TYPE_START,
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
  completed?: boolean;
};

type QuestInput = {
  id?: number;
  name: string;
  description: string;
  questTypeId: number;
  timeLimit: number;
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
      db.select().from(teams).orderBy(teams.idTeam),
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
    // 1. Získáme hráče VČETNĚ stavových polí z DB
    const playersData = await db.select({
      id: players.idPlayer,
      name: players.name,
      playName: players.playName,
      team: teams.name,
      role: playerRoles.name,
      roleId: players.roleId,
      points: players.points,
      // Stavová pole
      questEndTime: players.questEndTime,
      questLockEndtime: players.questLockEndtime,
      runnerShieldTime: players.runnerShieldTime,
      bubbleBurstTime: players.bubbleBurstTime,
    })
      .from(players)
      .leftJoin(teams, eq(players.teamId, teams.idTeam))
      .leftJoin(playerRoles, eq(players.roleId, playerRoles.idPlayerRole));

    // 2. Seřadit podle bodů (od nejvyššího)
    playersData.sort((a, b) => (b.points || 0) - (a.points || 0));

    return { success: true, data: playersData };

  } catch (e) {
    return handleServerError("Chyba statusu.", e);
  }
}

export async function getPlayerLogs(playerId: number) {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false };

  try {
    const data = await db.select({
      id: logs.idLog,
      time: logs.logTime,
      action: logTypes.name,
      logTypeId: logs.logTypeId,
      locationName: locations.name,
      questName: quests.name,
    })
      .from(logs)
      .leftJoin(logTypes, eq(logs.logTypeId, logTypes.idLogType))
      .leftJoin(locations, eq(logs.locationId, locations.idLocation))
      .leftJoin(quests, eq(logs.questId, quests.idQuest))
      .where(eq(logs.playerId, playerId))
      .orderBy(desc(logs.logTime));

    return { success: true, data };
  } catch (e) {
    return handleServerError("Chyba logů hráče.", e);
  }
}

export async function getQuests() {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false };
  try {
    const data = await db.select().from(quests).orderBy(quests.idQuest);
    return { success: true, data };
  } catch (e) {
    return handleServerError("Chyba úkolů.", e);
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
      completed: !!data.completed,
      ...(data.customId ? { idLocation: Number(data.customId) } : {})
    };

    if (data.id) {
      // UPDATE
      await db.update(locations).set({
        name: sanitizedData.name,
        typeId: sanitizedData.typeId,
        teamId: sanitizedData.teamId,
        gps: sanitizedData.gps,
        completed: sanitizedData.completed
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

export async function saveQuest(data: QuestInput) {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false, message: "Neautorizováno" };

  try {
    const sanitizedData = {
      name: data.name,
      description: data.description,
      questTypeId: Number(data.questTypeId),
      timeLimit: Number(data.timeLimit)
    };

    if (data.id) {
      // UPDATE
      await db.update(quests).set(sanitizedData).where(eq(quests.idQuest, data.id));
    } else {
      // CREATE
      await db.insert(quests).values(sanitizedData);
    }
    return { success: true };
  } catch (e) {
    console.error("CHYBA SAVE QUEST:", e);
    return handleServerError("Nelze uložit úkol.", e);
  }
}

export async function saveTeam(data: any) {
  try {
    const parsedPoints = Number(data.points) || 0;

    // Vytvoříme čistý objekt pouze s povinnými daty
    const teamData: any = {
      name: data.name,
      points: parsedPoints,
    };

    // Volitelné sloupce přidáme do objektu POUZE tehdy, 
    // pokud je uživatel vyplnil (nejsou prázdné nebo null)
    if (data.map && data.map.trim() !== "") {
      teamData.map = data.map.trim();
    }
    if (data.life360 && data.life360.trim() !== "") {
      teamData.life360 = data.life360.trim();
    }

    if (data.id) {
      // UPDATE existujícího týmu
      await db.update(teams)
        .set(teamData)
        .where(eq(teams.idTeam, data.id));
    } else {
      // INSERT nového týmu
      await db.insert(teams).values(teamData);
    }

    return { success: true };
  } catch (error: any) {
    // Tady si vypíšeme celou chybu do konzole serveru, 
    // kdyby to náhodou padalo dál (např. chybějící sloupec).
    console.error("🛑 DB Error saveTeam:", error);

    return { success: false, message: error.message };
  }
}

export async function deleteTeam(teamId: number) {
  try {
    await db.delete(teams).where(eq(teams.idTeam, teamId));
    return { success: true };
  } catch (error: any) {
    console.error("🛑 DB Error deleteTeam:", error);

    // Kód 23503 je PostgreSQL chyba pro porušení cizího klíče (Foreign Key Violation)
    if (error.code === '23503') {
      return {
        success: false,
        message: "Nelze smazat tým, protože má stále přiřazené hráče nebo checkpointy. Nejprve je musíš smazat nebo přesunout do jiného týmu."
      };
    }

    return { success: false, message: error.message };
  }
}

export async function getCronStatus() {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false, message: "Neautorizováno" };

  try {
    const row = await db.query.configuration.findFirst({
      where: eq(configuration.name, 'CRON_LAST_RUN')
    });

    const lastRunDate = row?.lastRunAt ? new Date(row.lastRunAt) : null;
    const lastRun = lastRunDate ? Math.floor(lastRunDate.getTime() / 1000) : 0;
    const now = Math.floor(Date.now() / 1000);
    const diff = lastRun > 0 ? now - lastRun : 999;

    // Považujeme za "mrtvé", pokud neběžel déle než 30 sekund (běží každých 5s)
    const isAlive = lastRun > 0 && diff < 10;

    return {
      success: true,
      lastRun,
      isAlive,
      diff
    };
  } catch (e) {
    return handleServerError("Chyba při zjišťování stavu CRONu.", e);
  }
}

export async function triggerCronRestart() {
  const session = await requireAdminSession();
  if (!session.ok) return { success: false, message: "Neautorizováno" };

  try {
    // Ruční vyvolání logiky CRONu
    await processGameTimeouts();
    return { success: true, message: "CRON úspěšně spuštěn." };
  } catch (e) {
    return handleServerError("Chyba při ručním spuštění CRONu.", e);
  }
}