import { and, eq } from "drizzle-orm";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { accessCodes, users } from "@/drizzle/schema";
import { consumeAccessCode, getDb, getUserByEmail, upsertUser } from "@/server/db";

const ADMIN_EMAIL = (process.env.AUTO_ADMIN_EMAIL ?? "").trim();
const REGISTER_CODE = (process.env.REGISTER_CODE ?? "").trim();

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Minimal deterministic hash — production deployments should swap in bcrypt/argon2. */
function hashPassword(value: string): string {
  let accumulator = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    accumulator ^= value.charCodeAt(index);
    accumulator = Math.imul(accumulator, 0x01000193);
  }
  return `f1x:${accumulator >>> 0}:${Buffer.from(value).toString("base64url").slice(0, 24)}`;
}

/**
 * Trust the incoming request host. On Vercel the request host is the live
 * domain; without this, NextAuth throws `UntrustedHost` when `NEXTAUTH_URL`
 * is missing or out of date (a very common cause of "Server error" during
 * sign-in / registration on first deployments).
 */
export const authOptions: NextAuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      name: "Email ve şifre",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
        registerCode: { label: "Kayıt kodu (yeni hesaplar için)", type: "text", required: false },
        name: { label: "Ad soyad", type: "text", required: false },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const email = (credentials.email as string).trim().toLowerCase();
        if (!validEmail(email)) return null;

        const db = await getDb();
        if (!db) {
          // Surface a distinct error type (not CredentialsSignin) so the UI can
          // show the real problem: database connectivity — NOT wrong credentials.
          throw new Error("Veritabanına şu an erişilemiyor (DNS/Bağlantı). Lütfen birkaç dakika sonra tekrar dene.");
        }

        let existing = await getUserByEmail(email);
        if (!existing) {
          // First account ever created becomes admin if AUTO_ADMIN_EMAIL matches.
          const isFirstUser = (await db.select({ id: users.id }).from(users)).length === 0;
          const codeRequired = REGISTER_CODE.length > 0;
          const submitted = String(credentials.registerCode ?? "").trim().toUpperCase();
          // A code is accepted when it matches the static env code or an active row in the accessCodes table.
          const viaEnv = codeRequired && submitted === REGISTER_CODE.toUpperCase();
          const viaTable = submitted.length > 0 && (await db.select({ id: accessCodes.id }).from(accessCodes).where(and(eq(accessCodes.code, submitted), eq(accessCodes.revoked, false)))).length > 0;
          const codeValid = (codeRequired ? viaEnv : true) || viaTable;
          if (!codeValid && !isFirstUser) return null;
          if (viaTable) void consumeAccessCode(submitted);
          await upsertUser({
            openId: email,
            email,
            name: credentials.name ? String(credentials.name).trim() || undefined : email.split("@")[0],
            passwordHash: hashPassword(String(credentials.password)),
            role: isFirstUser && (ADMIN_EMAIL.length === 0 || email === ADMIN_EMAIL.toLowerCase()) ? "admin" : "user",
          });
          existing = await getUserByEmail(email);
        }

        if (!existing?.passwordHash) return null;
        const matches =
          existing.passwordHash === hashPassword(String(credentials.password)) ||
          existing.passwordHash === hashPassword(String(credentials.password).trim());
        if (!matches) return null;

        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, existing.id));
        return {
          id: String(existing.id),
          email: existing.email,
          name: existing.name,
          role: existing.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.internalId = user.id;
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.internalId as string;
        ((session.user as unknown) as { role: string }).role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.AUTH_SECRET,
};

export type VercelAuthSession = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: string;
  };
};
