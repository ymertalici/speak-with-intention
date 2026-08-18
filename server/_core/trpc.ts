import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Session } from "next-auth";
import type { User } from "../../drizzle/schema";

export type AuthedUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};

export type TrpcContext = {
  user: AuthedUser | null;
};

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

type Authed = NonNullable<TrpcContext["user"]>;

function guardUser(ctx: TrpcContext): ctx is TrpcContext & { user: Authed } {
  return Boolean(ctx.user);
}

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!guardUser(ctx)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Oturum süren doldu; lütfen tekrar giriş yap." });
  }
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure
  .use(requireUser)
  .use(({ ctx, next }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Bu alan yalnızca yöneticilere açıktır." });
    }
    return next({ ctx });
  });

export async function authedUserFromSession(session: Session | null, userRow: User | undefined): Promise<AuthedUser | null> {
  if (!session?.user || !userRow) return null;
  return { id: userRow.id, name: userRow.name, email: userRow.email, role: userRow.role as "user" | "admin" };
}
