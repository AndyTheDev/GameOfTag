'use server';

import { db } from '@/src/db';
import { players, logs, gameSessions } from '@/src/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { 
  LOCKOUT_SECONDS, 
  RUNNER_SHIELD_TIME, 
  RUNNER_BUBBLE_TIME,
  LOG_TYPE_CATCH,
  LOG_TYPE_BUBBLE,
  LOG_TYPE_HUNTER_TIMEOUT 
} from '@/src/constants';
import { parsePlayerIdFromSlug, validateSlug } from '@/src/lib/slug';
import { getPragueDate } from '../lib/time';

// ID rolí a lokací - přizpůsob si dle své DB
const ROLE_HUNTER_ID = 2; 

export async function catchRunnerAction(slug: string, hunterPassword: string) {
  // 1. Validace Slugu a získání ID běžce
  const runnerId = parsePlayerIdFromSlug(slug);
  if (!runnerId) {
    return { success: false, message: 'Neplatný QR kód (chybný formát).' };
  }

  try {
    return await db.transaction(async (tx) => {
      const now = getPragueDate();

      // 2. Načtení dat (Běžec, Lovec, Aktivní Session)
      const [runner] = await tx.select().from(players).where(eq(players.idPlayer, runnerId));
      const [hunter] = await tx.select().from(players).where(eq(players.pass, hunterPassword));
      
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

      // Jsou ve stejném týmu?
      if (hunter.teamId === runner.teamId) {
        return { success: false, message: 'Nemůžeš chytit běžce z vlastního týmu!' };
      }

      // Má lovec aktivní trest (quest_lock)?
      if (hunter.questLock && hunter.questLockEndtime && hunter.questLockEndtime > now) {
        const remainingSeconds = Math.ceil((hunter.questLockEndtime.getTime() - now.getTime()) / 1000);
        return { 
          success: false, 
          message: `Nemůžeš chytat, jsi zmražený! Zbývá: ${remainingSeconds} s.` 
        };
      }

      // Je běžec chráněný (quest_lock)?
      if (runner.questLock && runner.questLockEndtime && runner.questLockEndtime > now) {
         return { success: false, message: 'Tento běžec má stále aktivní ochranu po předchozím chycení.' };
      }



      // --- EXEKUCE (Vše OK) ---

      // A. Updaty Lovec
      const hunterLockEnd = getPragueDate(now.getTime() + LOCKOUT_SECONDS * 1000);
      await tx.update(players)
        .set({
          points: (hunter.points || 0) + 1,
          questLock: true,
          questLockEndtime: hunterLockEnd,
        })
        .where(eq(players.idPlayer, hunter.idPlayer));

      // B. Updaty Běžec
      const runnerShieldEnd = getPragueDate(now.getTime() + RUNNER_SHIELD_TIME * 1000);
      const runnerBubbleEnd = getPragueDate(now.getTime() + RUNNER_BUBBLE_TIME * 1000);
      
      await tx.update(players)
        .set({
          questLock: true,
          questLockEndtime: runnerShieldEnd,
          bubbleBurstTime: runnerBubbleEnd, // Nové pole dle domluvy
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

      return { success: true, message: 'Běžec úspěšně chycen! +1 bod.' };
    });

  } catch (error) {
    console.error('Catch Error:', error);
    return { success: false, message: 'Nastala interní chyba při zpracování.' };
  }
}