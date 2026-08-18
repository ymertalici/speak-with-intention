import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/components/Providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Speak with Intention — 4 haftalık AI destekli İngilizce konuşma rutini",
  description:
    "Kısa ama düzenli, yapay zekâ yönlendirmeli bir İngilizce konuşma pratiği. Dört hafta, dört açık odak: dinle, kur, düzelt ve ilerlet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <SessionProvider>
          <Providers>{children}</Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
