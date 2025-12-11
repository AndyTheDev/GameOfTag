import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { player, locations, quests, logType, gameset, gameSession } from "../src/db/schema"; 
import * as dotenv from "dotenv";
import * as path from "path";

// 1. NEJDŘÍV NAČTEME .ENV (Oprava cesty)
// Zjistíme cestu o složku výš
const envPath = path.resolve(__dirname, "../.env.local");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Chyba: Nemůžu najít soubor .env na cestě:", envPath);
  process.exit(1);
}

// 2. KONTROLA
if (!process.env.DATABASE_URL) {
  console.error("❌ Chyba: DATABASE_URL chybí v .env souboru.");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log("🌱 Začínám nahrávat data na produkci...");

  // 1. TYPY LOGŮ (Ty jsou fixní, ty tam necháme natvrdo)
  console.log("... typy logů");
  await db.insert(logType).values([
    { idLogType: 1, name: "Quest started" },
    { idLogType: 2, name: "Quest timeout" },
    { idLogType: 3, name: "Quest succesful" },
  ]).onConflictDoNothing();

  console.log("... typy logů");
  await db.insert(gameSession).values([
    { idGameSession: 1, startTime: "2025-12-14T13:00:00.000Z" ,duration: 10800 },
  ]).onConflictDoNothing();

  // 2. GAMESET
  const gamesetData = 
    [
        {
            "idGameset": 1,
            "name": "Praha-V-JZ-SZ"
        },
        {
            "idGameset": 2,
            "name": "Praha-SV-JV-Z"
        }
    ]
  ;
  if (gamesetData.length > 0) {
      console.log("... gameset");
      await db.insert(gameset).values(gamesetData).onConflictDoNothing();
  }

  // 3. LOKACE
  const locationsData = [
        {
            "idLocation": 1,
            "gamesetId": 1,
            "name": "VQ",
            "type": "quest",
            "gps": "50.0847061N, 14.4610453E",
            "map": "https://mapy.com/cs/turisticka?l=0&dim=6937cf5fcf8675e250c7774a&x=14.4597398&y=50.0822279&z=13"
        },
        {
            "idLocation": 2,
            "gamesetId": 1,
            "name": "VQ",
            "type": "quest",
            "gps": "50.0693939N, 14.4599819E",
            "map": "https://mapy.com/cs/turisticka?dim=6937489e96d29a874494fe4c&x=14.4599444&y=50.0693702&z=18"
        },
        {
            "idLocation": 3,
            "gamesetId": 1,
            "name": "VQ",
            "type": "quest",
            "gps": "50.0567061N, 14.4967833E",
            "map": "https://mapy.com/cs/turisticka?dim=6937d0001a587fe01c1b5e0c&x=14.4967833&y=50.0567061&z=17"
        },
        {
            "idLocation": 4,
            "gamesetId": 1,
            "name": "VQ",
            "type": "quest",
            "gps": "50.0848533N, 14.5111872E",
            "map": "https://mapy.com/cs/turisticka?dim=6937d1cb5ee9a56e7d8ed25a&x=14.5111872&y=50.0848535&z=17"
        },
        {
            "idLocation": 5,
            "gamesetId": 1,
            "name": "VQ",
            "type": "finish",
            "gps": "50.0682692N, 14.5544372E",
            "map": "https://mapy.com/cs/turisticka?dim=692b4a1656e5cb6e3d09a1e4&x=14.5544371&y=50.0682693&z=17"
        }
  ];

  if (locationsData.length > 0) {
      console.log("... lokace");
      await db.insert(locations).values(locationsData).onConflictDoNothing();
  }

  // 4. HRÁČI
  const playersData = [
        {
            "idPlayer": 2,
            "name": "Ivo",
            "playName": "Ivo",
            "pass": "245417",
            "questLock": false,
            "questLockEndtime": null
        },
        {
            "idPlayer": 1,
            "name": "Andy",
            "playName": "Andy",
            "pass": "741741",
            "questLock": false,
            "questLockEndtime": null
        },
        {
            "idPlayer": 3,
            "name": "Radim",
            "playName": "Radim",
            "pass": "336198",
            "questLock": false,
            "questLockEndtime": null
        }
  ];
  if (playersData.length > 0) {
      console.log("... hráči");
      await db.insert(player).values(playersData).onConflictDoNothing();
  }

  // 5. QUESTY
  const questsData = [
        {
            "idQuest": 1,
            "name": "Kdo?",
            "description": "Se ptal",
            "timeLimit": 180
        },
        {
            "idQuest": 2,
            "name": "Kde?",
            "description": "Je ta zajímavá část",
            "timeLimit": 240
        },
        {
            "idQuest": 3,
            "name": "Koho?",
            "description": "To zajímá",
            "timeLimit": 300
        },
        {
            "idQuest": 4,
            "name": "Komu?",
            "description": "To říkáš",
            "timeLimit": 120
        }
  ];
  if (questsData.length > 0) {
      console.log("... questy");
      await db.insert(quests).values(questsData).onConflictDoNothing();
  }

  console.log("✅ Hotovo! Data jsou na serveru.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Chyba při seedování:", err);
  process.exit(1);
});