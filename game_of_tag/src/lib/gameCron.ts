import { db } from '@/src/db';
import { players, logs, gameSessions } from '@/src/db/schema';
import { eq, and, lt, isNotNull, desc } from 'drizzle-orm';
import { 
  LOG_TYPE_TIMEOUT_RESET,        // 4
  LOG_TYPE_BUBBLE_BURST,         // 8
  LOG_TYPE_HUNTER_TIMEOUT_RESET, // 10
  ROLE_HUNTER_ID
} from '@/src/constants';

/**
 * Tato funkce kontroluje expirované časovače u hráčů.
 * Musí být volána pravidelně (např. každou minutu).
 */
export async function processGameTimeouts() {
  const now = new Date(); // Aktuální čas serveru (UTC)

  try {
    // 1. Získáme aktivní hru pro přiřazení logů
    // Hledáme poslední vytvořenou session
    const activeGame = await db.query.gameSessions.findFirst({
      orderBy: [desc(gameSessions.date)],
    });

    if (!activeGame) {
        console.log("CRON: Žádná aktivní herní session.");
        return { success: false, message: "No active game" };
    }

    const gameId = activeGame.idGameSession;
    let logsCreated = 0;

    // =========================================================================
    // A. ZPRACOVÁNÍ BUBLIN (Log 8)
    // Hledáme hráče, kde bubble_burst_time < teď
    // =========================================================================
    await db.transaction(async (tx) => {
      const expiredBubbles = await tx.select()
        .from(players)
        .where(and(
          isNotNull(players.bubbleBurstTime),
          lt(players.bubbleBurstTime, now)
        ));

      for (const player of expiredBubbles) {
        // Použijeme přesný čas z DB, kdy bublina praskla
        const logTime = player.bubbleBurstTime || now;

        // 1. Vytvořit Log 8
        await tx.insert(logs).values({
          gameId: gameId,
          logTypeId: LOG_TYPE_BUBBLE_BURST,
          playerId: player.idPlayer,
          locationId: null, // Lokace je null dle zadání
          logTime: logTime,
        });

        // 2. Vyčistit DB (smazat čas)
        await tx.update(players)
          .set({ bubbleBurstTime: null })
          .where(eq(players.idPlayer, player.idPlayer));
          
        logsCreated++;
      }
    });

    // =========================================================================
    // B. ZPRACOVÁNÍ ZÁMKŮ / TIMEOUTŮ (Log 4 a 10)
    // Hledáme hráče, kde quest_lock_endtime < teď
    // =========================================================================
    await db.transaction(async (tx) => {
      const expiredLocks = await tx.select()
        .from(players)
        .where(and(
          isNotNull(players.questLockEndtime),
          lt(players.questLockEndtime, now)
        ));

      for (const player of expiredLocks) {
        // Použijeme přesný čas z DB, kdy zámek vypršel
        const logTime = player.questLockEndtime || now;
        
        let logType;

        // Rozlišení logu podle role
        if (player.roleId === ROLE_HUNTER_ID) {
          logType = LOG_TYPE_HUNTER_TIMEOUT_RESET; // Log 10 (Lovec)
        } else {
          // Pokud není lovec, je to běžec (Log 4)
          logType = LOG_TYPE_TIMEOUT_RESET;        // Log 4 (Běžec)
        }

        // 1. Vytvořit Log
        await tx.insert(logs).values({
          gameId: gameId,
          logTypeId: logType,
          playerId: player.idPlayer,
          locationId: null, // Lokace je null, jedná se o vypršení času
          logTime: logTime,
        });

        // 2. Vyčistit DB a odemknout
        await tx.update(players)
          .set({ 
            questLockEndtime: null,
            questLock: false 
          })
          .where(eq(players.idPlayer, player.idPlayer));

        logsCreated++;
      }
    });

    return { success: true, logsCreated, timestamp: now };

  } catch (error) {
    console.error('CRON Error:', error);
    return { success: false, error };
  }
}