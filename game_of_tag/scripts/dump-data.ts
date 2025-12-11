// import * as dotenv from "dotenv";
// import * as path from "path";

// // 1. Zjistíme cestu k .env souboru (o jednu složku výš než je tento skript)
// const envPath = path.resolve(__dirname, "../.env");

// // 2. Načteme ho
// const result = dotenv.config({ path: envPath });

// if (result.error) {
//   console.error("❌ Chyba: Nemůžu najít soubor .env na cestě:", envPath);
//   process.exit(1);
// }

// // 3. Pro jistotu vypíšeme, jestli se načetla (bez hesla, jen jestli existuje)
// if (!process.env.DATABASE_URL) {
//   console.error("❌ Chyba: Soubor .env se načetl, ale chybí v něm DATABASE_URL!");
//   process.exit(1);
// } else {
//   console.log("✅ .env úspěšně načten.");
// }

// // 4. Teprve TEĎ importujeme databázi
// // (Musí to být až po načtení .env, jinak to spadne)
// import { db } from "../src/db/index"; 
// import { player, locations, quests, logType, gameset, gameSession } from "../src/db/schema"; 

// async function main() {
//     console.log("--- KOPÍRUJ OD TUD ---");
    
//     // 1. Lokace
//     const locs = await db.select().from(locations);
//     console.log("\n// DATA PRO LOKACE:");
//     console.log(JSON.stringify(locs, null, 2));

//     // 2. Hráči
//     const players = await db.select().from(player);
//     console.log("\n// DATA PRO HRÁČE:");
//     console.log(JSON.stringify(players, null, 2));

//     // 3. Questy
//     const q = await db.select().from(quests);
//     console.log("\n// DATA PRO QUESTY:");
//     console.log(JSON.stringify(q, null, 2));

//     // 4. Gameset
//     const g = await db.select().from(gameset);
//     console.log("\n// DATA PRO GAMESET:");
//     console.log(JSON.stringify(g, null, 2));

//     //5. Game session
//     const gamesession = await db.select().from(gameSession);
//     console.log("\n// DATA PRO LOKACE:");
//     console.log(JSON.stringify(gamesession, null, 2));

//     //6. Game session
//     const logtype = await db.select().from(logType);
//     console.log("\n// DATA PRO LOKACE:");
//     console.log(JSON.stringify(logtype, null, 2));

//     console.log("\n--- KONEC KOPÍROVÁNÍ ---");
//     process.exit(0);
// }

 /* // main();
import * as dotenv from "dotenv";
import * as path from "path";

async function main() {
  console.log("🔄 Načítám konfiguraci...");

  // 1. Nejdřív načteme .env
  const envPath = path.resolve(__dirname, "../.env");
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.error("❌ Chyba: Nemůžu najít soubor .env na cestě:", envPath);
    process.exit(1);
  }

  // 2. Ověříme, že se načetl
  if (!process.env.DATABASE_URL) {
     console.error("❌ Chyba: .env se načetl, ale DATABASE_URL chybí nebo je prázdná.");
     process.exit(1);
  }
  console.log("✅ Konfigurace načtena.");

  // 3. TADY JE TA ZMĚNA: Dynamický import databáze
  // Načte se až teď, když už máme DATABASE_URL v paměti
  const { db } = await import("../src/db/index");
  const { player, locations, quests, gameset, gameSession, logType } = await import("../src/db/schema");

  console.log("--- KOPÍRUJ OD TUD ---");
  
  try {
      // 4. Lokace
      const locs = await db.select().from(locations);
      console.log("\n// DATA PRO LOKACE:");
      console.log(JSON.stringify(locs, null, 2));

      // 5. Hráči
      const players = await db.select().from(player);
      console.log("\n// DATA PRO HRÁČE:");
      console.log(JSON.stringify(players, null, 2));

      // 6. Questy
      const q = await db.select().from(quests);
      console.log("\n// DATA PRO QUESTY:");
      console.log(JSON.stringify(q, null, 2));

      // 7. Gameset
      const g = await db.select().from(gameset);
      console.log("\n// DATA PRO GAMESET:");
      console.log(JSON.stringify(g, null, 2));

          //8. Game session
        const gamesession = await db.select().from(gameSession);
        console.log("\n// DATA PRO LOKACE:");
        console.log(JSON.stringify(gamesession, null, 2));

        //9. Log type
        const logtype = await db.select().from(logType);
        console.log("\n// DATA PRO LOKACE:");
        console.log(JSON.stringify(logtype, null, 2));
      
  } catch (error) {
      console.error("\n❌ Chyba při komunikaci s databází:", error);
  }

  console.log("\n--- KONEC KOPÍROVÁNÍ ---");
  process.exit(0);
}

main(); */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔍 Diagnostika souboru .env...");

  // 1. Zjistíme, odkud skript spouštíš (tvá kořenová složka)
  const currentDir = process.cwd();
  console.log(`📂 Pracovní složka: ${currentDir}`);

  // 2. Sestavíme cestu k .env
  const envPath = path.join(currentDir, ".env.local");

  // 3. Fyzická kontrola existence souboru
  if (!fs.existsSync(envPath)) {
    console.error(`❌ CHYBA: Soubor na cestě '${envPath}' fyzicky neexistuje!`);
    
    console.log("\n👀 Hledám podobné soubory v této složce:");
    const files = fs.readdirSync(currentDir);
    const envFiles = files.filter(f => f.startsWith(".env") || f.includes("env"));
    
    if (envFiles.length > 0) {
        envFiles.forEach(f => console.log(`   -> Nalezen soubor: '${f}' (Není to náhodou .env.txt?)`));
    } else {
        console.log("   -> Žádné soubory připomínající .env nenalezeny.");
    }
    process.exit(1);
  }

  // 4. Pokud existuje, načteme ho
  dotenv.config({ path: envPath });

  if (!process.env.DATABASE_URL) {
     console.error("❌ Soubor existuje, ale DATABASE_URL v něm chybí!");
     process.exit(1);
  }

  console.log("✅ .env nalezen a načten!");

  // 5. Dynamický import databáze
  const { db } = await import("../src/db/index");
  const { player, locations, quests, gameset, gameSession, logType } = await import("../src/db/schema");

  console.log("\n--- KOPÍRUJ OD TUD ---");
  
  try {
      const locs = await db.select().from(locations);
      console.log("\n// DATA PRO LOKACE:");
      console.log(JSON.stringify(locs, null, 2));

      const players = await db.select().from(player);
      console.log("\n// DATA PRO HRÁČE:");
      console.log(JSON.stringify(players, null, 2));

      const q = await db.select().from(quests);
      console.log("\n// DATA PRO QUESTY:");
      console.log(JSON.stringify(q, null, 2));

      const g = await db.select().from(gameset);
      console.log("\n// DATA PRO GAMESET:");
      console.log(JSON.stringify(g, null, 2));
                //8. Game session
        const gamesession = await db.select().from(gameSession);
        console.log("\n// DATA PRO GAME SESSION:");
        console.log(JSON.stringify(gamesession, null, 2));

        //9. Log type
        const logtype = await db.select().from(logType);
        console.log("\n// DATA PRO TYPY LOGŮ:");
        console.log(JSON.stringify(logtype, null, 2));
      
  } catch (error) {
      console.error("\n❌ Chyba DB:", error);
  }

  console.log("\n--- KONEC KOPÍROVÁNÍ ---");
  process.exit(0);
}

main();