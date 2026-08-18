import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * PostgreSQL schema (was MySQL). Primary keys use `serial` (autoincrement).
 * The `role` enum is a varchar with a CHECK constraint for compatibility
 * across driver versions; UI and server treat it as "user" | "admin".
 */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: varchar("role", { length: 16 })
    .default("user")
    .notNull()
    .$type<"user" | "admin">(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Program access is deliberately separate from authentication: signing in does not grant course access. */
export const programAccess = pgTable(
  "programAccess",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id),
    enabled: boolean("enabled").default(false).notNull(),
    grantedByUserId: integer("grantedByUserId").references(() => users.id),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("programAccess_userId_unique").on(table.userId)]
);

/** One compact, private progress record per student and programme week. */
export const weekProgress = pgTable(
  "weekProgress",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id),
    weekNumber: integer("weekNumber").notNull(),
    completedTaskIds: text("completedTaskIds").notNull(),
    reflection: text("reflection"),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("weekProgress_user_week_unique").on(table.userId, table.weekNumber),
    index("weekProgress_user_idx").on(table.userId),
  ]
);

/** One private profile per learner; it powers level, XP and personalised next steps. */
export const learningProfiles = pgTable(
  "learningProfiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id),
    xp: integer("xp").default(0).notNull(),
    cefrLevel: varchar("cefrLevel", { length: 8 }),
    placementScore: integer("placementScore").default(0).notNull(),
    placementCompleted: boolean("placementCompleted").default(false).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("learningProfiles_userId_unique").on(table.userId)]
);

/** Individual answers are retained only for a student's own diagnostic history. */
export const placementAttempts = pgTable(
  "placementAttempts",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id),
    attemptKey: varchar("attemptKey", { length: 64 }).notNull(),
    questionId: varchar("questionId", { length: 48 }).notNull(),
    difficulty: integer("difficulty").notNull(),
    selectedIndex: integer("selectedIndex").notNull(),
    correct: boolean("correct").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("placementAttempts_user_idx").on(table.userId),
    uniqueIndex("placementAttempts_attempt_question_unique").on(table.userId, table.attemptKey, table.questionId),
  ]
);

/** XP is an append-only reward ledger; duplicate activity cannot be rewarded twice. */
export const xpEvents = pgTable(
  "xpEvents",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(),
    source: varchar("source", { length: 32 }).notNull(),
    sourceRef: varchar("sourceRef", { length: 96 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("xpEvents_user_created_idx").on(table.userId, table.createdAt),
    uniqueIndex("xpEvents_reward_unique").on(table.userId, table.source, table.sourceRef),
  ]
);

/** Completed contextual vocabulary exercises are private to the individual learner. */
export const contextualVocabularyResults = pgTable(
  "contextualVocabularyResults",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id),
    exerciseId: varchar("exerciseId", { length: 64 }).notNull(),
    correct: boolean("correct").notNull(),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("contextualVocabulary_user_exercise_unique").on(table.userId, table.exerciseId),
    index("contextualVocabulary_user_idx").on(table.userId),
  ]
);

/** Private, append-only archive of completed AI analyses for each learner. */
export const practiceHistory = pgTable(
  "practiceHistory",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id),
    practiceType: varchar("practiceType", { length: 32 }).notNull(),
    focus: varchar("focus", { length: 40 }),
    sourceText: text("sourceText").notNull(),
    feedbackJson: text("feedbackJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("practiceHistory_user_created_idx").on(table.userId, table.createdAt),
    index("practiceHistory_user_type_created_idx").on(table.userId, table.practiceType, table.createdAt),
  ]
);

/** Distributable registration codes created by the admin so students can sign up. */
export const accessCodes = pgTable("accessCodes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  createdByUserId: integer("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  usageCount: integer("usageCount").default(0).notNull(),
},
  table => [
    uniqueIndex("accessCodes_code_unique").on(table.code),
    index("accessCodes_revoked_idx").on(table.revoked),
  ]);

/** One replaceable AI reflection per learner and ISO week; underlying practice remains in the archive. */
export const weeklyCoachSummaries = pgTable(
  "weeklyCoachSummaries",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id),
    weekStart: varchar("weekStart", { length: 16 }).notNull(),
    metricsJson: text("metricsJson").notNull(),
    summaryJson: text("summaryJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("weeklyCoachSummaries_user_week_unique").on(table.userId, table.weekStart),
    index("weeklyCoachSummaries_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ProgramAccess = typeof programAccess.$inferSelect;
export type WeekProgress = typeof weekProgress.$inferSelect;
export type LearningProfile = typeof learningProfiles.$inferSelect;
