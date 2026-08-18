import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  awardXp,
  completePlacement,
  getContextualVocabularyResults,
  getLeaderboard,
  getLearningProfile,
  getProgramAccess,
  getPracticeHistory,
  getPlacementAttempt,
  getStudentProgress,
  getWeeklyCoachSummary,
  getWeeklyXpEvents,
  listStudentsForAdmin,
  saveContextualVocabularyResult,
  savePlacementAnswer,
  savePracticeRecord,
  saveStudentProgress,
  saveWeeklyCoachSummary,
  setProgramAccess,
  generateAccessCode,
  createAccessCode,
  listAccessCodes,
  revokeAccessCode,
} from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/shim";
import { canManageProgram, hasProgramAccess } from "./programAccess";
import { conversationReviewInput, reviewConversation } from "./conversationReview";
import { continueConversation, conversationChatInput } from "./conversationChat";
import { chooseNextQuestion, deriveCefr, getQuestion, nextDifficulty, placementQuestions, publicQuestion, roadmapFor, safeLeaderboardName, xpLevel } from "./adaptiveLearning";
import { analyseLanguage, writingFeedbackInput } from "./writingFeedback";
import { generateWeeklyCoachSummary, weeklyCoachMetricsSchema, weeklyCoachSummarySchema, type WeeklyAnalysisTheme } from "./weeklyCoach";
import { nanoid } from "nanoid";

const weekInput = z.number().int().min(1).max(4);

function currentWeekStart() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start;
}

function formatPracticeRecord(record: { id: number; practiceType: string; focus: string | null; sourceText: string; feedbackJson: string; createdAt: Date }) {
  const feedback = JSON.parse(record.feedbackJson) as {
    overview?: string;
    overall?: string;
    strengths?: string[];
    nextDrill?: string;
    nextConversationPrompt?: string;
    diagnoses?: Array<{ original: string; correction: string; detailedExplanation: string; retrySentence: string }>;
    priorityCorrections?: Array<{ said: string; improved: string; why: string; practice: string }>;
  };
  const language = record.practiceType === "language-analysis";
  return {
    id: record.id,
    type: language ? "Yazı / döküm analizi" : "Konuşma incelemesi",
    focus: record.focus,
    sourceText: record.sourceText,
    overview: language ? feedback.overview ?? "Analiz özeti kaydedildi." : feedback.overall ?? "Konuşma özeti kaydedildi.",
    strengths: feedback.strengths ?? [],
    corrections: language
      ? (feedback.diagnoses ?? []).map(item => ({ before: item.original, after: item.correction, reason: item.detailedExplanation, practice: item.retrySentence }))
      : (feedback.priorityCorrections ?? []).map(item => ({ before: item.said, after: item.improved, reason: item.why, practice: item.practice })),
    nextStep: language ? feedback.nextDrill ?? "Kısa bir tekrar cümlesi kur." : feedback.nextConversationPrompt ?? "Yeni bir kısa konuşma başlat.",
    createdAt: record.createdAt,
  };
}

function parseFeedback(raw: unknown): {
  overview?: string;
  overall?: string;
  strengths?: string[];
  nextDrill?: string;
  nextConversationPrompt?: string;
  diagnoses?: Array<{ category?: string; mistake?: string; original?: string; correction?: string; detailedExplanation?: string; retrySentence?: string }>;
  priorityCorrections?: Array<{ said?: string; improved?: string; why?: string; practice?: string }>;
} {
  if (!raw || typeof raw !== "object") return {};
  return raw as { overview?: string; overall?: string; strengths?: string[]; nextDrill?: string; nextConversationPrompt?: string; diagnoses?: Array<{ category?: string; mistake?: string; original?: string; correction?: string; detailedExplanation?: string; retrySentence?: string }>; priorityCorrections?: Array<{ said?: string; improved?: string; why?: string; practice?: string }> };
}

function extractDiagnoses(feedback: ReturnType<typeof parseFeedback>): Array<{ category?: string; mistake?: string }> {
  const results: Array<{ category?: string; mistake?: string }> = [];
  for (const diagnosis of feedback.diagnoses ?? []) {
    results.push({ category: diagnosis.category ?? diagnosis.original, mistake: diagnosis.original });
  }
  for (const correction of feedback.priorityCorrections ?? []) {
    results.push({ category: correction.why, mistake: correction.said });
  }
  return results;
}

