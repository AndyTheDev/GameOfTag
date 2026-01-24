import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema'; 

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const globalClient = globalThis as typeof globalThis & {
  __dbClient?: ReturnType<typeof postgres>;
};

const client =
  globalClient.__dbClient ??
  postgres(connectionString, {
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idle_timeout: 20,
    connect_timeout: 10,
  }); // Pool pomaha stabilite a snizuje pocet spojeni.

globalClient.__dbClient = client;
export const db = drizzle(client, { schema });