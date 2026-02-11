import { db } from '../db';
import { players, teams } from '../db/schema';
import { eq } from 'drizzle-orm';
import { parsePlayerIdFromSlug, validateSlug } from '@/src/lib/slug';

export async function getRunnerBySlug(slug: string) {
  const id = parsePlayerIdFromSlug(slug);
  if (!id) return null;

  // Spojíme tabulku hráčů s tabulkou týmů
  const result = await db
    .select({
      name: players.name,
      idPlayer: players.idPlayer,
      teamName: teams.name,
    })
    .from(players)
    .leftJoin(teams, eq(players.teamId, teams.idTeam))
    .where(eq(players.idPlayer, id))
    .limit(1);

  const runner = result[0];

  // Validace: Pokud hráč neexistuje nebo nesedí slug (ochrana proti hádání ID)
  if (!runner || !validateSlug(slug, { ...runner, idPlayer: runner.idPlayer })) {
    return null;
  }

  return runner;
}