function formatWeeklySummary(record?: { weekStart: string; metricsJson: string; summaryJson: string; createdAt: Date }) {
  if (!record) return null;
  const summary = weeklyCoachSummarySchema.safeParse(JSON.parse(record.summaryJson));
  const metrics = weeklyCoachMetricsSchema.safeParse(JSON.parse(record.metricsJson));
  if (!summary.success || !metrics.success) return null;
  return { weekStart: record.weekStart, generatedAt: record.createdAt, report: summary.data, metrics: metrics.data };
}

async function requireProgramAccess(user: { id: number; role: "user" | "admin" }) {
  const access = await getProgramAccess(user.id);
  if (!hasProgramAccess(user.role, access?.enabled)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Program erişiminiz henüz aktif değil." });
  }
}

function requireAdmin(user: { role: "user" | "admin" }) {
  if (!canManageProgram(user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu alan yalnızca yöneticilere açıktır." });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      return { success: true } as const;
    }),
  }),
  program: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const access = await getProgramAccess(ctx.user.id);
      const allowed = hasProgramAccess(ctx.user.role, access?.enabled);
      const progress = allowed ? await getStudentProgress(ctx.user.id) : [];
      const profile = allowed ? await getLearningProfile(ctx.user.id) : undefined;
      return { hasAccess: allowed, progress, profile };
    }),
    saveWeekProgress: protectedProcedure
      .input(
        z.object({
          weekNumber: weekInput,
          completedTaskIds: z.array(z.string().min(1).max(80)).max(10),
          reflection: z.string().max(1200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireProgramAccess(ctx.user);
        const previous = await getStudentProgress(ctx.user.id);
        const savedWeek = previous.find(item => item.weekNumber === input.weekNumber);
        const previouslyCompleted = new Set<string>(savedWeek ? JSON.parse(savedWeek.completedTaskIds) : []);
        await saveStudentProgress({ userId: ctx.user.id, ...input });
        const addedTaskIds = input.completedTaskIds.filter(taskId => !previouslyCompleted.has(taskId));
        await Promise.all(
          addedTaskIds.map(taskId =>
            awardXp({ userId: ctx.user.id, amount: 8, source: "week-task", sourceRef: `${input.weekNumber}:${taskId}` })
          )
        );
        return { success: true } as const;
      }),
    conversationChat: protectedProcedure
      .input(conversationChatInput)
      .mutation(async ({ ctx, input }) => {
        await requireProgramAccess(ctx.user);
        try {
          return await continueConversation(input);
        } catch (error) {
          console.error("[ConversationChat] Failed to continue chat", error instanceof Error ? error.message : "unknown error");
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI şu anda yanıt veremedi. Aynı mesajı birkaç saniye sonra yeniden gönder." });
        }
      }),
    reviewConversation: protectedProcedure
      .input(conversationReviewInput)
      .mutation(async ({ ctx, input }) => {
        await requireProgramAccess(ctx.user);
        try {
          const feedback = await reviewConversation(input);
          await savePracticeRecord({
            userId: ctx.user.id,
            practiceType: "conversation-review",
            focus: input.focus,
            sourceText: input.transcript,
            feedback,
          });
          await awardXp({
            userId: ctx.user.id,
            amount: 10,
            source: "conversation-review",
            sourceRef: new Date().toISOString().slice(0, 10),
          });
          return feedback;
        } catch (error) {
          console.error("[ConversationReview] Failed to create feedback", error instanceof Error ? error.message : "unknown error");
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Konuşma analizi şu an tamamlanamadı. Lütfen tekrar dene." });
        }
      }),
  }),
  learning: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      await requireProgramAccess(ctx.user);
      const profile = await getLearningProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Öğrenme profili oluşturulamadı." });
      return { ...profile, level: xpLevel(profile.xp), roadmap: profile.cefrLevel ? roadmapFor(profile.cefrLevel) : null };
    }),
    startPlacement: protectedProcedure.mutation(async ({ ctx }) => {
      await requireProgramAccess(ctx.user);
      const firstQuestion = chooseNextQuestion([], 1);
      if (!firstQuestion) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Seviye soruları hazır değil." });
      return { attemptKey: nanoid(14), question: publicQuestion(firstQuestion), totalQuestions: 12 };
    }),
    answerPlacement: protectedProcedure
      .input(z.object({ attemptKey: z.string().min(8).max(64), questionId: z.string().min(3).max(48), selectedIndex: z.number().int().min(0).max(3) }))
      .mutation(async ({ ctx, input }) => {
        await requireProgramAccess(ctx.user);
        const question = getQuestion(input.questionId);
        if (!question || input.selectedIndex >= question.options.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Bu seviye sorusu geçersiz." });
        }
        const before = await getPlacementAttempt(ctx.user.id, input.attemptKey);
        if (before.some(item => item.questionId === question.id)) {
          throw new TRPCError({ code: "CONFLICT", message: "Bu soru zaten cevaplandı." });
        }
        const correct = question.correctIndex === input.selectedIndex;
        await savePlacementAnswer({ userId: ctx.user.id, attemptKey: input.attemptKey, questionId: question.id, difficulty: question.difficulty, selectedIndex: input.selectedIndex, correct });
        if (correct) await awardXp({ userId: ctx.user.id, amount: 4, source: "placement-answer", sourceRef: question.id });
        const answers = [...before, { questionId: question.id, difficulty: question.difficulty, correct }];
        if (answers.length >= 12) {
          const cefrLevel = deriveCefr(answers);
          const profile = await completePlacement({ userId: ctx.user.id, cefrLevel, placementScore: answers.filter(answer => answer.correct).length });
          await awardXp({ userId: ctx.user.id, amount: 30, source: "placement-complete", sourceRef: input.attemptKey });
          return { complete: true as const, result: { cefrLevel, score: answers.filter(answer => answer.correct).length, roadmap: roadmapFor(cefrLevel), xp: profile?.xp ?? 0 } };
        }
        const nextQuestion = chooseNextQuestion(answers.map(answer => answer.questionId), nextDifficulty(question.difficulty, correct));
        if (!nextQuestion) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Yeni soru seçilemedi." });
        return { complete: false as const, progress: answers.length, correct, nextQuestion: publicQuestion(nextQuestion) };
      }),
    analyseLanguage: protectedProcedure
      .input(writingFeedbackInput)
      .mutation(async ({ ctx, input }) => {
        await requireProgramAccess(ctx.user);
        try {
          const feedback = await analyseLanguage(input);
          await savePracticeRecord({
            userId: ctx.user.id,
            practiceType: "language-analysis",
            focus: input.mode,
            sourceText: input.text,
            feedback,
          });
          await awardXp({
            userId: ctx.user.id,
            amount: 12,
            source: "language-feedback",
            sourceRef: new Date().toISOString().slice(0, 10),
          });
          return feedback;
        } catch (error) {
          console.error("[LanguageFeedback] Failed to create feedback", error instanceof Error ? error.message : "unknown error");
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Dil analizi şu an tamamlanamadı. Metni biraz kısaltıp yeniden dene; sorun sürerse birkaç dakika sonra tekrar dene." });
        }
      }),
    practiceHistory: protectedProcedure.query(async ({ ctx }) => {
      await requireProgramAccess(ctx.user);
      const records = await getPracticeHistory(ctx.user.id);
      return records.map(formatPracticeRecord);
    }),
    weeklyCoachSummary: protectedProcedure.query(async ({ ctx }) => {
      await requireProgramAccess(ctx.user);
      const start = currentWeekStart();
      const weekStart = start.toISOString().slice(0, 10);
      return { weekStart, summary: formatWeeklySummary(await getWeeklyCoachSummary(ctx.user.id, weekStart)) };
    }),
    generateWeeklyCoachSummary: protectedProcedure.mutation(async ({ ctx }) => {
      await requireProgramAccess(ctx.user);
      const start = currentWeekStart();
      const weekStart = start.toISOString().slice(0, 10);
      const [records, xpEvents, progress] = await Promise.all([
        getPracticeHistory(ctx.user.id),
        getWeeklyXpEvents(ctx.user.id, start),
        getStudentProgress(ctx.user.id),
      ]);
      const weeklyRecords = records.filter(record => record.createdAt >= start);
      const metrics = {
        languageAnalyses: weeklyRecords.filter(record => record.practiceType === "language-analysis").length,
        conversationReviews: weeklyRecords.filter(record => record.practiceType === "conversation-review").length,
        completedTasks: progress.reduce((total, item) => total + (JSON.parse(item.completedTaskIds) as string[]).length, 0),
        xpEarned: xpEvents.reduce((total, event) => total + event.amount, 0),
      };
      const validatedMetrics = weeklyCoachMetricsSchema.parse(metrics);
      const practiceSignals = weeklyRecords.slice(0, 6).map(record => {
        const formatted = formatPracticeRecord(record);
        return { type: formatted.type, focus: formatted.focus, overview: formatted.overview, strengths: formatted.strengths, nextStep: formatted.nextStep };
      });
      const analysisThemes: WeeklyAnalysisTheme[] = [];
      const categoryTotals = new Map<string, { count: number; lastExample?: string }>();
      for (const record of records) {
        const feedback = parseFeedback(record.feedbackJson);
        const diagnoses = extractDiagnoses(feedback);
        for (const diagnosis of diagnoses) {
          const category = typeof diagnosis.category === "string" && diagnosis.category.trim() ? diagnosis.category.trim() : "Genel hata";
          const existing = categoryTotals.get(category) ?? { count: 0 };
          existing.count += 1;
          if (diagnosis.mistake) existing.lastExample = diagnosis.mistake;
          categoryTotals.set(category, existing);
        }
      }
      for (const entry of Array.from(categoryTotals.entries())) analysisThemes.push({ category: entry[0], occurrences: entry[1].count, lastExample: entry[1].lastExample });
      analysisThemes.sort((left, right) => right.occurrences - left.occurrences);
      const recurringStrengths = Array.from(new Set(practiceSignals.flatMap(signal => signal.strengths))).slice(0, 4);
      try {
        const report = await generateWeeklyCoachSummary({ weekStart, metrics: validatedMetrics, practiceSignals, analysisThemes, recurringStrengths });
        await saveWeeklyCoachSummary({ userId: ctx.user.id, weekStart, metrics: validatedMetrics, summary: report });
        return { weekStart, summary: { weekStart, generatedAt: new Date(), report, metrics: validatedMetrics } };
      } catch (error) {
        console.error("[WeeklyCoach] Failed to create summary", error instanceof Error ? error.message : "unknown error");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Haftalık koçluk notu şu an oluşturulamadı. Lütfen biraz sonra tekrar dene." });
      }
    }),
    contextualVocabulary: protectedProcedure.query(async ({ ctx }) => {
      await requireProgramAccess(ctx.user);
      return getContextualVocabularyResults(ctx.user.id);
    }),
    completeContextualVocabulary: protectedProcedure
      .input(z.object({ exerciseId: z.string().min(3).max(64), correct: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await requireProgramAccess(ctx.user);
        await saveContextualVocabularyResult({ userId: ctx.user.id, ...input });
        if (input.correct) await awardXp({ userId: ctx.user.id, amount: 6, source: "contextual-vocabulary", sourceRef: input.exerciseId });
        return { success: true } as const;
      }),
    leaderboard: protectedProcedure.query(async ({ ctx }) => {
      await requireProgramAccess(ctx.user);
      const rows = await getLeaderboard();
      return rows.map((row, index) => ({ rank: index + 1, name: safeLeaderboardName(row.name), xp: row.xp, cefrLevel: row.cefrLevel }));
    }),
    questionPool: protectedProcedure.query(async ({ ctx }) => {
      await requireProgramAccess(ctx.user);
      return placementQuestions.length;
    }),
  }),
  admin: router({
    students: protectedProcedure.query(async ({ ctx }) => {
      requireAdmin(ctx.user);
      return listStudentsForAdmin();
    }),
    setAccess: protectedProcedure
      .input(z.object({ userId: z.number().int().positive(), enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user);
        if (input.userId === ctx.user.id && !input.enabled) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Yönetici erişiminizi kaldıramazsınız." });
        }
        await setProgramAccess({ ...input, grantedByUserId: ctx.user.id });
        return { success: true } as const;
      }),
    createAccessCode: protectedProcedure.mutation(async ({ ctx }) => {
      requireAdmin(ctx.user);
      const code = generateAccessCode();
      await createAccessCode({ code, createdByUserId: ctx.user.id });
      return { code } as const;
    }),
    accessCodes: protectedProcedure.query(async ({ ctx }) => {
      requireAdmin(ctx.user);
      return listAccessCodes();
    }),
    revokeAccessCode: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user);
      await revokeAccessCode(input.id);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
