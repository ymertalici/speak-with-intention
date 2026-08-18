import { and, desc, eq, gt, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-http";
import * as pg from "pg";
import type { InsertUser } from "../drizzle/schema";
import {
  contextualVocabularyResults,
  learningProfiles,
  placementAttempts,
  practiceHistory,
  programAccess,
  ProgramAccess,
  users,
  weekProgress,
  weeklyCoachSummaries,
  xpEvents,
  accessCodes,
} from "../drizzle/schema";

import { ensureTables } from "./ensureTables";

/**
 * PostgreSQL database layer — zero-configuration Supabase mode.
 *
 * Two ways to connect, in priority order:
 *  1. SUPABASE_REF + SUPABASE_PASSWORD env vars → connection string is built
 *     automatically (Supabase session pooler, IPv4-friendly for Vercel).
 *  2. Full DATABASE_URL env var → used as-is (any PostgreSQL provider).
 *
 * The session pooler disables prepared statements, so Drizzle's
 * `prepareThreshold` / `statement` handling is turned off when built from
 * SUPABASE_REF.
 */
let _db: (ReturnType<typeof drizzle> | ReturnType<typeof drizzleServerless>) | null = null;
let _connecting = false;

/** Build the connection string from SUPABASE_REF + SUPABASE_PASSWORD. */
function buildSupabaseUrl(): string | null {
  const ref = (process.env.SUPABASE_REF ?? "").trim();
  const password = (process.env.SUPABASE_PASSWORD ?? "").trim();
  if (!ref || !password) return null;
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${extractRegion(ref)}.pooler.supabase.com:5432/postgres`;
}

/**
 * Extract the Supabase region suffix from the reference id. The ref's last
 * four characters encode region + cloud (e.g. "mqwdk" → ap-southeast-1).
 * Fall back to "us-east-1" when the suffix cannot be resolved; Supabase
 * pooler endpoints per region are well known for the standard suffixes.
 */
function extractRegion(ref: string): string {
  const suffix = ref.slice(-4).toLowerCase();
  if (/^[a-z0-9]{4}$/.test(suffix) === false) return "us-east-1";
  // Map the last char (cloud) + first three (region) used by Supabase refs.
  const cloud = suffix.charAt(3);
  const regionPart = suffix.slice(0, 3);
  const regionByCode: Record<string, string> = {
    "use1": "us-east-1", "ue2": "us-east-2", "usw1": "us-west-1", "usw2": "us-west-2",
    "cac1": "ca-central-1",
    "euc1": "eu-central-1", "euw1": "eu-west-1", "euw2": "eu-west-2", "euw3": "eu-west-3",
    "eun1": "eu-north-1", "euso1": "eu-south-1", "euso2": "eu-south-2",
    "aps1": "ap-south-1", "aps2": "ap-south-2", "apse1": "ap-southeast-1",
    "apse2": "ap-southeast-2", "apse3": "ap-southeast-3", "apne1": "ap-northeast-1",
    "apne2": "ap-northeast-2", "apne3": "ap-northeast-3", "me1": "me-south-1",
    "mes1": "me-south-1", "sa1": "sa-east-1", "afs1": "af-south-1",
    // Default fallbacks when code is ambiguous.
    "1": "us-east-1", "2": "us-east-2", "3": "eu-central-1", "4": "ap-southeast-1",
    "5": "ap-southeast-2", "6": "ap-northeast-1", "7": "eu-west-1", "8": "ap-south-1",
  };
  const mapped = regionByCode[regionPart] ?? regionByCode[cloud];
  return mapped ?? "us-east-1";
}

/**
 * Resolve the final connection URL with region verification via the public
 * REST API. If the region map guess is wrong, the REST probe corrects it.
 */
async function resolveSupabaseUrl(): Promise<string | null> {
  const ref = (process.env.SUPABASE_REF ?? "").trim();
  const password = (process.env.SUPABASE_PASSWORD ?? "").trim();
  if (!ref || !password) return null;

  let region = extractRegion(ref);
  // Public REST probe: the auth/health endpoint responds on the real region.
  const candidates = [region];
  // Common fallback regions for ambiguous suffixes (supabase.com runs on these).
  for (const extra of ["us-east-1", "eu-central-1", "ap-southeast-1"]) {
    if (extra !== region) candidates.push(extra);
  }
  for (const candidate of candidates) {
    const healthUrl = `https://${ref}.supabase.co/auth/v1/health`;
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        region = candidate;
        break;
      }
    } catch {
      // Keep probing next candidate.
    }
  }
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
}

