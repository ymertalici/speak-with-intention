import type { drizzle } from "drizzle-orm/node-postgres";

/**
 * Creates the application tables on first connection (idempotent).
 * Column definitions mirror drizzle/schema.ts so Drizzle can query them directly.
 * PostgreSQL dialect: `serial` primary keys, `boolean`, varchar role with a
 * CHECK constraint (Postgres enums are awkward to create conditionally).
 *
 * Statements are executed as plain strings via the driver's own execute
 * method. Drizzle's `sql` tagged template has proven unreliable with
 * multi-line CREATE TABLE statements containing CONSTRAINT clauses in the
 * packaged server runtime, so we pass the raw SQL directly.
 */
export async function ensureTables(db: ReturnType<typeof drizzle>) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      "openId" VARCHAR(128) NOT NULL UNIQUE,
      name TEXT,
      email VARCHAR(320) UNIQUE,
      "passwordHash" VARCHAR(255),
      role VARCHAR(16) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSignedIn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "programAccess" (
      id SERIAL PRIMARY KEY,
      "userId" INT NOT NULL REFERENCES users(id),
      enabled BOOLEAN NOT NULL DEFAULT false,
      "grantedByUserId" INT REFERENCES users(id),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT programAccess_userId_unique UNIQUE ("userId")
    )`,
    `CREATE TABLE IF NOT EXISTS "weekProgress" (
      id SERIAL PRIMARY KEY,
      "userId" INT NOT NULL REFERENCES users(id),
      "weekNumber" INT NOT NULL,
      "completedTaskIds" TEXT NOT NULL,
      reflection TEXT,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT weekProgress_user_week_unique UNIQUE ("userId", "weekNumber")
    )`,
    `CREATE TABLE IF NOT EXISTS "learningProfiles" (
      id SERIAL PRIMARY KEY,
      "userId" INT NOT NULL REFERENCES users(id),
      xp INT NOT NULL DEFAULT 0,
      "cefrLevel" VARCHAR(8),
      "placementScore" INT NOT NULL DEFAULT 0,
      "placementCompleted" BOOLEAN NOT NULL DEFAULT false,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT learningProfiles_userId_unique UNIQUE ("userId")
    )`,
    `CREATE TABLE IF NOT EXISTS "placementAttempts" (
      id SERIAL PRIMARY KEY,
      "userId" INT NOT NULL REFERENCES users(id),
      "attemptKey" VARCHAR(64) NOT NULL,
      "questionId" VARCHAR(48) NOT NULL,
      difficulty INT NOT NULL,
      "selectedIndex" INT NOT NULL,
      correct BOOLEAN NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT placementAttempts_attempt_question_unique UNIQUE ("userId", "attemptKey", "questionId")
    )`,
    `CREATE TABLE IF NOT EXISTS "xpEvents" (
      id SERIAL PRIMARY KEY,
      "userId" INT NOT NULL REFERENCES users(id),
      amount INT NOT NULL,
      source VARCHAR(32) NOT NULL,
      "sourceRef" VARCHAR(96) NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT xpEvents_reward_unique UNIQUE ("userId", source, "sourceRef")
    )`,
    `CREATE TABLE IF NOT EXISTS "contextualVocabularyResults" (
      id SERIAL PRIMARY KEY,
      "userId" INT NOT NULL REFERENCES users(id),
      "exerciseId" VARCHAR(64) NOT NULL,
      correct BOOLEAN NOT NULL,
      "completedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT contextualVocabulary_user_exercise_unique UNIQUE ("userId", "exerciseId")
    )`,
    `CREATE TABLE IF NOT EXISTS "practiceHistory" (
      id SERIAL PRIMARY KEY,
      "userId" INT NOT NULL REFERENCES users(id),
      "practiceType" VARCHAR(32) NOT NULL,
      focus VARCHAR(40),
      "sourceText" TEXT NOT NULL,
      "feedbackJson" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT practiceHistory_pkey PRIMARY KEY (id)
    )`,
    `CREATE TABLE IF NOT EXISTS "accessCodes" (
      id SERIAL PRIMARY KEY,
      code VARCHAR(32) NOT NULL,
      "createdByUserId" INT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revoked BOOLEAN NOT NULL DEFAULT false,
      "usageCount" INT NOT NULL DEFAULT 0,
      CONSTRAINT accessCodes_code_unique UNIQUE (code)
    )`,
    `CREATE TABLE IF NOT EXISTS "weeklyCoachSummaries" (
      id SERIAL PRIMARY KEY,
      "userId" INT NOT NULL REFERENCES users(id),
      "weekStart" VARCHAR(16) NOT NULL,
      "metricsJson" TEXT NOT NULL,
      "summaryJson" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT weeklyCoachSummaries_user_week_unique UNIQUE ("userId", "weekStart")
    )`,
    `CREATE INDEX IF NOT EXISTS weekProgress_user_idx ON "weekProgress" ("userId")`,
    `CREATE INDEX IF NOT EXISTS placementAttempts_user_idx ON "placementAttempts" ("userId")`,
    `CREATE INDEX IF NOT EXISTS xpEvents_user_created_idx ON "xpEvents" ("userId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS contextualVocabulary_user_idx ON "contextualVocabularyResults" ("userId")`,
    `CREATE INDEX IF NOT EXISTS practiceHistory_user_created_idx ON "practiceHistory" ("userId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS practiceHistory_user_type_created_idx ON "practiceHistory" ("userId", "practiceType", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS accessCodes_revoked_idx ON "accessCodes" (revoked)`,
  ];
  for (const statement of statements) {
    try {
      await db.execute(statement as never);
    } catch (error) {
      console.warn("[Database] Table provisioning step failed:", error);
    }
  }
}
