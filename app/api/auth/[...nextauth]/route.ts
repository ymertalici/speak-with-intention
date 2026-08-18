import NextAuth from "next-auth";
import { authOptions } from "@/app/api/auth/options";

if (!process.env.AUTH_SECRET) {
  // NextAuth v5 crashes with a generic "Server error" page when AUTH_SECRET is
  // missing in production. Fail loudly with a clear message instead.
  console.error(
    "[Auth] AUTH_SECRET ortam değişkeni tanımlı değil. Vercel panosunda Settings > " +
    "Environment Variables üzerinden en az 32 karakterlik rastgele bir değer ekle " +
    "(openssl rand -base64 32) ve projeyi yeniden dağıt.",
  );
}

const { handlers } = NextAuth(authOptions);
export const GET = handlers.GET;
export const POST = handlers.POST;
