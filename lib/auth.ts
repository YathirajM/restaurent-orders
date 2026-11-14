import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { eq, and, gt, lt } from "drizzle-orm";
import { db } from "./db";
import { adminUsers, sessions } from "./db/schema";

export const SESSION_COOKIE = "rq_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  restaurantId: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.insert(sessions).values({ token, userId, expiresAt });
  // Opportunistic cleanup of expired sessions.
  await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date().toISOString()));
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      restaurantId: adminUsers.restaurantId,
      isActive: adminUsers.isActive,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(adminUsers, eq(sessions.userId, adminUsers.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date().toISOString())))
    .limit(1);

  const row = rows[0];
  if (!row || !row.isActive) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    restaurantId: row.restaurantId,
  };
}

/**
 * Route guard for admin APIs. Throws a typed error the caller converts
 * into a 401/403 response. Kitchen role can read but not mutate menu.
 */
export async function requireUser(
  allowedRoles?: string[],
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("Authentication required") as Error & {
      status?: number;
    };
    err.status = 401;
    throw err;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const err = new Error("Insufficient permissions") as Error & {
      status?: number;
    };
    err.status = 403;
    throw err;
  }
  return user;
}

export { safeEqual };