/** Resolve the database URL lazily (supports SUPABASE_REF or DATABASE_URL). */
async function resolveDatabaseUrl(): Promise<string | null> {
  const direct = (process.env.DATABASE_URL ?? "").trim();
  if (direct) return direct;
  const supabaseUrl = await resolveSupabaseUrl();
  if (supabaseUrl) {
    console.info("[Database] Supabase REF modu: otomatik bağlantı kuruluyor (pooler, IPv4).");
  }
  return supabaseUrl;
}

function buildClient(databaseUrl: string) {
  // Neon / serverless-compatible URL (http or options pooler) → HTTP driver
  if (databaseUrl.startsWith("http://") || databaseUrl.startsWith("https://")) {
    return drizzleServerless(neon(databaseUrl));
  }
  // postgresql:// URL → node-postgres. Session pooler requires no prepared
  // statements (PgBouncer in session mode forbids parse/extended protocol).
  // drizzle-orm's node-postgres driver always wraps the URL in a Pool, so we
  // pass a single pg.Client (extended protocol disabled via `pool:false` on
  // the client is not supported — the session pooler simply refuses the
  // parse/extended query flow; a standalone Client issues simple queries
  // fine for our CREATE/SELECT/INSERT statements).
  const client = new pg.Client({ connectionString: databaseUrl });
  return drizzle({ client, casing: "snake_case" });
}

/**
 * Sanity-check the database URL host. Vercel's serverless runtime cannot
 * resolve made-up or mistyped hosts (ENOTFOUND); catch it early with a
 * clear console message instead of failing cryptically on the first query.
 */
function validateDatabaseUrl(databaseUrl: string): boolean {
  if (databaseUrl.startsWith("http://") || databaseUrl.startsWith("https://")) return true;
  try {
    const hostMatch = databaseUrl.match(/@([^/:]+)(:\d+)?\//);
    const host = hostMatch ? hostMatch[1] : null;
    if (!host || !host.includes(".")) {
      console.error("[Database] Bağlantı adresi geçersiz: host kısmı bulunamadı.", databaseUrl.replace(/:[^@/]+@/, ":****@"));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function getDb() {
  if (_db) return _db;
  if (_connecting) {
    // Another request is mid-connect; wait briefly then re-check.
    await new Promise(resolve => setTimeout(resolve, 100));
    return _db;
  }
  _connecting = true;
  try {
    const databaseUrl = await resolveDatabaseUrl();
    if (!databaseUrl) {
      console.error("[Database] Bağlantı bilgisi yok: DATABASE_URL ya da SUPABASE_REF + SUPABASE_PASSWORD ayarlanmalı.");
      _db = null;
      return null;
    }
    if (!validateDatabaseUrl(databaseUrl)) {
      _db = null;
      return null;
    }
    try {
      const db = buildClient(databaseUrl);
      await db.execute(sql`SELECT 1`);
      _db = db as unknown as ReturnType<typeof drizzle>;
      void ensureTables(db as unknown as ReturnType<typeof drizzle>);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/ENOTFOUND|getaddrinfo/i.test(message)) {
        console.error(
          "[Database] DNS hatası: adres çözümlenemiyor. SUPABASE_REF / bağlantı adresini kontrol edin.",
        );
      } else if (/password authentication failed/i.test(message)) {
        console.error(
          "[Database] Şifre hatası: SUPABASE_PASSWORD (veya dizedeki şifre) veritabanı şifresiyle eşleşmiyor.",
          "Supabase → Settings → Database → Reset database password ile yeni şifre alıp env'i güncelleyin.",
        );
      } else {
        console.warn("[Database] Failed to connect:", error);
      }
      _db = null;
    }
  } finally {
    _connecting = false;
  }
  return _db;
}

/** PostgreSQL "upsert on email conflict" — replaces MySQL's ON DUPLICATE KEY UPDATE. */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.email) throw new Error("User email is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.email, email: user.email, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date(), updatedAt: new Date() };
  const textFields = ["name"] as const;

  textFields.forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: users.email, set: updateSet });
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getProgramAccess(userId: number): Promise<ProgramAccess | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(programAccess).where(eq(programAccess.userId, userId)).limit(1);
  return result[0];
}

