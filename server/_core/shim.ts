/** Vercel shim: replaces the Manus-bound `_core/systemRouter` with a self-contained
 * version. All tRPC primitives are re-exported from `./trpc`. */
import { z } from "zod";
import { publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),
  /** Owner notifications are platform-bound on Manus; this is a no-op on Vercel. */
  notifyOwner: publicProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(({ input }) => {
      console.log("[OwnerNotification]", input.title, input.content);
      return { success: true } as const;
    }),
});
