'use server';

import { db } from '@/src/db';
import { players, logs, gameSessions, teams } from '@/src/db/schema';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import {
  LOG_TYPE_BUBBLE,
  LOG_TYPE_HUNTER_TIMEOUT,
  ROLE_HUNTER_ID,
  LOG_TYPE_QUEST_CANCELLED,
  LOG_TYPE_START,
  LOG_TYPE_CATCH
} from '@/src/constants';
import { getGameConfig } from '@/src/actions/adminConfig';
import { parsePlayerIdFromSlug, validateSlug } from '@/src/lib/slug';

export async function catchRunnerAction(slug: string, hunterPassword: string) {

  // 1. Validace Slugu a získání ID běžce
  const runnerId = parsePlayerIdFromSlug(slug);
  console.log("TEST ROUTY, slug je:", runnerId);

  if (!runnerId) {
    return { success: false, message: 'Neplatný QR kód (chybný formát).' };
  }

  try {
    return await db.transaction(async (tx) => {
      const config = await getGameConfig();
      const now = new Date();

      // 2. Načtení dat (Běžec, Lovec, Aktivní Session)
      const [runner] = await tx.select().from(players).where(eq(players.idPlayer, runnerId));
      const [hunter] = await tx.select().from(players).where(eq(players.pass, hunterPassword));
      const [lastCatch] = await tx.select()
        .from(logs)
        .where(
          and(
            eq(logs.playerId, hunter.idPlayer),
            eq(logs.logTypeId, LOG_TYPE_CATCH),
            eq(logs.caughtPlayerId, runner.idPlayer)
          )
        )
        .orderBy(desc(logs.logTime))
        .limit(1);

      // Získáme poslední aktivní hru pro logování
      const [activeGame] = await tx.select()
        .from(gameSessions)
        .orderBy(desc(gameSessions.date)) // Nebo jiná logika pro aktivní session
        .limit(1);

      if (!activeGame) {
        return { success: false, message: 'Není aktivní žádná herní session.' };
      }

      // --- KONTROLY ---

      // Existuje běžec? Sedí slug?
      if (!runner || !validateSlug(slug, runner)) {
        return { success: false, message: 'Hráč z QR kódu nebyl nalezen.' };
      }

      // Existuje lovec?
      if (!hunter) {
        return { success: false, message: 'Neplatné heslo lovce.' };
      }

      // Je hráč s heslem lovcem?
      if (hunter.roleId !== ROLE_HUNTER_ID) {
        return { success: false, message: 'Jako běžec nemůžeš chytat jiné běžce!' };
      }

      // Není náhodou chycený hráč lovec?
      if (runner.roleId === ROLE_HUNTER_ID) {
        return { success: false, message: 'Nemůžeš chytit jiného lovce!' };
      }

      // Jsou ve stejném týmu?
      if (hunter.teamId === runner.teamId) {
        return { success: false, message: 'Nemůžeš chytit běžce z vlastního týmu!' };
      }

      // Má lovec aktivní trest (quest_lock)?
      if (hunter.questLock && hunter.questLockEndtime && hunter.questLockEndtime > now) {
        const remainingSeconds = Math.ceil((hunter.questLockEndtime.getTime() - now.getTime()) / 1000);
        return {
          success: false,
          message: `Nemůžeš chytat, jsi stále zastavený po minulém chycení! Zbývá: ${remainingSeconds} s.`
        };
      }

      // Je běžec neviditelný?
      if (runner.bubbleBurstTime && runner.bubbleBurstTime > now) {
        return { success: false, message: 'Tento běžec je stále neviditelný a nelze ho ještě chytit!' };
      }

      // Chytil lovec někdy už tohoto běžce?
      if (lastCatch) {
        return { success: false, message: 'Tohoto běžce už jsi jednou chytil. Nemůžeš ho chytit podruhé!' };
      }

      // --- EXEKUCE (Vše OK) ---

      // A. Updaty Lovec
      const hunterLockEnd = new Date(now.getTime() + config.RUNNER_SHIELD_TIME * 1000);
      await tx.update(players)
        .set({
          points: (hunter.points || 0) + config.POINTS_CATCH,
          questLock: true,
          questLockEndtime: hunterLockEnd,
        })
        .where(eq(players.idPlayer, hunter.idPlayer));

      if (hunter.teamId) {
        await tx.update(teams)
          .set({
            points: sql`${teams.points} + ${config.POINTS_CATCH}`,
          })
          .where(eq(teams.idTeam, hunter.teamId));
      }

      // B. Updaty Běžec
      const runnerShieldEnd = new Date(now.getTime() + config.RUNNER_SHIELD_TIME * 1000);
      const runnerBubbleEnd = new Date(now.getTime() + config.RUNNER_BUBBLE_TIME * 1000);

      // B.1 Nalezení a zrušení případného skupinového questu
      // Pokud má běžec aktivní questEndTime, najdeme všechny jeho spoluhráče s TÍMTÉŽ questEndTime a zrušíme jim ho bez trestu
      if (runner.questEndTime && runner.questEndTime > now) {
        // A.1 Najdeme poslední START log běžce, abychom zjistili lokaci a úkol
        const [lastStart] = await tx.select()
          .from(logs)
          .where(
            and(
              eq(logs.playerId, runner.idPlayer),
              eq(logs.logTypeId, LOG_TYPE_START)
            )
          )
          .orderBy(desc(logs.logTime))
          .limit(1);

        const locationId = lastStart?.locationId || null;
        const questId = lastStart?.questId || null;

        // A.2 Načteme ID všech hráčů z týmu, kteří mají stejný questEndTime (skupina)
        const groupToCancel = await tx.select({ idPlayer: players.idPlayer })
          .from(players)
          .where(
            and(
              eq(players.teamId, runner.teamId!),
              eq(players.questEndTime, runner.questEndTime)
            )
          );

        // 3 Zrušení questEndTime v DB pro celou skupinu
        await tx.update(players)
          .set({ questEndTime: null })
          .where(
            and(
              eq(players.teamId, runner.teamId!),
              eq(players.questEndTime, runner.questEndTime)
            )
          );

        // 4. Zapisování zrušení úkolu do logů pro VŠECHNY (včetně chyceného)
        // Tím se uvolní lokace v loadLocation.ts (pokud tam přidáme kontrolu na LOG_TYPE_QUEST_CANCELLED)
        for (const member of groupToCancel) {
          await tx.insert(logs).values({
            gameId: activeGame.idGameSession,
            logTypeId: LOG_TYPE_QUEST_CANCELLED,
            playerId: member.idPlayer,
            locationId: locationId,
            questId: questId,
            logTime: now
          });
        }
      }

      await tx.update(players)
        .set({
          questLock: true,
          questLockEndtime: runnerShieldEnd,
          bubbleBurstTime: runnerBubbleEnd, // Nové pole dle domluvy
          questEndTime: null // Taky zrušíme questEndTime samotnému běžci
        })
        .where(eq(players.idPlayer, runner.idPlayer));

      // C. Vytváření logů
      // Log 6: Chycení (Player = Lovec)
      await tx.insert(logs).values({
        gameId: activeGame.idGameSession,
        logTypeId: LOG_TYPE_CATCH,
        playerId: hunter.idPlayer,
        logTime: now,
        caughtPlayerId: runner.idPlayer
      });

      // Log 9: Lovec Timeout Start (Player = Lovec)
      await tx.insert(logs).values({
        gameId: activeGame.idGameSession,
        logTypeId: LOG_TYPE_HUNTER_TIMEOUT,
        playerId: hunter.idPlayer,
        logTime: now,
      });

      // Log 7: Běžec Bublina/Shield Start (Player = Běžec)
      await tx.insert(logs).values({
        gameId: activeGame.idGameSession,
        logTypeId: LOG_TYPE_BUBBLE,
        playerId: runnerId,
        logTime: now,
      });

      return { success: true, message: `Běžec úspěšně chycen! +${config.POINTS_CATCH} bodů.`, shieldMinutes: config.RUNNER_SHIELD_TIME / 60 };
    });

  } catch (error) {
    console.error('Catch Error:', error);
    return { success: false, message: 'Nastala interní chyba při zpracování.' };
  }
}