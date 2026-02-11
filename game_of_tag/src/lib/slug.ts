export function parsePlayerIdFromSlug(slug: string): number | null {
  // PŘIDÁNO: Kontrola, zda slug existuje
  if (!slug) return null;

  const match = slug.match(/(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

interface PlayerIdentity {
  idPlayer: number;
  name: string;
}

export function validateSlug(slug: string, player: PlayerIdentity): boolean {
  // PŘIDÁNO: Kontrola, zda slug existuje
  if (!slug || !player.name) return false;
  
  const pName = player.name;
  const firstTwo = pName.substring(0, 2);
  const lastOne = pName.slice(-1);
  const id = player.idPlayer.toString();

  const expectedSlug = `${firstTwo}${lastOne}${id}`;
  
  return slug.toLowerCase() === expectedSlug.toLowerCase();
}