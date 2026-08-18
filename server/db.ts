import { and, desc, eq, gt, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-http";
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
 * PostgreSQL database layer.
 *
 * Uses Neon's HTTP serverless driver by default (ideal for Vercel serverless
 * functions; no connection pooling needed). When a direct PostgreSQL URL is
 * provided it falls back to the node-postgres pool.
 */
let _db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleServerless> | null = null;

function buildClient() {
  const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
  if (!databaseUrl) return null;
  // Neon / serverless-compatible URL (http or pooler with options) → HTTP driver
  if (databaseUrl.startsWith("http://") || databaseUrl.startsWith("https://")) {
    return drizzleServerless(neon(databaseUrl));
  }
  // Direct postgresql:// URL → node-postgres pool
  return drizzle(databaseUrl, { casing: "snake_case" });
}

/**
 * Sanity-check the DATABASE_URL host. Vercel's serverless runtime cannot
 * resolve made-up or mistyped hosts (ENOTFOUND); catch it early with a
 * clear console message instead of failing cryptically on the first query.
 */
function validateDatabaseUrl(databaseUrl: string): boolean {
  if (databaseUrl.startsWith("http://") || databaseUrl.startsWith("https://")) return true;
  try {
    const hostMatch = databaseUrl.match(/@([^/:]+)(:\d+)?\//);
    const host = hostMatch ? hostMatch[1] : null;
    if (!host || !host.includes(".")) {
      console.error("[Database] DATABASE_URL geçersiz: host kısmı bulunamadı.", databaseUrl.replace(/:[^@/]+@/, ":****@"));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    const databaseUrl = process.env.DATABASE_URL.trim();
    if (!validateDatabaseUrl(databaseUrl)) {
      _db = null;
      return _db;
    }
    try {
      const db = buildClient();
      if (!db) return null;
      // Lightweight connectivity check
      await db.execute(sql`SELECT 1`);
      _db = db;
      void ensureTables(_db);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Distinguish DNS failures (ENOTFOUND) from auth/schema problems.
      if (/ENOTFOUND|getaddrinfo/i.test(message)) {
        console.error(
          "[Database] DNS hatası: DATABASE_URL'deki sunucu adresi çözümlenemiyor.",
          "Lütfen dizedeki db.xxx.supabase.co (veya neon.tech) kısmının Supabase/Neon panelindeki gerçek adresle birebir aynı olduğunu kontrol edin.",
        );
      } else if (/password authentication failed/i.test(message)) {
        console.error(
          "[Database] Şifre hatası: DATABASE_URL'deki şifre veritabanı şifresiyle eşleşmiyor.",
          "Supabase → Settings → Database → Reset database password ile yeni şifre alıp dizeyi güncelleyin.",
        );
      } else {
        console.warn("[Database] Failed to connect:", error);
      }
      _db = null;
    }
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
