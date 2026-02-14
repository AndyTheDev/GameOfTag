import 'dotenv/config';
import { sql } from 'drizzle-orm'
import { db } from '../src/db/index';
import * as schema from '../src/db/schema';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const dumpPath = path.join(process.cwd(), 'src/db/data/dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error('❌ Dump soubor nenalezen!');
    return;
  }

  const d = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
  console.log('🌱 Startuji obnovu databáze...');

  await db.transaction(async (tx) => {
    // 1. NEZÁVISLÉ TABULKY (Číselníky)
    console.log('- Plním číselníky...');
    if (d.logTypes.length) await tx.insert(schema.logTypes).values(d.logTypes).onConflictDoNothing();
    if (d.privilegeLevels.length) await tx.insert(schema.privilegeLevels).values(d.privilegeLevels).onConflictDoNothing();
    if (d.questStatuses.length) await tx.insert(schema.questStatuses).values(d.questStatuses).onConflictDoNothing();
    if (d.questTypes.length) await tx.insert(schema.questTypes).values(d.questTypes).onConflictDoNothing();
    if (d.teams.length) await tx.insert(schema.teams).values(d.teams).onConflictDoNothing();
    if (d.gameSessions.length) await tx.insert(schema.gameSessions).values(d.gameSessions).onConflictDoNothing();
    if (d.playerRoles?.length) await tx.insert(schema.playerRoles).values(d.playerRoles).onConflictDoNothing();

    // 2. TABULKY ZÁVISLÉ NA ČÍSELNÍCÍCH
    console.log('- Plním hlavní entity...');
    if (d.quests.length) await tx.insert(schema.quests).values(d.quests).onConflictDoNothing();
    if (d.locations.length) await tx.insert(schema.locations).values(d.locations).onConflictDoNothing();
    if (d.players.length) await tx.insert(schema.players).values(d.players).onConflictDoNothing();
    
  });

  async function resetSequences() {
  console.log('🔄 Synchronizuji ID sekvence...');

  // Seznam tabulek a jejich ID sloupců, které potřebují reset
  const tables = [
    { name: 'quests', column: 'id_quest' },
    { name: 'location', column: 'id_location' },
    { name: 'player', column: 'id_player' },
    { name: 'log', column: 'id_log' },
    { name: 'team', column: 'id_team' },
    // přidej další tabulky dle potřeby
  ];

  for (const table of tables) {
    try {
      // Tento SQL příkaz najde MAX id a nastaví podle něj sekvenci
      await db.execute(sql.raw(`
        SELECT setval(
          pg_get_serial_sequence('${table.name}', '${table.column}'),
          COALESCE((SELECT MAX(${table.column}) FROM ${table.name}), 1)
        );
      `));
      console.log(`✅ Sekvence pro '${table.name}' opravena.`);
    } catch (error) {
      console.warn(`⚠️ Chyba při resetu sekvence pro '${table.name}':`, error);
      // Často to může selhat, pokud tabulka nemá sekvenci (např. uuid), to je OK.
    }
  }
}

  console.log('🚀 Databáze je kompletně obnovena a kompatibilní.');
}

main().catch(console.error);