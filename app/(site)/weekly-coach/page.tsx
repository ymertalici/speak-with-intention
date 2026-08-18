"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PendingAccessGate, SignInGate } from "@/components/AccessGate";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BarChart3, CheckCircle2, Image as ImageIcon, Loader2, Sparkles, Target } from "lucide-react";

type CoachSummaryView = {
  weekStart: string;
  generatedAt: Date;
  metrics: { languageAnalyses: number; conversationReviews: number; completedTasks: number; xpEarned: number };
  report: {
    headline: string;
    overview: string;
    wins: string[];
    focusAreas: Array<{ title: string; reason: string }>;
    nextWeekPlan: string[];
    themes?: Array<{ category: string; occurrences: number }>;
  };
};

export default function WeeklyCoach() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";
  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const weekly = trpc.learning.weeklyCoachSummary.useQuery(undefined, { enabled: isAuthenticated && Boolean(programStatus.data?.hasAccess) });
  const [latest, setLatest] = useState<CoachSummaryView | null>(null);
  const reportCanvas = useRef<HTMLDivElement | null>(null);
  const generate = trpc.learning.generateWeeklyCoachSummary.useMutation({ onSuccess: data => { setLatest(data.summary); weekly.refetch(); } });
  const [reportProgress, setReportProgress] = useState(0);
  useEffect(() => {
    if (!generate.isPending) { setReportProgress(0); return; }
    const start = Date.now();
    setReportProgress(4);
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      setReportProgress(Math.min(94, 6 + Math.round((elapsed / 9000) * 88)));
    }, 250);
    return () => window.clearInterval(interval);
  }, [generate.isPending]);
  const exportAsImage = async () => {
    const target = document.getElementById("weekly-report");
    if (!target) return;
    try {
      if (typeof (window as unknown as { html2canvas?: unknown }).html2canvas === "function") {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(target, { backgroundColor: "#f8f5ee", scale: 2 });
        const link = document.createElement("a");
        link.download = "haftalik-kocluk-ozeti.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        return;
      }
    } catch {
      /* html2canvas yüklenemedi; yazdırma penceresine düş */
    }
    window.print();
  };

  if (loading) return <div className="coach-page"><AppHeader /><main className="container py-24 text-[#1d2a38]">Haftalık koçluk alanın hazırlanıyor…</main></div>;
  if (!isAuthenticated) return <SignInGate />;
  if (!programStatus.data?.hasAccess) return <PendingAccessGate />;

  const summary: CoachSummaryView | null = latest ?? (weekly.data?.summary as CoachSummaryView | null | undefined) ?? null;
  const reportRef = reportCanvas;
  const metrics = summary?.metrics ?? { languageAnalyses: 0, conversationReviews: 0, completedTasks: 0, xpEarned: 0 };
  return <div className="coach-page"><AppHeader /><main className="container py-12 md:py-16">
    <section className="grid gap-7 rounded-[22px] bg-[#1d2a38] p-7 text-[#f8f5ee] shadow-[0_24px_60px_rgba(25,36,49,.17)] md:grid-cols-[1.2fr_.8fr] md:p-10"><div><p className="section-label !text-[#e5ae8b]">HAFTALIK AI KOÇU</p><h1 className="mt-4 text-[clamp(38px,5vw,66px)] font-semibold leading-[.9] tracking-[-.065em]">Bu haftayı<br /><em className="font-serif font-normal text-[#e5ae8b]">anlamlandır.</em></h1><p className="mt-5 max-w-xl text-base leading-7 text-[#d9d4ca]">Koç; kaydedilmiş metin analizlerini, konuşma değerlendirmelerini, tamamladığın görevleri ve kazandığın XP’yi bir araya getirir. Yeni veri uydurmaz.</p></div><aside className="rounded-[18px] border border-white/15 bg-white/5 p-6"><BarChart3 className="h-7 w-7 text-[#e5ae8b]" /><h2 className="mt-5 text-xl font-semibold">Hazır olduğunda üret.</h2><p className="mt-2 text-sm leading-6 text-[#d9d4ca]">Notu yeniden üretmek, bu haftaki en güncel pratiklerini dikkate alır.</p><Button className="mt-6 w-full bg-[#e5ae8b] text-[#1d2a38] hover:bg-[#f2bd9c]" onClick={() => generate.mutate()} disabled={generate.isPending}>      {generate.isPending ? <><Loader2 className="animate-spin" /> Koç düşünüyor…</> : <><Sparkles /> Haftalık notu oluştur</>}</Button>{generate.isPending && <div className="coach-progress mt-5" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={reportProgress}><span className="coach-progress-bar" style={{ width: `${reportProgress}%` }} /><span className="coach-progress-label">AI raporu hazırlanıyor… %{reportProgress}</span></div>}</aside></section>
    {generate.error && <section role="alert" className="mt-7 rounded-xl border border-[#e4b2a4] bg-[#fff3ef] p-5 text-[#8b422b]"><h2 className="font-semibold">Haftalık not şu an oluşturulamadı.</h2><p className="mt-2 text-sm leading-6">Pratik kayıtların güvende. Bağlantı veya AI yanıtı kısa süreli olarak tamamlanamadı; aynı verilerle yeniden deneyebilirsin.</p><p className="mt-2 text-sm leading-6">Teknik ayrıntı: {generate.error.message}</p><Button aria-label="Haftalık özeti yeniden dene" variant="outline" className="mt-4 border-[#c77d52] text-[#8b422b] hover:bg-[#f8dfd7]" onClick={() => { generate.reset(); generate.mutate(); }}>Tekrar dene</Button></section>}
    {!summary && !weekly.isLoading && <section className="mt-10 rounded-[18px] border border-dashed border-[#cfc4b4] bg-[#fbf9f4] p-8"><Target className="h-7 w-7 text-[#c77d52]" /><h2 className="mt-4 text-2xl font-semibold text-[#1d2a38]">İlk haftalık notunu oluştur.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#65707a]">Bu hafta hiç kayıt olmasa bile koç, başlayabileceğin küçük bir plan oluşturur. Önce birkaç pratik yaparsan değerlendirme daha kişisel olur.</p><Link href="/coach" className="mt-5 inline-block"><Button variant="outline">Önce metin analiz et</Button></Link></section>}
    {summary && <div className="export-target" id="weekly-report" ref={reportRef}>
    <section className="mt-10"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{ label: "Metin analizi", value: metrics.languageAnalyses }, { label: "Konuşma incelemesi", value: metrics.conversationReviews }, { label: "Tamamlanan görev", value: metrics.completedTasks }, { label: "Bu haftanın XP’si", value: metrics.xpEarned }].map(metric => <div key={metric.label} className="rounded-[16px] border border-[#ded6ca] bg-[#fffdf8] p-5"><p className="text-xs font-semibold tracking-[.11em] text-[#7d8790]">{metric.label.toLocaleUpperCase("tr-TR")}</p><strong className="mt-3 block text-3xl text-[#1d2a38]">{metric.value}</strong></div>)}</div>
    <div className="mt-7 grid gap-6 md:grid-cols-[1.15fr_.85fr]">
      <article className="rounded-[20px] border border-[#ded6ca] bg-[#fffdf8] p-7 md:p-8"><p className="section-label">KOÇ NOTU</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] text-[#1d2a38]">{summary.report.headline}</h2><p className="mt-5 text-base leading-7 text-[#53606c]">{summary.report.overview}</p>
        <div className="mt-7 border-t border-[#ece5da] pt-6"><p className="section-label">GÜÇLÜ NOKTALAR</p><ul className="mt-3 grid gap-3">{summary.report.wins.map(win => <li key={win} className="flex gap-3 text-sm leading-6 text-[#43515e]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#c77d52]" />{win}</li>)}</ul></div>
      </article>
      <aside className="rounded-[20px] bg-[#f3e4d6] p-7"><p className="section-label !text-[#9b5435]">ODAK ALANLARI</p><div className="mt-4 grid gap-4">{summary.report.focusAreas.map(area => <div key={area.title}><h3 className="font-semibold text-[#1d2a38]">{area.title}</h3><p className="mt-1 text-sm leading-6 text-[#5e4a42]">{area.reason}</p></div>)}</div></aside>
    </div>
    {summary.report.themes && summary.report.themes.length > 0 && <section className="mt-6"><div className="rounded-[20px] border border-[#ded6ca] bg-[#fffdf8] p-7"><p className="section-label">ÖĞRENME ÖRÜNTÜLERİN</p><p className="mt-2 text-sm leading-6 text-[#65707a]">AI, bugüne kadar kaydettiğin tüm analizlerden çıkan tekrar eden hata örüntülerini senin için topladı.</p><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{summary.report.themes.map(theme => <div key={theme.category} className="rounded-xl border border-[#ece5da] bg-[#fbf9f4] p-4"><div className="flex items-baseline justify-between gap-3"><p className="text-sm font-semibold text-[#1d2a38]">{theme.category}</p><span className="text-xs font-semibold text-[#c77d52]">{theme.occurrences} kez</span></div><div className="coach-progress mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, theme.occurrences * 18)}><span className="coach-progress-bar" style={{ width: `${Math.min(100, theme.occurrences * 18)}%` }} /></div></div>)}</div></div></section>}
    <article className="mt-6 rounded-[20px] bg-[#1d2a38] p-7 text-[#f8f5ee]"><p className="section-label !text-[#e5ae8b]">ÖNÜMÜZDEKİ HAFTA</p><ol className="mt-5 grid gap-3">{summary.report.nextWeekPlan.map((step, index) => <li key={step} className="flex gap-4 text-sm leading-6 text-[#e7e1d7]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e5ae8b] text-xs font-bold text-[#1d2a38]">{index + 1}</span>{step}</li>)}</ol></article>
    </section>
    <div className="mt-6 flex flex-wrap justify-end gap-3"><Button variant="outline" onClick={() => window.print()}><Sparkles size={16} /> PDF / yazdır</Button><Button variant="outline" onClick={exportAsImage}><ImageIcon size={16} /> Görsel olarak indir (PNG)</Button></div>
    </div>}
  </main></div>;
}
