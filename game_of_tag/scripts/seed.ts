import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { player, locations, quests, logType, gameset, gameSession } from "../src/db/schema"; 
import * as dotenv from "dotenv";
import * as path from "path";

// 1. NEJDŘÍV NAČTEME .ENV (Oprava cesty)
// Zjistíme cestu o složku výš
// const envPath = path.resolve(__dirname, "../.env.local");
const envPath = path.resolve(__dirname, "../.env");
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
            "map": "https://mapy.com/cs/turisticka?dim=693bda0e694d79f477ae4114&x=14.5073695&y=50.0615247&z=18"
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
            "name": "VF",
            "type": "finish",
            "gps": "50.0682692N, 14.5544372E",
            "map": "https://mapy.com/cs/turisticka?dim=692b4a1656e5cb6e3d09a1e4&x=14.5544371&y=50.0682693&z=17"
        },
        {
            "idLocation": 6,
            "gamesetId": 1,
            "name": "JZQ",
            "type": "quest",
            "gps": "50.0675733N, 14.4007994E",
            "map": "https://mapy.com/cs/turisticka?dim=6938972670c88169ce1eb86d&x=14.4008050&y=50.0675596&z=19"
        },
        {
            "idLocation": 7,
            "gamesetId": 1,
            "name": "JZQ",
            "type": "quest",
            "gps": "50.0634850N, 14.4210594E",
            "map": "https://mapy.com/cs/turisticka?dim=69385d7ad8b3311e604694f4&x=14.4210000&y=50.0635105&z=19"
        },
        {
            "idLocation": 8,
            "gamesetId": 1,
            "name": "JZQ",
            "type": "quest",
            "gps": "50.0424786N, 14.4137058E",
            "map": "https://mapy.com/cs/turisticka?dim=69385ddd0043b649871b5e0b&x=14.4137057&y=50.0424787&z=17"
        },
        {
            "idLocation": 9,
            "gamesetId": 1,
            "name": "JZQ",
            "type": "quest",
            "gps": "50.0416458N, 14.3898261E",
            "map": "https://mapy.com/cs/turisticka?dim=6938937d6d8e2f334e1991fe&x=14.3898415&y=50.0416361&z=19"
        },
        {
            "idLocation": 10,
            "gamesetId": 1,
            "name": "JZF",
            "type": "finish",
            "gps": "50.0173806N, 14.3624344E",
            "map": "https://mapy.com/cs/turisticka?dim=692b476956e5cb6e3dfe77df&x=14.3618927&y=50.0165326&z=15"
        },
        {
            "idLocation": 11,
            "gamesetId": 1,
            "name": "SZQ",
            "type": "quest",
            "gps": "50.0979600N, 14.4206467E",
            "map": "https://mapy.com/cs/turisticka?dim=69389442dd34df7218404ee5&x=14.4206466&y=50.0979601&z=17"
        },
        {
            "idLocation": 12,
            "gamesetId": 1,
            "name": "SZQ",
            "type": "quest",
            "gps": "50.0886717N, 14.4019636E",
            "map": "https://mapy.com/cs/turisticka?dim=693895899039349f16404ee5&x=14.4019637&y=50.0886717&z=17"
        },
        {
            "idLocation": 13,
            "gamesetId": 1,
            "name": "SZQ",
            "type": "quest",
            "gps": "50.1039892N, 14.3707108E",
            "map": "https://mapy.com/cs/turisticka?dim=693896056b492020be1eb86f&x=14.3707126&y=50.1039649&z=19"
        },
        {
            "idLocation": 14,
            "gamesetId": 1,
            "name": "SZQ",
            "type": "quest",
            "gps": "50.1125106N, 14.3952836E",
            "map": "https://mapy.com/cs/turisticka?dim=693896a04742dde0d194fe4c&x=14.3952837&y=50.1125107&z=17"
        },
        {
            "idLocation": 15,
            "gamesetId": 1,
            "name": "SZF",
            "type": "finish",
            "gps": "50.1125106N, 14.3952836E",
            "map": "https://mapy.com/cs/turisticka?dim=693a9f74f374355875404ee5&x=14.3794426&y=50.1311645&z=19"
        },
        {
            "idLocation": 16,
            "gamesetId": 2,
            "name": "ZQ",
            "type": "quest",
            "gps": "50.0737642N, 14.3994408E",
            "map": "https://mapy.com/cs/turisticka?dim=6937d3d48b1fcade571b5e0b&x=14.3978260&y=50.0854753&z=14"
        },
        {
            "idLocation": 17,
            "gamesetId": 2,
            "name": "ZQ",
            "type": "quest",
            "gps": "50.0823828N, 14.4028267E",
            "map": "https://mapy.com/cs/turisticka?dim=693aa1b307846eb88d94fe4c&x=14.4028267&y=50.0823827&z=17"
        },
        {
            "idLocation": 18,
            "gamesetId": 2,
            "name": "ZQ",
            "type": "quest",
            "gps": "50.0895894N, 14.3511239E",
            "map": "https://mapy.com/cs/turisticka?dim=693aa1f943e63582521b5e0c&x=14.3511239&y=50.0895894&z=17"
        },
        {
            "idLocation": 19,
            "gamesetId": 2,
            "name": "ZQ",
            "type": "quest",
            "gps": "50.0717292N, 14.3520522E",
            "map": "https://mapy.com/cs/turisticka?dim=693aa22cba84871ead4694f3&x=14.3520521&y=50.0717290&z=17"
        },
        {
            "idLocation": 20,
            "gamesetId": 2,
            "name": "ZF",
            "type": "finish",
            "gps": "50.0717292N, 14.3520522E",
            "map": "https://mapy.com/cs/turisticka?dim=693aa22cba84871ead4694f3&x=14.3520521&y=50.0717290&z=17"
        },
        {
            "idLocation": 21,
            "gamesetId": 2,
            "name": "JVQ",
            "type": "quest",
            "gps": "50.0498375N, 14.4322419E",
            "map": "https://mapy.com/cs/turisticka?dim=693890aed7a439ed9c1b5e0b&x=14.4322419&y=50.0498375&z=17"
        },
        {
            "idLocation": 22,
            "gamesetId": 2,
            "name": "JVQ",
            "type": "quest",
            "gps": "50.0551400N, 14.4537836E",
            "map": "https://mapy.com/cs/turisticka?dim=69389145a394c7862f1b5e0b&x=14.4537835&y=50.0551399&z=17"
        },
        {
            "idLocation": 23,
            "gamesetId": 2,
            "name": "JVQ",
            "type": "quest",
            "gps": "50.0165072N, 14.4426300E",
            "map": "https://mapy.com/cs/turisticka?dim=6938918a5860c3af0b1245a3&x=14.4426300&y=50.0165072&z=17"
        },
        {
            "idLocation": 24,
            "gamesetId": 2,
            "name": "JVQ",
            "type": "quest",
            "gps": "50.0192956N, 14.4711264E",
            "map": "https://mapy.com/cs/turisticka?dim=69389247bee1673b41de81ed&x=14.4711265&y=50.0192955&z=17"
        },
        {
            "idLocation": 25,
            "gamesetId": 2,
            "name": "JVF",
            "type": "finish",
            "gps": "49.9926697N, 14.4645775E",
            "map": "https://mapy.com/cs/turisticka?dim=692b48d556e5cb6e3d05ed7b&x=14.4644773&y=49.9926727&z=19"
        },
        {
            "idLocation": 26,
            "gamesetId": 2,
            "name": "SVQ",
            "type": "quest",
            "gps": "50.1016350N, 14.4474758E",
            "map": "https://mapy.com/cs/turisticka?dim=693aa067486e98e6d5404f14&x=14.4474687&y=50.1016130&z=19"
        },
        {
            "idLocation": 27,
            "gamesetId": 2,
            "name": "SVQ",
            "type": "quest",
            "gps": "50.0950114N, 14.4601672E",
            "map": "https://mapy.com/cs/turisticka?dim=693aa0a797cea2ee441eb86d&x=14.4602696&y=50.0949192&z=19"
        },
        {
            "idLocation": 28,
            "gamesetId": 2,
            "name": "SVQ",
            "type": "quest",
            "gps": "50.1172911N, 14.4994728E",
            "map": "https://mapy.com/cs/turisticka?dim=693aa0bd8d323408c48ed25a&x=14.4994727&y=50.1172911&z=17"
        },
                {
            "idLocation": 29,
            "gamesetId": 2,
            "name": "SVQ",
            "type": "quest",
            "gps": "50.1267058N, 14.4685747E",
            "map": "https://mapy.com/cs/turisticka?dim=693aa0dc6f0efcc9674694f3&x=14.4685704&y=50.1267084&z=19"
        },
                {
            "idLocation": 30,
            "gamesetId": 2,
            "name": "SVF",
            "type": "finish",
            "gps": "50.1387758N, 14.5135206E",
            "map": "https://mapy.com/cs/turisticka?dim=693aa10367587d255a1b5e0b&x=14.5135205&y=50.1387757&z=17"
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
        "name": "Schody šampióna",
        "description": "Najdi schody, které mají alespoň 20 schodů. Vyskákej je 2x jen po levé noze, 2x jen po pravé noze, 2x snožmo (obě nohy u sebe) a nakonec je 5x celé rychle vyběhni nahoru a dolů.\nPolož mobil na zem nebo ho drž v ruce a natoč celé cvičení na video .",
        "timeLimit": 360
    },
    {
        "idQuest": 2,
        "name": "Výdrž na jedné noze",
        "description": "Stůj na jedné noze 2 minuty v kuse. Pokud se dotkneš druhou nohou země, musíš začít od nuly!\nPolož mobil na zem a natoč celý úkol na video.",
        "timeLimit": 360
    },
    {
        "idQuest": 3,
        "name": "Průvodce",
        "description": "Najdi turistu nebo cizince. Cizím jazykem mu doporuč jednu restauraci nebo památku, která je blízko, a vysvětli mu cestu, kudy se tam dostane.\nNahraj zvuk nebo video, jak mu to vysvětluješ.",
        "timeLimit": 360
    },
    {
        "idQuest": 4,
        "name": "Červená horečka",
        "description": "Najdi a vyfoť 10 různých červených věcí. Každá věc musí být jiná (jedno červené auto, jedna značka, ...).\nDůkazem je 10 fotek v galerii mobilu. Může se jednat o screenshot 10 čitelných fotek.",
        "timeLimit": 360
    },
    {
        "idQuest": 5,
        "name": "Abeceda naruby",
        "description": "Nauč se celou abecedu pozpátku (od Ž do A). Až si budeš jistý/á, natoč se na video, jak ji celou říkáš zpaměti. Nesmíš udělat chybu.\nNatoč video tvého obličeje, jak recituješ (nesmíš nic číst!).",
        "timeLimit": 360
    },
    {
        "idQuest": 6,
        "name": "Lovec čísel",
        "description": "Najdi a vyfoť tři tramvaje nebo autobusy, který má v čísle linky číslici \"2\" (třeba 2, 12, 22, 26...). Může se jednat o stejnou linku, ale jiný autobus / tramvaj.\nDůkazem jsou 3 fotky různých vozidel MHD.",
        "timeLimit": 360
    },
    {
        "idQuest": 7,
        "name": "Selfie se sochou",
        "description": "Najdi sochu, pomník nebo umění na ulici. Stoupni si vedle toho a udělej úplně stejnou pózu, jako zvárňuje toto umění.\nDůkazem je fotka (selfie) tebe a sochy ve stejné póze.",
        "timeLimit": 360
    },
    {
        "idQuest": 8,
        "name": "Quick maths!",
        "description": "Podívej se kolem sebe na auta. Najdi 3 auta, která mají v SPZce (značce) číslo 2 nebo 5. Sečti všechna čísla na té značce a výsledek řekni na video.\nDůkazem je video se záběrem na značku auta a tvůj výpočet nahlas.",
        "timeLimit": 360
    },
    {
        "idQuest": 9,
        "name": "Lovec...vody?",
        "description": "Jdi do jakékoliv restaurace, kavárny nebo baru. Popros obsluhu o sklenici vody z kohoutku zadarmo. Musíš ji dostat zadarmo do skla, ne do vlastní lahve.\nDůkazem je selfie, jak si připíjíš tou vodou.",
        "timeLimit": 360
    },
    {
        "idQuest": 10,
        "name": "Caretaker",
        "description": "Oslov 3 různé lidi a řekni každému z nich hezký a upřímný kompliment (třeba: „Máte skvělý kabát“ nebo „Sluší vám to“).\nZapni nahrávání zvuku na mobilu (nebo kameru) a nahraj si rozhovory (mobil měj v kapse nebo ruce).",
        "timeLimit": 360
    },
    {
        "idQuest": 11,
        "name": "Kámen, nůžky, papír",
        "description": "Zastavuj cizí lidi a hraj s nimi Kámen, nůžky, papír. Musíš vyhrát 3x v řadě. Když prohraješ, tvoje řada se nuluje a musíš začít znova od prvního vítězství. S jedním člověkem můžeš hrát jen jednou.\nNatoč video, kde je vidět hra s cizími lidmi.",
        "timeLimit": 360
    },
    {
        "idQuest": 12,
        "name": "Pes, přítel člověka",
        "description": "Najdi někoho, kdo venčí psa. Zeptej se, jak se pes jmenuje, a popros, jestli si můžeš psa vyfotit (nebo se vyfotit s ním).\nDůkazem je tvoje fotka psa / se psem.",
        "timeLimit": 360
    },
    {
        "idQuest": 13,
        "name": "Pán prstenů",
        "description": "Najdi v okolí 3 různé kulaté věci, které jsou větší než tvoje hlava (třeba kolo od auta, dopravní značka, poklop kanálu). Každou věc vyfoť.\nDůkazem jsou 3 fotky kulatých věcí.",
        "timeLimit": 360
    },
    {
        "idQuest": 14,
        "name": "Zprávy o počasí",
        "description": "Zahraj si na moderátora počasí. Natoč minutové video, kde budeš popisovat, jaké je počasí, co mají lidé na sobě a jak fouká vítr. Musí to být vtipné!\nDůkazem je minutové video.",
        "timeLimit": 360
    },
    {
        "idQuest": 15,
        "name": "Módní dvojče",
        "description": "Najdi cizího člověka, který má na sobě jeden kus oblečení stejné barvy, jako máš ty (tričko, bunda nebo kalhoty). Udělejte si s ním selfie.",
        "timeLimit": 360
    },
    {
        "idQuest": 16,
        "name": "Mistr kvízu",
        "description": "Ptej se na názor různých lidí na zásadní otázku: „Pizza s ananasem – ano, nebo ne?“ Musíš získat alespoň 3 odpovědi „ANO“ (nebo naopak „NE“, to si musíš vybrat předem). Nahraj zvuk.",
        "timeLimit": 360
    }
  ];
  if (questsData.length > 0) {
      console.log("... questy");
      await db.insert(quests).values(questsData).onConflictDoUpdate({
        target: quests.idQuest,
        set: {
            name: sql`excluded.name`,
            description: sql`excluded.description`,
            timeLimit: sql`excluded."time_limit"`    
        },
      });
  }

  console.log("✅ Hotovo! Data jsou na serveru.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Chyba při seedování:", err);
  process.exit(1);
});