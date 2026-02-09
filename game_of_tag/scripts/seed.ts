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

    // 2. TABULKY ZÁVISLÉ NA ČÍSELNÍCÍCH
    console.log('- Plním hlavní entity...');
    if (d.quests.length) await tx.insert(schema.quests).values(d.quests).onConflictDoNothing();
    if (d.locations.length) await tx.insert(schema.locations).values(d.locations).onConflictDoNothing();
    if (d.players.length) await tx.insert(schema.players).values(d.players).onConflictDoNothing();

    // 3. OSTATNÍ (Vazební tabulky)
    // @ts-ignore
    if (d.playerRoles?.length) await tx.insert(schema.playerRoles).values(d.playerRoles).onConflictDoNothing();
  });

  console.log('🚀 Databáze je kompletně obnovena a kompatibilní.');
}

main().catch(console.error);