// // export function parsePlayerIdFromSlug(slug: string): number | null {
// //   // PŘIDÁNO: Kontrola, zda slug existuje
// //   if (!slug) return null;

// //   const match = slug.match(/(\d+)$/);
// //   if (!match) return null;
// //   return parseInt(match[1], 10);
// // }

// // interface PlayerIdentity {
// //   idPlayer: number;
// //   name: string;
// // }

// // export function validateSlug(slug: string, player: PlayerIdentity): boolean {
// //   // PŘIDÁNO: Kontrola, zda slug existuje
// //   if (!slug || !player.name) return false;
  
// //   const pName = player.name;
// //   const firstTwo = pName.substring(0, 2);
// //   const lastOne = pName.slice(-1);
// //   const id = player.idPlayer.toString();

// //   const expectedSlug = `${firstTwo}${lastOne}${id}`;
  
// //   return slug.toLowerCase() === expectedSlug.toLowerCase();
// // }

// // Pomocná funkce pro odstranění diakritiky (neexportujeme, je jen pro vnitřní logiku)
// const removeAccents = (str: string) => {
//   return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
// };

// interface PlayerIdentity {
//   idPlayer: number;
//   name: string;
// }

// export function parsePlayerIdFromSlug(slug: string): number | null {
//   if (!slug) return null;
//   const match = removeAccents(slug).match(/^[a-z]{2}(\d+)[a-z]$/i);
//   if (!match) return null;
//   return parseInt(match[1], 10);
// }

// export function validateSlug(slug: string, player: PlayerIdentity): boolean {
//   if (!slug || !player.name) return false;

//   // 1. Normalizace jména z DB a slugu (malá písmena, bez háčků)
//   const normName = removeAccents(player.name);
//   const normSlug = removeAccents(slug);

//   // 2. Extrakce částí podle nové logiky
//   // Příklad: name = "Jirka", id = 14
//   const firstTwo = normName.substring(0, 2); // "ji"
//   const lastOne = normName.slice(-1);        // "a"
//   const id = player.idPlayer.toString();     // "14"

//   // 3. Sestavení očekávaného slugu: "ji" + "14" + "a" -> "ji14a"
//   const expectedSlug = `${firstTwo}${id}${lastOne}`;

//   return normSlug === expectedSlug;
// }


// Pomocná funkce: Odstraní diakritiku, mezery a převede na malá písmena
const normalize = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
};

interface PlayerIdentity {
  idPlayer: number;
  name: string;
}

export function parsePlayerIdFromSlug(slug: string): number | null {
  if (!slug) return null;

  const normalizedSlug = normalize(slug);

  // ZMĚNA REGEXU:
  // ^[a-z]{2} -> začíná dvěma písmeny
  // (\d+)     -> uprostřed je číslo (to chceme chytit do match[1])
  // [a-z]$    -> končí jedním písmenem
  const match = normalizedSlug.match(/^[a-z]{2}(\d+)[a-z]$/);
  
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function validateSlug(slug: string, player: PlayerIdentity): boolean {
  if (!slug || !player.name) return false;

  const normSlug = normalize(slug);
  const normName = normalize(player.name);

  // Ošetření pro velmi krátká jména (např. "Bo"), aby kód nespadl
  if (normName.length < 2) return false;

  // 1. První dvě písmena jména
  const firstTwo = normName.substring(0, 2);
  
  // 2. Poslední písmeno jména (díky trim() v normalize ignorujeme náhodné mezery na konci)
  const lastOne = normName.slice(-1);
  
  // 3. ID hráče
  const id = player.idPlayer.toString();

  // Složení: "ad" + "18" + "y"
  const expectedSlug = `${firstTwo}${id}${lastOne}`;

  return normSlug === expectedSlug;
}