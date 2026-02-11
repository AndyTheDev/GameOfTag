// src/worker.ts
import 'dotenv/config'; // Načte proměnné prostředí (.env)
import { processGameTimeouts } from '@/src/lib/gameCron'; // Importuj naši logiku

const INTERVAL_MS = 5000; // 5 sekund

console.log('--- GAME WORKER STARTED ---');
console.log(`Checking game state every ${INTERVAL_MS / 1000} seconds...`);

async function tick() {
  try {
    const result = await processGameTimeouts();
    
    if (result.success && result.logsCreated && result.logsCreated > 0) {
      console.log(`[${new Date().toISOString()}] Action: ${result.logsCreated} logs created.`);
    }
    // Pokud se nic nestalo, mlčíme, abychom nespamovali konzoli
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] WORKER ERROR:`, error);
  }
}

// Spustit smyčku
setInterval(tick, INTERVAL_MS);

// Spustit ihned při startu
tick();