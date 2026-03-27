"use server";

import { db } from "../db/index";
import { configuration } from "../db/schema";
import { eq } from "drizzle-orm";

export type GameConfig = {
  CHECKPOINT_RADIUS_METERS: number;
  GPS_TIMEOUT_MS: number;
  POINTS_CATCH: number;
  POINTS_QUEST: number;
  QUEST_LIMIT_SECONDS: number;
  LOCKOUT_SECONDS: number;
  MULTIPLAYER_BASE_SECONDS: number;
  RUNNER_BUBBLE_TIME: number;
  RUNNER_SHIELD_TIME: number;
  CRON_LAST_RUN: number;
};

// Seznam očekávaných nastavení, ze kterého se sestaví výchozí DB řádky, pokud chybí
const DEFAULT_CONFIGS = [
  { name: 'CHECKPOINT_RADIUS_METERS', value: 20, description: 'Akceptovatelná vzdálenost od checkpointu' },
  { name: 'GPS_TIMEOUT_MS', value: 15000, description: 'Timeout GPS měření' },
  { name: 'POINTS_CATCH', value: 1, description: 'Body za chycení' },
  { name: 'POINTS_QUEST', value: 1, description: 'Body za splnění úkolu' },
  { name: 'QUEST_LIMIT_SECONDS', value: 360, description: 'Časový limit úkolu' },
  { name: 'LOCKOUT_SECONDS', value: 300, description: 'Trest za nesplnění úkolu' },
  { name: 'MULTIPLAYER_BASE_SECONDS', value: 20, description: 'Čas k zadání hráčů plnící úkol' },
  { name: 'RUNNER_BUBBLE_TIME', value: 600, description: 'Délka neviditelnosti běžce' },
  { name: 'RUNNER_SHIELD_TIME', value: 300, description: 'Délka zastavení běžce / lovce' },
  { name: 'CRON_LAST_RUN', value: 0, description: 'Poslední běh CRONu (timestamp)' }
];

export async function getGameConfig(): Promise<GameConfig> {
  const rows = await db.select().from(configuration);

  const currentConfig: Record<string, number> = {};
  for (const row of rows) {
    if (row.value !== null && row.value !== undefined) {
      currentConfig[row.name] = row.value;
    }
  }

  // Případné dovyplnění chybějících (Zápis defaultních hodnot přímo do databáze, pokud DB je poprvé napojená)
  const configsToInsert = [];
  for (const def of DEFAULT_CONFIGS) {
    if (currentConfig[def.name] === undefined) {
      configsToInsert.push(def);
      currentConfig[def.name] = def.value; // použít default rovnou i do vráceného objektu
    }
  }

  if (configsToInsert.length > 0) {
    try {
      await db.insert(configuration).values(configsToInsert);
    } catch (e) {
      console.error("Nepodařilo se nasázet defaultní configuraci do DB:", e);
    }
  }

  return {
    CHECKPOINT_RADIUS_METERS: currentConfig.CHECKPOINT_RADIUS_METERS,
    GPS_TIMEOUT_MS: currentConfig.GPS_TIMEOUT_MS,
    POINTS_CATCH: currentConfig.POINTS_CATCH,
    POINTS_QUEST: currentConfig.POINTS_QUEST,
    QUEST_LIMIT_SECONDS: currentConfig.QUEST_LIMIT_SECONDS,
    LOCKOUT_SECONDS: currentConfig.LOCKOUT_SECONDS,
    MULTIPLAYER_BASE_SECONDS: currentConfig.MULTIPLAYER_BASE_SECONDS,
    RUNNER_BUBBLE_TIME: currentConfig.RUNNER_BUBBLE_TIME,
    RUNNER_SHIELD_TIME: currentConfig.RUNNER_SHIELD_TIME,
    CRON_LAST_RUN: currentConfig.CRON_LAST_RUN || 0,
  };
}

// Slouží primárně do formuláře jako helper pro iterování v adminu
export async function getDetailedGameConfig() {
  await getGameConfig(); // Zavolá seeds pokud chybí
  const rows = await db.select().from(configuration);
  return rows.map(r => {
    if (r.name === 'GPS_TIMEOUT_MS' && r.value !== null) {
      return { ...r, value: r.value / 1000 };
    }
    return r;
  });
}

export async function saveGameConfig(settings: { name: string, value: number }[]) {
  try {
    for (const setting of settings) {
      let finalValue = setting.value;

      // Administrace posílá GPS timeout v sekundách, my fyzicky držíme jako MS
      if (setting.name === 'GPS_TIMEOUT_MS') {
        finalValue = setting.value * 1000;
      }

      const existing = await db.query.configuration.findFirst({
        where: eq(configuration.name, setting.name)
      });

      if (existing) {
        await db.update(configuration)
          .set({ value: finalValue })
          .where(eq(configuration.name, setting.name));
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Chyba při ukládání configurace:", error);
    return { success: false, message: "Server Error na DB" };
  }
}
