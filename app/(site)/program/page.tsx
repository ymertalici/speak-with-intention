"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { AdminPill, AppHeader } from "@/components/AppHeader";
import { PendingAccessGate, SignInGate } from "@/components/AccessGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { programWeeks, totalTaskCount } from "@/lib/program";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, CircleHelp, CirclePlay, Loader2, Sparkles } from "lucide-react";

function parseTasks(value: string) {
  try { return JSON.parse(value) as string[]; } catch { return []; }
}

export default function ProgramDashboard() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";
  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) return <main className="loading-page"><Loader2 className="animate-spin" /> Hazırlanıyor…</main>;
  if (!isAuthenticated) return <SignInGate />;
  if (programStatus.error || !programStatus.data?.hasAccess) return <PendingAccessGate />;

  const completedCount = programStatus.data.progress.reduce((sum, item) => sum + parseTasks(item.completedTaskIds).length, 0);
  const progressPct = Math.min(100, Math.round((completedCount / totalTaskCount) * 100));
  const activeWeek = programWeeks.find(week => !programStatus.data?.progress.some(item => item.weekNumber === week.number && parseTasks(item.completedTaskIds).length >= 4)) ?? programWeeks[3];

  return (
    <div className="workspace-page">
      <AppHeader />
      <main className="container workspace-main">
        <section className="dashboard-welcome">
          <div>
            <div className="workspace-meta"><span><Sparkles size={14} /> Öğrenci alanı</span><AdminPill /></div>
            <p className="section-label">MERHABA, {session?.user?.name?.split(" ")[0]?.toUpperCase() || "ÖĞRENCİ"}</p>
            <h1>Bugün küçük bir<br /><em>alan</em> açalım.</h1>
            <p>Programın bir sonraki adımı hazır. Kısa çalış; sesini duymaya devam et.</p>
          </div>
          <div className="progress-orb-card">
            <div className="progress-ring" style={{ "--progress": `${progressPct * 3.6}deg` } as React.CSSProperties}><div><strong>%{progressPct}</strong><span>tamamlandı</span></div></div>
            <p>{completedCount} / {totalTaskCount} görev</p>
          </div>
        </section>

        <section className="next-session-card">
          <div className="next-session-eyebrow"><span>ŞİMDİKİ ODAK</span><Badge>Hafta {activeWeek.number}</Badge></div>
          <div className="next-session-content"><div><h2>{activeWeek.title}</h2><p>{activeWeek.goal}</p></div><Link href={`/program/week/${activeWeek.number}`}><Button className="button-ink">Çalışmaya başla <ArrowRight size={16} /></Button></Link></div>
        </section>

        <section className="workspace-section">
          <div className="workspace-section-head"><div><p className="section-label">PROGRAM AKIŞI</p><h2>Dört haftalık alanın.</h2></div><Link href="/support" className="inline-link"><CircleHelp size={16} /> Destek & SSS</Link></div>
          <div className="week-card-grid">
            {programWeeks.map(week => {
              const progress = programStatus.data?.progress.find(item => item.weekNumber === week.number);
              const done = progress ? parseTasks(progress.completedTaskIds).length : 0;
              const isComplete = done >= 4;
              return <Link href={`/program/week/${week.number}`} className={`week-card ${isComplete ? "week-card-complete" : ""}`} key={week.number}>
                <div className="week-card-top"><span>0{week.number}</span>{isComplete ? <span className="complete-dot"><Check size={13} /> Tamam</span> : <CirclePlay size={19} />}</div>
                <p>{week.label}</p><h3>{week.title}</h3><span className="week-card-focus">{week.focus}</span><div className="week-card-progress"><i style={{ width: `${Math.min(100, done * 25)}%` }} /><span>{done}/4</span></div>
              </Link>;
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
