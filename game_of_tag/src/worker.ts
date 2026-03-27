import 'dotenv/config'; // Načte proměnné prostředí (.env)
import { processGameTimeouts } from '@/src/lib/gameCron'; // Importuj naši logiku

const INTERVAL_MS = 5000; // 5 sekund

console.log('--- GAME WORKER STARTED ---');
console.log(`Checking game state every ${INTERVAL_MS / 1000} seconds...`);

// ============================================================================
// 1. ZÁCHRANNÁ SÍŤ PRO TICHÉ PÁDY (BLACKBOX)
// Tohle konečně zachytí a vypíše důvod, proč ti to na serveru padalo!
// ============================================================================
process.on('uncaughtException', (err) => {
  console.error(`\n🔥 [${new Date().toISOString()}] CRITICAL: Uncaught Exception!`);
  console.error(err);
  // V produkci by se zde worker měl nechat spadnout a PM2/Docker by ho měl restartovat
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`\n🔥 [${new Date().toISOString()}] CRITICAL: Unhandled Rejection!`);
  console.error('Důvod:', reason);
});


// ============================================================================
// 2. SAMOOPRAVOVACÍ SMYČKA (Resilient Loop)
// ============================================================================
async function tick() {
  try {
    const result = await processGameTimeouts();

    if (result && result.success && result.logsCreated && result.logsCreated > 0) {
      console.log(`[${new Date().toISOString()}] Action: ${result.logsCreated} logs created.`);
    }
    // Pokud se nic nestalo, mlčíme, abychom nespamovali konzoli

  } catch (error) {
    console.error(`[${new Date().toISOString()}] WORKER ERROR:`, error);
  } finally {
    // KLÍČOVÁ ZMĚNA: 
    // Další kolo se naplánuje až POTÉ, co toto aktuální stoprocentně skončí.
    // Tím absolutně eliminujeme riziko překrytí procesů (concurrency issues).
    setTimeout(tick, INTERVAL_MS);
  }
}

// Odstartování smyčky (už žádný setInterval)
tick();