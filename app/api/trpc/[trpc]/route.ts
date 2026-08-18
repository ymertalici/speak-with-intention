import NextAuth from "next-auth";
import type { Session } from "next-auth";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers";
import { authOptions } from "@/app/api/auth/options";

import { authedUserFromSession } from "@/server/_core/trpc";
import { getUserByEmail } from "@/server/db";

export const maxDuration = 60;

const auth = NextAuth(authOptions);

const handler = async (request: Request) => {
  const session = (await auth.auth()) as Session | null;
  const userRow = await getUserByEmail(session?.user?.email ?? "");
  const user = await authedUserFromSession(session, userRow);
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => ({ user }),
    onError({ error, path }) {
      console.error(`[tRPC] ${path ?? "unknown"} failed:`, error.message);
    },
  });
};

export { handler as GET, handler as POST };
