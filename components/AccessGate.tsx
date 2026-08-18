"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";

export function SignInGate() {
  return (
    <main className="gate-page">
      <div className="gate-card">
        <span className="eyebrow"><Sparkles size={14} /> Öğrenci alanı</span>
        <h1>Pratiğini<br /><em>sessizce</em> büyüt.</h1>
        <p>Haftalık çalışmalara erişmek için yalnızca program hesabınla giriş yapman yeterli.</p>
        <Link href="/login"><Button className="button-ink button-wide">Hesabınla giriş yap <ArrowRight size={16} /></Button></Link>
        <Link href="/" className="text-link">Programı tekrar incele</Link>
      </div>
    </main>
  );
}

export function PendingAccessGate() {
  return (
    <main className="gate-page">
      <div className="gate-card gate-card-soft">
        <span className="eyebrow"><LockKeyhole size={14} /> Erişim bekliyor</span>
        <h1>Hesabın hazır.<br /><em>Alanını</em> açıyoruz.</h1>
        <p>Girişin tamamlandı. Program erişimin, eğitmenin tarafından etkinleştirildiğinde dört haftalık çalışma alanın burada görünecek.</p>
        <Link href="/support" className="text-link">Destek kurallarını incele <ArrowRight size={15} /></Link>
      </div>
    </main>
  );
}
