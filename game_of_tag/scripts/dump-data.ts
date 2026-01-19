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