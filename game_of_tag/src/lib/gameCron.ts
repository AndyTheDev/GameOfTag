import { db } from '@/src/db';
import { players, logs, gameSessions, configuration } from '@/src/db/schema';
import { eq, and, lt, isNotNull, desc, sql } from 'drizzle-orm';
import {
  LOG_TYPE_START,                // 1
  LOG_TYPE_TIMEOUT,              // 2
  LOG_TYPE_SUCCESS,              // 3
  LOG_TYPE_TIMEOUT_RESET,        // 4
  LOG_TYPE_BUBBLE_BURST,         // 8
  LOG_TYPE_HUNTER_TIMEOUT_RESET, // 10
  ROLE_HUNTER_ID,
  ROLE_RUNNER_ID
} from '@/src/constants';
import { getGameConfig } from '@/src/actions/adminConfig';
import { safeSystemLog } from '@/src/utils/cronAdminLogger';

/**
 * Tato funkce kontroluje expirované časovače u hráčů.
 * Musí být volána pravidelně (např. každou minutu).
 */
const GAME_ID = 1;

export async function processGameTimeouts() {
  const config = await getGameConfig();
  const now = new Date(); // Aktuální čas serveru (UTC)
  console.log(`\n🔄 [${now.toLocaleTimeString()}] CRON START: Kontrola timeoutů...`);
  let logsCreated = 0;
  let errors = 0;

  try {
    // Zíksání GameID
    const lastSession = await db.query.gameSessions.findFirst({
      orderBy: [desc(gameSessions.idGameSession)],
    });
    const gameId = lastSession ? lastSession.idGameSession : 1;

    // =========================================================================
    // A. ZPRACOVÁNÍ BUBLIN (Log 8)
    // Hledáme hráče, kde bubble_burst_time < teď
    // =========================================================================

    // Nalezneme hráče, kde bubble_burst_time < teď
    const expiredBubbles = await db.select()
      .from(players)
      .where(and(
        isNotNull(players.bubbleBurstTime),
        lt(players.bubbleBurstTime, now)
      )
      );

    if (expiredBubbles.length > 0) {
      console.log(`CRON: Nalezeno ${expiredBubbles.length} expirovaných neviditelností.`);
      await safeSystemLog('INFO', `Nalezeno ${expiredBubbles.length} expirovaných neviditelností.`);
    }

    // Jejich zpracování, one by one
    for (const player of expiredBubbles) {
      try {
        await db.transaction(async (tx) => {

          // Přesný čas prasknutí bubliny
          const logTime = player.bubbleBurstTime || now;

          // Vytváří log 8 o prasknutí bubliny
          await tx.insert(logs).values({
            gameId: gameId,
            logTypeId: LOG_TYPE_BUBBLE_BURST,
            playerId: player.idPlayer,
            locationId: null,
            logTime: logTime,
          });

          // Vyčistí čas z DB
          await tx.update(players)
            .set({ bubbleBurstTime: null })
            .where(eq(players.idPlayer, player.idPlayer));


        });

        // záznamy do terminálu pro development
        logsCreated++;
        console.log(`CRON: Hráči ${player.name} praskla bublina a je viditelný.`);

        // záznam pro admina do databáze
        await safeSystemLog('INFO', `Hráči ${player.name} praskla bublina a je viditelný.`);

      } catch (playerError: any) {
        // Zvýšíme počítadlo chyb
        errors++;

        // Výpis chyby
        console.error(`\n❌ CRON ERROR [BUBBLE BURST] | Hráč: ${player.name}`);
        console.error(`---------------------------------------------------`);
        console.error(`Message: ${playerError?.message || 'Unknown error'}`);
        if (playerError?.code) console.error(`DB Code: ${playerError.code}`);
        if (playerError?.constraint) console.error(`Constraint: ${playerError.constraint}`);
        console.error(`Stack:`, playerError?.stack);
        console.error(`---------------------------------------------------\n`);

        // Sestavení JEDNOHO komplexního logu pro admina
        const errorDetails = `Code: ${playerError?.code || 'N/A'} | Constraint: ${playerError?.constraint || 'N/A'} | Stack: ${playerError?.stack || 'N/A'}`;

        // Jeden insert do DB
        await safeSystemLog(
          'ERROR',
          `Chyba při prasknutí bubliny (Hráč: ${player.name}): ${playerError?.message || 'Unknown error'}`,
          errorDetails // (pokud tvůj safeSystemLog bere 3. parametr pro detail, jinak to spoj do zprávy)
        );
      }
    }



    // =========================================================================
    // B. ZPRACOVÁNÍ vypršení úkolů běžců (Log 2)
    // Hledáme hráče, kde quest_end_time < teď
    // =========================================================================

    const expiredRunners = await db.select()
      .from(players)
      .where(and(
        eq(players.roleId, ROLE_RUNNER_ID),
        isNotNull(players.questEndTime),
        lt(players.questEndTime, now)

      )
      );

    if (expiredRunners.length > 0) {
      console.log(`CRON: Nalezeno ${expiredRunners.length} expirovaných úkolů.`);
    }

    for (const player of expiredRunners) {
      try {
        await db.transaction(async (tx) => {
          const expirationTime = player.questEndTime || now;
          const lockEnd = new Date(expirationTime.getTime() + config.LOCKOUT_SECONDS * 1000);

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
            gameId: gameId,
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


        });

        // záznamy do terminálu pro development
        logsCreated++;
        console.log(`CRON: Hráč ${player.idPlayer} vypršel čas na úkol.`);

        // záznam pro admina do databáze
        await safeSystemLog('INFO', `Hráči ${player.name} vypršel čas na úkol.`);

      } catch (playerError: any) {
        // Zvýšíme počítadlo chyb
        errors++;

        // Výpis chyby
        console.error(`\n❌ CRON ERROR [TIMEOUT LOG] | Hráč: ${player.name}`);
        console.error(`---------------------------------------------------`);
        console.error(`Message: ${playerError?.message || 'Unknown error'}`);
        if (playerError?.code) console.error(`DB Code: ${playerError.code}`);
        if (playerError?.constraint) console.error(`Constraint: ${playerError.constraint}`);
        console.error(`Stack:`, playerError?.stack);
        console.error(`---------------------------------------------------\n`);

        // Sestavení logu pro admina
        const errorDetails = `Code: ${playerError?.code || 'N/A'} | Constraint: ${playerError?.constraint || 'N/A'} | Stack: ${playerError?.stack || 'N/A'}`;

        // Insert do DB
        await safeSystemLog(
          'ERROR',
          `Chyba při timeoutu úkolu hráče ${player.name}: ${playerError?.message || 'Unknown error'}`,
          errorDetails
        );
      }
    }
    // =========================================================================
    // C. ZPRACOVÁNÍ ZÁMKŮ / TIMEOUTŮ (Log 4 a 10)
    // Hledáme hráče, kde quest_lock_endtime < teď
    // =========================================================================

    const expiredLocks = await db.select()
      .from(players)
      .where(and(
        isNotNull(players.questLockEndtime),
        lt(players.questLockEndtime, now)
      ));

    if (expiredLocks.length > 0) {
      console.log(`CRON: Nalezeno ${expiredLocks.length} expirovaných trestů.`);
    }

    for (const player of expiredLocks) {
      try {
        await db.transaction(async (tx) => {

          const logTime = player.questLockEndtime || now;
          let logType;

          // Rozlišení logu podle role
          if (player.roleId === ROLE_HUNTER_ID) {
            logType = LOG_TYPE_HUNTER_TIMEOUT_RESET;
          } else {
            // Pokud není lovec, je to běžec (Log 4)
            logType = LOG_TYPE_TIMEOUT_RESET;
          }

          // 1. Vytvořit Log
          await tx.insert(logs).values({
            gameId: gameId,
            logTypeId: logType,
            playerId: player.idPlayer,
            locationId: null,
            logTime: logTime,
          });

          // 2. Vyčistit DB a odemknout
          await tx.update(players)
            .set({
              questLockEndtime: null,
              questLock: false
            })
            .where(eq(players.idPlayer, player.idPlayer));

        });

        // záznamy do terminálu pro development
        logsCreated++;
        console.log(`CRON: Hráči ${player.name} vypršel trest po chycení.`);

        // záznam pro admina do databáze
        await safeSystemLog('INFO', `Hráči ${player.name} vypršel trest po chycení.`);

      } catch (playerError: any) {
        // Zvýšíme počítadlo chyb
        errors++;

        // Výpis chyby
        console.error(`\n❌ CRON ERROR [TIMEOUT RESET] | Hráč: ${player.name}`);
        console.error(`---------------------------------------------------`);
        console.error(`Message: ${playerError?.message || 'Unknown error'}`);
        if (playerError?.code) console.error(`DB Code: ${playerError.code}`);
        if (playerError?.constraint) console.error(`Constraint: ${playerError.constraint}`);
        console.error(`Stack:`, playerError?.stack);
        console.error(`---------------------------------------------------\n`);

        // Sestavení logu pro admina
        const errorDetails = `Code: ${playerError?.code || 'N/A'} | Constraint: ${playerError?.constraint || 'N/A'} | Stack: ${playerError?.stack || 'N/A'}`;

        // Insert do DB
        await safeSystemLog(
          'ERROR',
          `Chyba při resetu timeoutu úkolu hráče ${player.name}: ${playerError?.message || 'Unknown error'}`,
          errorDetails
        );
      }
    }

    // 4. Aktualizace heartbeatu (CRON_LAST_RUN)
    try {
      await db.update(configuration)
        .set({ lastRunAt: new Date() })
        .where(eq(configuration.name, 'CRON_LAST_RUN'));
      console.log('CRON: Heartbeat updated.');
    } catch (cronError) {
      console.error('Kritická chyba updatu CRON_LAST_RUN:', cronError);
    }

    return { success: true, logsCreated, timestamp: now };

  } catch (error) {
    console.error('CRON Error:', error);
    return { success: false, error };
  }
}