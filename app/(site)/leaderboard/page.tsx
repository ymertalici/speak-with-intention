"use client";

import { useSession } from "next-auth/react";
import { PendingAccessGate, SignInGate } from "@/components/AccessGate";
import { AppHeader } from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { Crown, Loader2, Medal, Sparkles } from "lucide-react";

export default function Leaderboard() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";

  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const profile = trpc.learning.profile.useQuery(undefined, { enabled: isAuthenticated && programStatus.data?.hasAccess });
  const leaderboard = trpc.learning.leaderboard.useQuery(undefined, { enabled: isAuthenticated && programStatus.data?.hasAccess });
  if (loading || false) return <main className="loading-page"><Loader2 className="animate-spin" /> Hazırlanıyor…</main>;
  if (!isAuthenticated) return <SignInGate />;
  if (!programStatus.data?.hasAccess) return <PendingAccessGate />;
  const rows = leaderboard.data ?? [];
  return <div className="leaderboard-page"><AppHeader /><main className="container leaderboard-main"><section className="leaderboard-hero"><div><p className="section-label">RİTİM PANOSU</p><h1>Kendi ritmin.<br /><em>Gerçek</em> ilerleme.</h1><p>Burada yalnızca program erişimi açık ve XP kazanmış öğrenciler görünür. İsimler gizliliği korumak için kısaltılır; puanlar gerçek çalışmadan gelir.</p></div><aside><Sparkles size={18} /><span>SENİN SEVİYEN</span><strong>{profile.data?.level.title}</strong><small>{profile.data?.xp ?? 0} XP · sonraki seviyeye {Math.max(0, (profile.data?.level.nextAt ?? 0) - (profile.data?.xp ?? 0))} XP</small></aside></section><section className="leaderboard-list"><div className="leaderboard-list-head"><div><p className="section-label">GERÇEK ÇALIŞMA, GERÇEK PUAN</p><h2>Bu haftanın ritmi.</h2></div><Medal size={24} /></div>{leaderboard.isLoading ? <div className="leaderboard-empty"><Loader2 className="animate-spin" /> Veriler hazırlanıyor…</div> : rows.length ? <ol>{rows.map(row => <li key={`${row.rank}-${row.name}`}><div className={`rank-mark rank-${row.rank}`}>{row.rank === 1 ? <Crown size={16} /> : String(row.rank).padStart(2, "0")}</div><div><strong>{row.name}</strong><span>{row.cefrLevel ? `${row.cefrLevel} rotası` : "Rota belirleniyor"}</span></div><b>{row.xp} <small>XP</small></b></li>)}</ol> : <div className="leaderboard-empty"><Sparkles size={20} /><h3>İlk gerçek ritmi sen başlat.</h3><p>XP kazanan uygun bir öğrenci oluştuğunda sıralama burada görünür. Örnek isim veya yapay puan kullanılmaz.</p></div>}</section></main></div>;
}
