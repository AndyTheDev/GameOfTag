This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Struktura projektu

Tento projekt je postaven na frameworku Next.js a kombinuje App Router s Tailwind CSS. O napojení na lokální PostgreSQL databázi z Dockeru se stará Drizzle ORM. Zde je kompletní přehled adresářů a souborů naší aplikace:

### Hlavní adresáře (Root):
- **`/app`** - Obsahuje hlavní Next.js routy, stránky (např. `/about`, `/admin`, `/game`) a API endpointy. Najdeš zde React komponenty stránek (`page.tsx`), rozvržení (`layout.tsx`), globální styly (`globals.css`) a také handling stránek, které nebyly nalezeny (`not-found.tsx`).
- **`/drizzle`** - Adresář pro migrační soubory a snapshoty vygenerované pomocí Drizzle ORM pro udržení schématu databáze a její verze.
- **`/postgres_data`** - Sem the ukládají data a persistentní volume z lokálního Postgres Docker kontejneru (běžně ignorováno v gitu).
- **`/public`** - Veřejně dostupné statické soubory, které nepodléhají bundleru (např. výchozí Web ikony, různé SVG atd.).
- **`/scripts`** - Samostatné skripty pro utilitky, určené pro práci s databází, které lze volat přes NPM příkazy (spravují jezdění testovacích dat `seed.ts`, pročišťování `delete-seed.ts` či různé zálohy `dump-data.ts`).
- **`/styles`** - Rezervováno pro případné separátní kaskádové styly, které neřeší Tailwind nebo `/app/globals.css`.
- **`/src`** - Domov pro drtivou většinu logiky a komponent. Přečtěte si oddíl níže.

### Adresář `/src` podrobněji:
- **`/src/actions`** - Server Actions: Next.js funkce bežící na serveru pro operace jako je ošetřování formulářů pro kontrolní body (`loadCheckpoint.ts`), chytání hráčů (`catchRunner.ts`) nebo asynchronní obsluha pro admin panel (`admin.ts`).
- **`/src/assets`** - Statické prostředky jako obrázky a loga (`logo.png`), které jsou spravovány Next.js Image komponentami (bundlerem).
- **`/src/components`** - Znovupoužitelné UI React komponenty, např. navigační pruhy (`Header.tsx`, `Footer.tsx`), tlačítka (`Button.tsx`), layout elementy (`SectionWrapper.tsx`) nebo různé variace karet (`InfoCard.tsx`). Dále jsou tu i herní formuláře jako `CatchForm.tsx`.
- **`/src/db`** - Konfigurace připojení k databázi. Nalezneš tam hlavní schéma db tabulek (`schema.ts`), definice relací navázaných na toto schéma (`relations.ts`) a počáteční inicializaci klientu `drizzle` pro celou aplikaci (`index.ts`).
- **`/src/lib`** - Centrální herní logika aplikována nad databází. Zde mimo jiné najdeš zásadní `gameCron.ts` pro aktualizaci dat s propadlým herním časem.
- **`/src/utils`** - Pomocné middleware, utility, eventové streamery nebo logovací mechanismy. Obsahuje důležité ochranné prvky jako `adminAuth.ts` (kontrola oprávnění), `rateLimit.ts` či handling backendových errorů a posílání log streamu do dashboardu admina.
- **`constants.ts`** - Centrální soubor, kde se izolují statické, sémantické hodnoty, cesty k assetům nebo typově fixované proměnné používané celou aplikací.
- **`worker.ts`** - Na Next.js nezávislý **background proces**. Volá se paralelně při startu aplikace, cykluje v předem definovaném intervalu, dotazuje se na DB (`gameCron.ts`) a stará se o timeouty běžců – pokud jim uprší čas na checkpoint nebo uběhne trest na startu, odbaví je automaticky a bez nutnosti front-end requestu.

### Důležité kořenové konfigurační soubory:
- **`design.sql`** - Čistý SQL kód s prvotním referenčním návrhem databázových tabulek pro architekturu hry.
- **`docker-compose.yml`** - Návod a předpis pro instanciaci a nastartování lokální databáze via Docker kontejner.
- **`package.json`** - Srdce závislostí s definicemi npm příkazů (např. spouštění serveru v konjunktuře s `worker.ts` u příkazů `dev` a `start`, či příkazy pro volání scriptů).
- **`drizzle.config.ts`** - Nastavení a detekce pro Drizzle ORM migrace směrem k DB.
- **`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` atd.** - Standardní definiční konfigurační point pro kompilátor Typescriptu, bundlování a lintování.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
