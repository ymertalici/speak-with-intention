import { z } from "zod";
import { invokeLLM } from "./_core/llm";

const focusSchema = z.enum(["everyday", "fluency", "grammar", "vocabulary"]);

export const conversationChatInput = z
  .object({
    focus: focusSchema,
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1, "Boş bir mesaj gönderilemez.").max(1200),
        })
      )
      .min(1, "Sohbete başlamak için bir mesaj yazın.")
      .max(20, "Bu çalışma için yeni bir sohbet başlatın."),
  })
  .superRefine((value, ctx) => {
    if (value.messages.at(-1)?.role !== "user") {
      ctx.addIssue({ code: "custom", message: "AI yalnızca öğrencinin son mesajına yanıt verebilir." });
    }
  });

export const conversationChatReplySchema = z.object({
  reply: z.string().trim().min(1).max(900),
});

export type ConversationChatInput = z.infer<typeof conversationChatInput>;

function focusLabel(focus: ConversationChatInput["focus"]) {
  return {
    everyday: "daily life and natural communication",
    fluency: "fluency and connecting ideas",
    grammar: "clear everyday grammar through natural conversation",
    vocabulary: "using useful everyday vocabulary actively",
  }[focus];
}

export async function continueConversation(input: ConversationChatInput) {
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are a warm English conversation partner for an A2-B1 Turkish learner. Keep the conversation focused on ${focusLabel(input.focus)}. Reply in natural, accessible English only. Ask at most one natural follow-up question at a time. Never correct, explain, grade, translate, or interrupt the learner during the conversation, even when they make mistakes. Keep each reply to one to three short sentences. The learner will explicitly finish the conversation in the interface and receive feedback only after that.`,
      },
      ...input.messages,
    ],
  });

  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("AI sohbet yanıtı beklenen biçimde dönmedi.");
  return conversationChatReplySchema.parse({ reply: content.trim() });
}
