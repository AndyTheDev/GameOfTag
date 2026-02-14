import 'dotenv/config';
import { db } from '../src/db'; 
import * as schema from '../src/db/schema';
import * as fs from 'fs';
import * as path from 'path';

async function createDump() {
  console.log('🔍 Zahajuji export dat z DB...');

  const data = {
    // Číselníky a základní data
    gameSessions: await db.select().from(schema.gameSessions),
    logTypes: await db.select().from(schema.logTypes),
    privilegeLevels: await db.select().from(schema.privilegeLevels),
    questStatuses: await db.select().from(schema.questStatuses),
    questTypes: await db.select().from(schema.questTypes),
    teams: await db.select().from(schema.teams),
    
    // Hlavní entity
    quests: await db.select().from(schema.quests),
    locations: await db.select().from(schema.locations),
    players: await db.select().from(schema.players),
    
    // Nová tabulka z obrázku (ujisti se, že je v schema.ts)
    // @ts-ignore - pokud ji ještě nemáš v typech
    playerRoles: await db.select().from(schema.playerRoles), 
  };

  const dir = path.join(process.cwd(), 'src/db/data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(
    path.join(dir, 'dump.json'),
    JSON.stringify(data, null, 2)
  );

  console.log('✅ Export dokončen: src/db/data/dump.json');
}

createDump().catch(console.error);