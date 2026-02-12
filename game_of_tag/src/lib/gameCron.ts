import { db } from '@/src/db';
import { players, logs, gameSessions } from '@/src/db/schema';
import { eq, and, lt, isNotNull, desc, sql } from 'drizzle-orm';
import { 
  LOG_TYPE_START,                // 1
  LOG_TYPE_TIMEOUT,              // 2
  LOG_TYPE_SUCCESS,              // 3
  LOG_TYPE_TIMEOUT_RESET,        // 4
  LOG_TYPE_BUBBLE_BURST,         // 8
  LOG_TYPE_HUNTER_TIMEOUT_RESET, // 10
  ROLE_HUNTER_ID,
  ROLE_RUNNER_ID,
  QUEST_LIMIT_SECONDS,
  LOCKOUT_SECONDS
} from '@/src/constants';

/**
 * Tato funkce kontroluje expirované časovače u hráčů.
 * Musí být volána pravidelně (např. každou minutu).
 */
const GAME_ID = 1;

export async function processGameTimeouts() {

  const now = new Date(); // Aktuální čas serveru (UTC)
  console.log(`\n🔄 [${now.toLocaleTimeString()}] CRON START: Kontrola timeoutů...`);
  let logsCreated = 0;
  let errors = 0;

  try {
    // 1. Získáme aktivní hru pro přiřazení logů
    // Hledáme poslední vytvořenou session
    // const activeGame = await db.query.gameSessions.findFirst({
    //   orderBy: [desc(gameSessions.date)],
    // });

    // if (!activeGame) {
    //     console.log("CRON: Žádná aktivní herní session.");
    //     return { success: false, message: "No active game" };
    // }

    // const gameId = activeGame.idGameSession;
    // let logsCreated = 0;

    // FIX: Robustnější získání gameId. Pokud není aktivní session, vezmeme poslední nebo fallback na 1.
    // Tím zajistíme, že CRON nezhavaruje, i když admini ještě nezaložili hru pro dnešek.
    const lastSession = await db.query.gameSessions.findFirst({
      orderBy: [desc(gameSessions.idGameSession)],
    });
    const gameId = lastSession ? lastSession.idGameSession : 1;

    

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

const expiredRunners = await db.select()
        .from(players)
        .where(and(
            eq(players.roleId, ROLE_RUNNER_ID),
            isNotNull(players.questEndTime),
            lt(players.questEndTime, now)
        ));

    if (expiredRunners.length > 0) {
        console.log(`CRON: Nalezeno ${expiredRunners.length} expirovaných běžců.`);
    }

    for (const player of expiredRunners) {
        try {
            await db.transaction(async (tx) => {
                const expirationTime = player.questEndTime || now;
                const lockEnd = new Date(now.getTime() + LOCKOUT_SECONDS * 1000);

                // Zkusíme najít poslední START log
                const lastStartLogs = await tx.select()
                    .from(logs)
                    .where(and(
                        eq(logs.playerId, player.idPlayer),
                        eq(logs.logTypeId, LOG_TYPE_START)
                    ))
                    .orderBy(desc(logs.logTime))
                    .limit(1);
                
                const lastLog = lastStartLogs[0];

                // Zapíšeme TIMEOUT
                await tx.insert(logs).values({
                    gameId: gameId, // <--- OPRAVENO: Používáme dynamické gameId, ne konstantu
                    logTypeId: LOG_TYPE_TIMEOUT,
                    playerId: player.idPlayer,
                    locationId: lastLog?.locationId || null, 
                    questId: lastLog?.questId || null,
                    logTime: expirationTime,
                });

                // Zablokujeme hráče
                await tx.update(players)
                    .set({ 
                        questEndTime: null, 
                        questLock: true,
                        questLockEndtime: lockEnd
                    })
                    .where(eq(players.idPlayer, player.idPlayer));
                
                logsCreated++;
                console.log(`CRON: Hráč ${player.idPlayer} (Běžec) dostal timeout.`);
            });
        } catch (playerError: any) {
            // Zvýšíme počítadlo chyb
            errors++;
            // Formátovaný výpis chyby pro terminál
            console.error(`\n❌ CRON ERROR [TIMEOUT LOG] | Player ID: ${player.idPlayer}`);
            console.error(`---------------------------------------------------`);
            console.error(`Message: ${playerError?.message || 'Unknown error'}`);
            // Specifické pro Postgres/Drizzle (např. kód 23503 je Foreign Key Violation)
            if (playerError?.code) {
                console.error(`DB Code: ${playerError.code}`);
            }
            if (playerError?.constraint) {
                console.error(`Constraint: ${playerError.constraint}`);
            }
            
            // Stack trace pro debug, kde přesně to spadlo
            console.error(`Stack:`, playerError?.stack);
            console.error(`---------------------------------------------------\n`);
        }
    }
    // =========================================================================
    // C. ZPRACOVÁNÍ ZÁMKŮ / TIMEOUTŮ (Log 4 a 10)
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