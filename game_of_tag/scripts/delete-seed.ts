import 'dotenv/config';
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
  console.log('🌱 Startuji reset a obnovu databáze...');

  await db.transaction(async (tx) => {
    // --- 1. FÁZE: ČIŠTĚNÍ DATABÁZE (Delete Order) ---
    // Musíme mazat od nejvíce závislých tabulek (potomků) k nezávislým (rodičům).
    console.log('🧹 Mažu stará data...');

    // 1. Nejhlubší závislosti (odkazují na hráče, lokace, questy...)
    await tx.delete(schema.logs);
    await tx.delete(schema.playerProgress);

    // 2. Hlavní entity (odkazují na týmy, číselníky...)
    // Pozor: Players se musí smazat před týmy a rolemi
    await tx.delete(schema.players); 
    await tx.delete(schema.locations);
    await tx.delete(schema.quests);

    // 3. Nezávislé číselníky a globální entity
    await tx.delete(schema.gameSessions);
    await tx.delete(schema.teams);
    await tx.delete(schema.playerRoles);
    await tx.delete(schema.privilegeLevels);
    await tx.delete(schema.questStatuses);
    await tx.delete(schema.questTypes);
    await tx.delete(schema.logTypes);

    console.log('✨ Databáze je prázdná.');

    // --- 2. FÁZE: NAHRÁVÁNÍ DAT (Insert Order) ---
    console.log('📥 Nahrávám data z dumpu...');

    // 1. NEZÁVISLÉ TABULKY (Číselníky)
    console.log('- Plním číselníky...');
    if (d.logTypes?.length) await tx.insert(schema.logTypes).values(d.logTypes);
    if (d.privilegeLevels?.length) await tx.insert(schema.privilegeLevels).values(d.privilegeLevels);
    if (d.questStatuses?.length) await tx.insert(schema.questStatuses).values(d.questStatuses);
    if (d.questTypes?.length) await tx.insert(schema.questTypes).values(d.questTypes);
    if (d.teams?.length) await tx.insert(schema.teams).values(d.teams);
    if (d.gameSessions?.length) await tx.insert(schema.gameSessions).values(d.gameSessions);
    if (d.playerRoles?.length) await tx.insert(schema.playerRoles).values(d.playerRoles);

    // 2. TABULKY ZÁVISLÉ NA ČÍSELNÍCÍCH
    console.log('- Plním hlavní entity...');
    if (d.quests?.length) await tx.insert(schema.quests).values(d.quests);
    if (d.locations?.length) await tx.insert(schema.locations).values(d.locations);
    if (d.players?.length) await tx.insert(schema.players).values(d.players);
    
    // Poznámka: Odstranil jsem .onConflictDoNothing(), protože teď vkládáme do čisté DB.
    // Pokud by v dumpu byly duplicity, chceme, aby to zařvalo chybou.
  });

  console.log('🚀 Databáze je kompletně obnovena a kompatibilní.');
}

main().catch(console.error);