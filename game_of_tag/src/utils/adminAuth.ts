import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { logInfo, logWarn } from "./logger";

type AdminSession = {
  userId: number;
  expiresAt: number;
};

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const globalSessions = globalThis as typeof globalThis & {
  __adminSessions?: Map<string, AdminSession>;
};

const sessionStore =
  globalSessions.__adminSessions ?? new Map<string, AdminSession>(); // Sdilena pamet mezi hot-reloady.

globalSessions.__adminSessions = sessionStore;

function pruneExpiredSessions(now: number) {
  for (const [token, session] of sessionStore.entries()) {
    if (session.expiresAt <= now) {
      sessionStore.delete(token);
    }
  }
}

export async function createAdminSession(userId: number) {
  const token = randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessionStore.set(token, { userId, expiresAt });
  const cookieStore = await cookies(); // Next vraci Promise, jinak nelze volat set.
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    path: "/",
  });
  logInfo("Admin session vytvořena", { userId });
  return token;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    sessionStore.delete(token);
  }
  cookieStore.delete(SESSION_COOKIE);
  logInfo("Admin session odstraněna");
}

export async function requireAdminSession() {
  const now = Date.now();
  pruneExpiredSessions(now);
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return { ok: false as const };
  }

  const session = sessionStore.get(token);
  if (!session || session.expiresAt <= now) {
    sessionStore.delete(token);
    logWarn("Admin session expirovala");
    return { ok: false as const };
  }

  return { ok: true as const, userId: session.userId };
}