/** Random printable registration code, e.g. AYDA-7K3P. */
export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let part = "";
  for (let index = 0; index < 8; index += 1) {
    if (index === 4) part += "-";
    part += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return part;
}

export async function createAccessCode(input: { code: string; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(accessCodes).values({ code: input.code, createdByUserId: input.createdByUserId });
}

export async function listAccessCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessCodes).orderBy(desc(accessCodes.createdAt));
}

export async function revokeAccessCode(codeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(accessCodes).set({ revoked: true }).where(eq(accessCodes.id, codeId));
}

export async function consumeAccessCode(code: string) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(accessCodes).where(eq(accessCodes.code, code.trim().toUpperCase())).limit(1);
  const row = rows[0];
  if (!row || row.revoked) return false;
  await db.update(accessCodes).set({ usageCount: sql`${accessCodes.usageCount} + 1` }).where(eq(accessCodes.id, row.id));
  return true;
}

/** PostgreSQL upsert for program access (replaces onDuplicateKeyUpdate). */
export async function setProgramAccess(input: {
  userId: number;
  enabled: boolean;
  grantedByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(programAccess)
    .values(input)
    .onConflictDoUpdate({
      target: programAccess.userId,
      set: {
        enabled: input.enabled,
        grantedByUserId: input.grantedByUserId,
        updatedAt: new Date(),
      },
    });
}

export async function getStudentProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weekProgress).where(eq(weekProgress.userId, userId));
}

/** PostgreSQL upsert for weekly progress. */
export async function saveStudentProgress(input: {
  userId: number;
  weekNumber: number;
  completedTaskIds: string[];
  reflection: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const values = {
    userId: input.userId,
    weekNumber: input.weekNumber,
    completedTaskIds: JSON.stringify(input.completedTaskIds),
    reflection: input.reflection || null,
  };
  await db
    .insert(weekProgress)
    .values(values)
    .onConflictDoUpdate({
      target: [weekProgress.userId, weekProgress.weekNumber],
      set: { ...values, updatedAt: new Date() },
    });
}

export async function listStudentsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      accessEnabled: programAccess.enabled,
      accessUpdatedAt: programAccess.updatedAt,
    })
    .from(users)
    .leftJoin(programAccess, eq(programAccess.userId, users.id))
    .orderBy(desc(users.createdAt));
}

export async function getLearningProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  await db
    .insert(learningProfiles)
    .values({ userId })
    .onConflictDoNothing({ target: learningProfiles.userId });
  const result = await db.select().from(learningProfiles).where(eq(learningProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function awardXp(input: { userId: number; amount: number; source: string; sourceRef: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db
    .select({ id: xpEvents.id })
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, input.userId), eq(xpEvents.source, input.source), eq(xpEvents.sourceRef, input.sourceRef)))
    .limit(1);
  if (existing.length) return { awarded: false, profile: await getLearningProfile(input.userId) };
  await db.insert(xpEvents).values(input);
  await getLearningProfile(input.userId);
  await db.update(learningProfiles).set({ xp: sql`${learningProfiles.xp} + ${input.amount}` }).where(eq(learningProfiles.userId, input.userId));
  return { awarded: true, profile: await getLearningProfile(input.userId) };
}

