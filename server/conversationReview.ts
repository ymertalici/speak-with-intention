import { z } from "zod";
import { invokeLLM } from "./_core/llm";

export const conversationReviewInput = z.object({
  transcript: z.string().trim().min(80, "Analiz için en az birkaç cümlelik konuşma ekleyin.").max(10000),
  focus: z.enum(["everyday", "fluency", "grammar", "vocabulary"]),
});

export const conversationFeedbackSchema = z.object({
  overall: z.string().min(1).max(700),
  strengths: z.array(z.string().min(1).max(220)).min(1).max(3),
  priorityCorrections: z.array(z.object({
    said: z.string().min(1).max(240),
    improved: z.string().min(1).max(240),
    why: z.string().min(1).max(320),
    practice: z.string().min(1).max(240),
  })).max(5),
  usefulPhrases: z.array(z.object({
    phrase: z.string().min(1).max(160),
    reason: z.string().min(1).max(220),
  })).max(4),
  nextConversationPrompt: z.string().min(1).max(400),
});

export type ConversationFeedback = z.infer<typeof conversationFeedbackSchema>;
export type ConversationReviewInput = z.infer<typeof conversationReviewInput>;

export function parseConversationFeedback(content: string): ConversationFeedback {
  return conversationFeedbackSchema.parse(JSON.parse(content));
}

function focusLabel(focus: ConversationReviewInput["focus"]) {
  return {
    everyday: "günlük ve doğal iletişim",
    fluency: "akıcılık ve fikirleri birbirine bağlama",
    grammar: "anlaşılabilirliği etkileyen dilbilgisi",
    vocabulary: "aktif kelime kullanımı",
  }[focus];
}

export async function reviewConversation(input: ConversationReviewInput): Promise<ConversationFeedback> {
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are a warm English speaking coach for an A2-B1 Turkish learner. The conversation has already finished. Never simulate an interruption and never say what you would have corrected mid-conversation. Give feedback only after the full transcript. Focus on ${focusLabel(input.focus)}. If the transcript labels turns as "Learner" and "AI partner", evaluate only the Learner's English; never correct the AI partner. Be encouraging, concise, and specific. Do not evaluate pronunciation from text. Quote only short fragments when needed. Output Turkish explanations and English corrections.`,
      },
      {
        role: "user",
        content: `Analyse this completed English conversation transcript:\n\n${input.transcript}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "conversation_feedback",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overall: { type: "string" },
            strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
            priorityCorrections: {
              type: "array",
              maxItems: 5,
              items: {
                type: "object",
                properties: {
                  said: { type: "string" },
                  improved: { type: "string" },
                  why: { type: "string" },
                  practice: { type: "string" },
                },
                required: ["said", "improved", "why", "practice"],
                additionalProperties: false,
              },
            },
            usefulPhrases: {
              type: "array",
              maxItems: 4,
              items: {
                type: "object",
                properties: { phrase: { type: "string" }, reason: { type: "string" } },
                required: ["phrase", "reason"],
                additionalProperties: false,
              },
            },
            nextConversationPrompt: { type: "string" },
          },
          required: ["overall", "strengths", "priorityCorrections", "usefulPhrases", "nextConversationPrompt"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("Konuşma analizi beklenen biçimde dönmedi.");
  return parseConversationFeedback(content);
}
