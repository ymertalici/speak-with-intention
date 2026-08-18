import { z } from "zod";
import { invokeLLM } from "./_core/llm";

export const weeklyCoachMetricsSchema = z.object({
  languageAnalyses: z.number().int().min(0),
  conversationReviews: z.number().int().min(0),
  completedTasks: z.number().int().min(0),
  xpEarned: z.number().int().min(0),
});

export const weeklyCoachSummarySchema = z.object({
  headline: z.string().min(1).max(180),
  overview: z.string().min(1).max(750),
  wins: z.array(z.string().min(1).max(260)).min(1).max(3),
  focusAreas: z.array(z.object({ title: z.string().min(1).max(120), reason: z.string().min(1).max(320) })).min(1).max(3),
  nextWeekPlan: z.array(z.string().min(1).max(320)).min(2).max(4),
  themes: z.array(z.object({ category: z.string().min(1).max(120), occurrences: z.number().int().min(0) })).min(0).max(6).optional(),
});

export type WeeklyCoachMetrics = z.infer<typeof weeklyCoachMetricsSchema>;
export type WeeklyCoachSummary = z.infer<typeof weeklyCoachSummarySchema>;

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const text = content
      .filter((part): part is { type?: unknown; text?: unknown } => Boolean(part) && typeof part === "object")
      .filter(part => part.type === "text" && typeof part.text === "string")
      .map(part => part.text as string)
      .join("\n");
    if (text.trim()) return text;
  }
  throw new Error("AI_WEEKLY_COACH_EMPTY");
}

export function parseWeeklyCoachSummary(content: unknown): WeeklyCoachSummary {
  const text = contentToText(content).trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  try {
    return weeklyCoachSummarySchema.parse(JSON.parse(text));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`AI_WEEKLY_COACH_INVALID: ${message}`);
  }
}

export type WeeklyAnalysisTheme = { category: string; occurrences: number; lastExample?: string };

async function requestWeeklyCoachSummary(input: {
  weekStart: string;
  metrics: WeeklyCoachMetrics;
  practiceSignals: Array<{ type: string; focus: string | null; overview: string; strengths: string[]; nextStep: string }>;
  analysisThemes?: Array<{ category: string; occurrences: number; lastExample?: string }>;
  recurringStrengths?: string[];
}) {
  const hasHistory = (input.analysisThemes?.length ?? 0) > 0 || (input.recurringStrengths?.length ?? 0) > 0;
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: "Sen Türkçe konuşan A2-B1 İngilizce öğrencileri için haftalık, destekleyici bir koçsun. Yalnızca verilen gerçek öğrenme verilerine dayan. Veri yoksa bunu açıkça söyle ve küçük, uygulanabilir bir başlangıç planı ver. Sayı veya hata uydurma. Türkçe yaz; örnek İngilizce görevleri gerektiğinde kısa tut.",
      },
      {
        role: "user",
        content: `Hafta başlangıcı: ${input.weekStart}\nÖlçümler: ${JSON.stringify(input.metrics)}\nPratik sinyalleri: ${JSON.stringify(input.practiceSignals)}${hasHistory ? `\nKaydedilen analizlerden çıkan örüntüler (bu haftaki ve önceki analizlerin kök nedenleri ve güçlü yönleri): ${JSON.stringify({ themes: input.analysisThemes ?? [], recurringStrengths: input.recurringStrengths ?? [] })}` : ""}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "weekly_coach_summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            overview: { type: "string" },
            wins: { type: "array", items: { type: "string" } },
            focusAreas: {
              type: "array",
              items: {
                type: "object",
                properties: { title: { type: "string" }, reason: { type: "string" } },
                required: ["title", "reason"],
                additionalProperties: false,
              },
            },
            nextWeekPlan: { type: "array", items: { type: "string" } },
            themes: {
              type: "array",
              items: {
                type: "object",
                properties: { category: { type: "string" }, occurrences: { type: "integer" } },
                required: ["category", "occurrences"],
                additionalProperties: false,
              },
            },
          },
          required: ["headline", "overview", "wins", "focusAreas", "nextWeekPlan"],
          additionalProperties: false,
        },
      },
    },
  });
  return response.choices[0]?.message?.content;
}

export async function generateWeeklyCoachSummary(input: {
  weekStart: string;
  metrics: WeeklyCoachMetrics;
  practiceSignals: Array<{ type: string; focus: string | null; overview: string; strengths: string[]; nextStep: string }>;
  analysisThemes?: WeeklyAnalysisTheme[];
  recurringStrengths?: string[];
}, request = () => requestWeeklyCoachSummary(input)): Promise<WeeklyCoachSummary> {
  let latestError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return parseWeeklyCoachSummary(await request());
    } catch (error) {
      latestError = error;
      if (attempt === 0) console.warn("[WeeklyCoach] Structured response was unusable; retrying once", error instanceof Error ? error.message : "unknown error");
    }
  }
  throw latestError instanceof Error ? latestError : new Error("AI_WEEKLY_COACH_INVALID");
}