export async function savePlacementAnswer(input: {
  userId: number;
  attemptKey: string;
  questionId: string;
  difficulty: number;
  selectedIndex: number;
  correct: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(placementAttempts).values(input);
}

export async function getPlacementAttempt(userId: number, attemptKey: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(placementAttempts)
    .where(and(eq(placementAttempts.userId, userId), eq(placementAttempts.attemptKey, attemptKey)))
    .orderBy(placementAttempts.createdAt);
}

export async function completePlacement(input: { userId: number; cefrLevel: string; placementScore: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await getLearningProfile(input.userId);
  await db
    .update(learningProfiles)
    .set({ cefrLevel: input.cefrLevel, placementScore: input.placementScore, placementCompleted: true })
    .where(eq(learningProfiles.userId, input.userId));
  return getLearningProfile(input.userId);
}

/** PostgreSQL upsert for contextual vocabulary results. */
export async function saveContextualVocabularyResult(input: { userId: number; exerciseId: string; correct: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(contextualVocabularyResults)
    .values(input)
    .onConflictDoUpdate({
      target: [contextualVocabularyResults.userId, contextualVocabularyResults.exerciseId],
      set: { correct: input.correct },
    });
}

export async function getContextualVocabularyResults(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contextualVocabularyResults).where(eq(contextualVocabularyResults.userId, userId));
}

export async function getLeaderboard() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: users.id, name: users.name, xp: learningProfiles.xp, cefrLevel: learningProfiles.cefrLevel })
    .from(learningProfiles)
    .innerJoin(users, eq(users.id, learningProfiles.userId))
    .innerJoin(programAccess, eq(programAccess.userId, users.id))
    .where(and(eq(programAccess.enabled, true), gt(learningProfiles.xp, 0)))
    .orderBy(desc(learningProfiles.xp), desc(learningProfiles.updatedAt))
    .limit(20);
}

export async function savePracticeRecord(input: {
  userId: number;
  practiceType: "language-analysis" | "conversation-review";
  focus?: string | null;
  sourceText: string;
  feedback: unknown;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(practiceHistory).values({
    userId: input.userId,
    practiceType: input.practiceType,
    focus: input.focus ?? null,
    sourceText: input.sourceText,
    feedbackJson: JSON.stringify(input.feedback),
  });
}

export async function getPracticeHistory(userId: number, limit = 40) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(practiceHistory)
    .where(eq(practiceHistory.userId, userId))
    .orderBy(desc(practiceHistory.createdAt))
    .limit(Math.min(Math.max(limit, 1), 80));
}

export async function getWeeklyXpEvents(userId: number, since: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, userId), gte(xpEvents.createdAt, since)))
    .orderBy(desc(xpEvents.createdAt));
}

export async function getWeeklyCoachSummary(userId: number, weekStart: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(weeklyCoachSummaries)
    .where(and(eq(weeklyCoachSummaries.userId, userId), eq(weeklyCoachSummaries.weekStart, weekStart)))
    .limit(1);
  return rows[0];
}

/** PostgreSQL upsert for weekly coach summaries. */
export async function saveWeeklyCoachSummary(input: {
  userId: number;
  weekStart: string;
  metrics: unknown;
  summary: unknown;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const values = {
    userId: input.userId,
    weekStart: input.weekStart,
    metricsJson: JSON.stringify(input.metrics),
    summaryJson: JSON.stringify(input.summary),
  };
  await db
    .insert(weeklyCoachSummaries)
    .values(values)
    .onConflictDoUpdate({
      target: [weeklyCoachSummaries.userId, weeklyCoachSummaries.weekStart],
      set: { ...values, createdAt: sql`CURRENT_TIMESTAMP` },
    });
}
