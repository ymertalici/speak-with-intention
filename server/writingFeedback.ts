import { z } from "zod";
import { invokeLLM } from "./_core/llm";

export const writingFeedbackInput = z.object({
  text: z.string().trim().min(12, "Analiz için en az kısa bir İngilizce cümle yaz.").max(2800),
  mode: z.enum(["writing", "speechTranscript"]),
});

const diagnosisSchema = z.object({
  original: z.string().min(1).max(220),
  correction: z.string().min(1).max(220),
  category: z.enum(["grammar", "wordChoice", "wordOrder", "fluency", "pronunciationCue"]),
  rootCause: z.string().min(1).max(360),
  detailedExplanation: z.string().min(1).max(1000),
  shortRule: z.string().min(1).max(280),
  practicalSteps: z.array(z.string().min(1).max(280)).min(1).max(4),
  retrySentence: z.string().min(1).max(360),
});

export const writingFeedbackSchema = z.object({
  overview: z.string().min(1).max(560),
  diagnoses: z.array(diagnosisSchema).max(6),
  strengths: z.array(z.string().min(1).max(220)).min(1).max(3),
  nextDrill: z.string().min(1).max(420),
});

export type WritingFeedback = z.infer<typeof writingFeedbackSchema>;

const responseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "language_feedback",
    strict: true,
    schema: {
      type: "object",
      properties: {
        overview: { type: "string" },
        diagnoses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              original: { type: "string" },
              correction: { type: "string" },
              category: { type: "string", enum: ["grammar", "wordChoice", "wordOrder", "fluency", "pronunciationCue"] },
              rootCause: { type: "string" },
              detailedExplanation: { type: "string" },
              shortRule: { type: "string" },
              practicalSteps: { type: "array", items: { type: "string" } },
              retrySentence: { type: "string" },
            },
            required: ["original", "correction", "category", "rootCause", "detailedExplanation", "shortRule", "practicalSteps", "retrySentence"],
            additionalProperties: false,
          },
        },
        strengths: { type: "array", items: { type: "string" } },
        nextDrill: { type: "string" },
      },
      required: ["overview", "diagnoses", "strengths", "nextDrill"],
      additionalProperties: false,
    },
  },
};

function cleanJson(content: string) {
  return content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("\n");
  }
  if (content && typeof content === "object" && "text" in content && typeof content.text === "string") return content.text;
  return "";
}

export function parseWritingFeedback(content: unknown): WritingFeedback {
  const text = extractTextContent(content);
  if (!text.trim()) {
    throw new Error("AI_STRUCTURED_RESPONSE_EMPTY");
  }
  try {
    return writingFeedbackSchema.parse(JSON.parse(cleanJson(text)));
  } catch (error) {
    throw new Error(`AI_STRUCTURED_RESPONSE_INVALID: ${error instanceof Error ? error.message : "unknown"}`);
  }
}

function systemPrompt(kind: string, retry: boolean) {
  const retryInstruction = retry
    ? "Önceki yanıt okunamadı. Bu kez hiçbir açıklama, Markdown veya kod bloğu eklemeden yalnızca şemaya uyan JSON üret."
    : "JSON şemasına kesinlikle uy.";
  return `Sen İngilizce öğrenenler için sakin, teşvik edici ve ayrıntılı bir dil koçusun. Sana bir ${kind} verilecek. Gerçek zamanlı konuşmada öğrenciyi bölme; yalnızca metin veya konuşma tamamlandıktan sonra geri bildirim ver. Türkçe açıklama yap, ama İngilizce düzeltmeyi olduğu gibi göster.

Her seçilmiş hatada öğrencinin yalnızca neyi yanlış yaptığını değil, neden o hataya düştüğünü uzun ve anlaşılır biçimde açıkla. original alanında öğrencinin ifadesini, correction alanında doğal doğru biçimi ver. rootCause alanında dilbilgisi kavramını adlandır. detailedExplanation alanında kuralın bu örneğe nasıl uygulandığını, doğru ve yanlış seçeneğin anlam farkını, mümkünse yaygın bir öğrenci yanılgısını anlat. practicalSteps alanında öğrencinin hemen uygulayabileceği 2–4 küçük düzeltme adımı ver. retrySentence alanında aynı yapıyı tekrar ettirecek kısa bir İngilizce görev yaz.

Konuşma dökümü için yalnızca metinden makul çıkarılabilen telaffuz ipuçları ver; işitmediğin sesler hakkında kesin yorum yapma. Hata yoksa bunu açıkça söyle, güçlü yönlere odaklan ve yine de ilerletici bir tekrar ver. ${retryInstruction}`;
}

export type FeedbackRequester = (input: z.infer<typeof writingFeedbackInput>, retry?: boolean) => Promise<WritingFeedback>;

async function requestFeedback(input: z.infer<typeof writingFeedbackInput>, retry = false): Promise<WritingFeedback> {
  const kind = input.mode === "speechTranscript" ? "konuşma dökümü" : "öğrenci metni";
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: systemPrompt(kind, retry) },
      { role: "user", content: input.text },
    ],
    // Some model gateways occasionally degrade strict JSON Schema output. The retry below
    // intentionally falls back to an explicitly requested JSON-only response instead.
    ...(retry ? {} : { response_format: responseFormat }),
  });
  return parseWritingFeedback(response.choices[0]?.message?.content);
}

export async function analyseLanguage(input: z.infer<typeof writingFeedbackInput>, request: FeedbackRequester = requestFeedback) {
  try {
    return await request(input);
  } catch (firstError) {
    console.warn("[LanguageFeedback] Structured response was unusable; retrying once", firstError instanceof Error ? firstError.message : "unknown");
    try {
      return await request(input, true);
    } catch (retryError) {
      console.error("[LanguageFeedback] Retry failed", retryError instanceof Error ? retryError.message : "unknown");
      throw new Error("AI_LANGUAGE_FEEDBACK_UNAVAILABLE");
    }
  }
}
