"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PendingAccessGate, SignInGate } from "@/components/AccessGate";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BookOpenCheck, ChevronDown, ChevronUp, ClipboardList, Download, Sparkles } from "lucide-react";
import JSZip from "jszip";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function Profile() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";
  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const history = trpc.learning.practiceHistory.useQuery(undefined, { enabled: isAuthenticated && Boolean(programStatus.data?.hasAccess) });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<"week" | "month" | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "Yazı / döküm analizi" | "Konuşma incelemesi">("all");
  const [exportProgress, setExportProgress] = useState<number>(0);

  if (loading) return <div className="coach-page"><AppHeader /><main className="container py-24 text-[#1d2a38]">Profilin hazırlanıyor…</main></div>;
  if (!isAuthenticated) return <SignInGate />;
  if (!programStatus.data?.hasAccess) return <PendingAccessGate />;

  const entries = (history.data ?? []).filter(entry => {
    if (typeFilter !== "all" && entry.type !== typeFilter) return false;
    if (dateFilter === "all") return true;
    const cutoffDays = dateFilter === "week" ? 7 : 30;
    const cutoff = Date.now() - cutoffDays * 24 * 60 * 60 * 1000;
    return new Date(entry.createdAt).getTime() >= cutoff;
  }).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  async function downloadArchive() {
    if (exportProgress > 0 || entries.length === 0) return;
    const zip = new JSZip();
    const safeName = (session?.user?.name ?? "pratik").toString().trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "pratik";
    setExportProgress(5);
    zip.file("manifest.json", JSON.stringify({ exportedAt: new Date().toISOString(), entries: entries.map(entry => ({ id: entry.id, type: entry.type, focus: entry.focus, createdAt: entry.createdAt, overview: entry.overview, nextStep: entry.nextStep, correctionsCount: entry.corrections.length })) }, null, 2));
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      zip.file(`analysis-${entry.id}.json`, JSON.stringify({ id: entry.id, type: entry.type, focus: entry.focus, createdAt: entry.createdAt, sourceText: entry.sourceText, overview: entry.overview, strengths: [], corrections: entry.corrections, nextStep: entry.nextStep }, null, 2));
      setExportProgress(Math.round(10 + ((index + 1) / entries.length) * 80));
    }
    const blob = await zip.generateAsync({ type: "blob" as const }, (metadata: JSZip.JSZipMetadata) => { setExportProgress(Math.round(90 + metadata.percent * 0.1)); });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}-pratik-arsivi.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  const dateOptions: Array<["week" | "month" | "all", string]> = [["week", "Son 7 gün"], ["month", "Son 30 gün"], ["all", "Tümü"]];
  const typeOptions: Array<["all" | "Yazı / döküm analizi" | "Konuşma incelemesi", string]> = [["all", "Tümü"], ["Yazı / döküm analizi", "Yazı analizi"], ["Konuşma incelemesi", "Konuşma incelemesi"]];
  return <div className="coach-page"><AppHeader /><main className="container py-12 md:py-16">
    <section className="grid gap-7 border-b border-[#d9d1c4] pb-10 md:grid-cols-[1.3fr_.7fr] md:items-end">
      <div><p className="section-label">ÖĞRENME PROFİLİ</p><h1 className="mt-3 text-[clamp(38px,6vw,68px)] font-semibold leading-[.9] tracking-[-.065em] text-[#1d2a38]">Pratiğin,<br /><em className="font-serif font-normal text-[#c77d52]">iz bırakır.</em></h1><p className="mt-5 max-w-xl text-base leading-7 text-[#53606c]">Önceki yazı analizlerini ve konuşma değerlendirmelerini burada yalnızca sen görürsün. Bir çalışmayı açıp düzeltmelerine yeniden dönebilirsin.</p></div>
      <aside className="rounded-[18px] bg-[#1d2a38] p-6 text-[#f8f5ee]"><p className="text-xs font-semibold tracking-[.14em] text-[#e5ae8b]">BU HAFTA</p><strong className="mt-3 block text-3xl">{entries.length} kayıt</strong><p className="mt-2 text-sm leading-6 text-[#d9d4ca]">Bu arşiv, haftalık AI koçunun gerçek pratiklerinden öğrenmesini sağlar.</p><Link href="/weekly-coach" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f2bd9c]">Koç notunu aç <Sparkles size={15} /></Link></aside>
    </section>
    <section className="mt-10"><div className="flex items-end justify-between gap-5"><div><p className="section-label">PRATİK ARŞİVİ</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.05em] text-[#1d2a38]">Önceki çalışmaların</h2></div><span className="text-sm text-[#65707a]">{entries.length} kayıt</span></div>
      <div className="mt-6 flex flex-wrap items-center gap-3" role="group" aria-label="Arşiv filtreleri">
        <p className="mr-1 text-xs font-semibold tracking-[.1em] text-[#8a7864]">FİLTRELE:</p>
        {dateOptions.map(([value, label]) => <button key={value} type="button" className={"filter-chip" + (dateFilter === value ? " is-selected" : "")} onClick={() => setDateFilter(value)}>{label}</button>)}
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-[#d9d1c4]" />
        {typeOptions.map(([value, label]) => <button key={value} type="button" className={"filter-chip" + (typeFilter === value ? " is-selected" : "")} onClick={() => setTypeFilter(value)}>{label}</button>)}
      </div>
      {history.isLoading ? (
        <p className="mt-8 text-[#65707a]">Arşivin yükleniyor…</p>
      ) : entries.length === 0 ? (
        <div className="mt-7 rounded-[18px] border border-dashed border-[#cfc4b4] bg-[#fbf9f4] p-8">
          <BookOpenCheck className="h-7 w-7 text-[#c77d52]" />
          <h3 className="mt-4 text-xl font-semibold text-[#1d2a38]">Bu aralığa uyan pratik yok.</h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#65707a]">Bir metni AI Dil Koçu’nda analiz ettiğinde veya konuşmanı değerlendirdiğinde sonuç burada saklanır.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/coach"><Button className="button-ink">Metin analiz et</Button></Link>
            <Link href="/conversation"><Button variant="outline">Konuşma pratiği</Button></Link>
          </div>
        </div>
      ) : (
        <div className="mt-7 grid gap-4">
          {entries.map(entry => {
            const expanded = expandedId === entry.id;
            return <article key={entry.id} className="rounded-[18px] border border-[#ded6ca] bg-[#fffdf8] p-5 shadow-[0_12px_30px_rgba(25,36,49,.05)] md:p-6">
              <button type="button" className="flex w-full items-start justify-between gap-5 text-left" onClick={() => setExpandedId(expanded ? null : entry.id)}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#f3e4d6] px-2.5 py-1 text-xs font-semibold text-[#9b5435]">{entry.type}</span>
                    {entry.focus && <span className="text-xs text-[#65707a]">{entry.focus}</span>}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-[#1d2a38]">{entry.overview}</h3>
                  <p className="mt-2 text-xs text-[#65707a]">{formatDate(entry.createdAt)}</p>
                </div>
                {expanded ? <ChevronUp className="mt-2 shrink-0 text-[#9b5435]" /> : <ChevronDown className="mt-2 shrink-0 text-[#9b5435]" />}
              </button>
              <Link href={`/profile/practice/${entry.id}`} className="mt-4 inline-flex text-sm font-semibold text-[#9b5435] underline underline-offset-4">Tam incelemeyi ayrı sayfada aç</Link>
              {expanded && <div className="mt-5 grid gap-5 border-t border-[#ece5da] pt-5 md:grid-cols-[.72fr_1.28fr]">
                <div>
                  <p className="section-label">GÖNDERDİĞİN METİN</p>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-[#f7f2ea] p-4 text-sm leading-6 text-[#43515e]">{entry.sourceText}</p>
                </div>
                <div>
                  <p className="section-label">DÜZELTME NOTLARI</p>
                  <div className="mt-2 grid gap-3">
                    {entry.corrections.length ? entry.corrections.map((item, index) => <div key={`${entry.id}-${index}`} className="rounded-xl border border-[#eee4d6] p-4">
                      <p className="text-sm text-[#7d4934]"><del>{item.before}</del> <span className="mx-1">→</span> <strong>{item.after}</strong></p>
                      <p className="mt-2 text-sm leading-6 text-[#53606c]">{item.reason}</p>
                      <p className="mt-2 text-sm font-medium text-[#1d2a38]">Tekrar: {item.practice}</p>
                    </div>) : <p className="text-sm leading-6 text-[#53606c]">Bu çalışmada öne çıkan tek bir düzeltme yok. Güçlü yönlerini koruyarak bir sonraki görevi dene.</p>}
                  </div>
                  <p className="mt-4 rounded-xl bg-[#1d2a38] p-4 text-sm leading-6 text-[#f8f5ee]"><ClipboardList className="mr-2 inline h-4 w-4 text-[#e5ae8b]" />Bir sonraki adım: {entry.nextStep}</p>
                </div>
              </div>}
            </article>;
            })}
          {entries.length > 0 && <div className="col-span-full mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#d9d1c4] bg-[#fbf9f4] p-5">
            <div>
              <p className="text-sm font-semibold text-[#1d2a38]">Arşivi toplu indir</p>
              <p className="mt-1 text-xs leading-5 text-[#65707a]">Seçili filtrelerdeki her kayıt ayrı bir JSON dosyası olarak ZIP içinde gelir; haftalık AI koçuna aktarmak veya arşivlemek için kullanabilirsin.</p>
            </div>
            {exportProgress > 0 ? (
              <div className="coach-progress" style={{ minWidth: 220 }} aria-live="polite">
                <div className="progress-label"><strong>Arşiv hazırlanıyor…</strong><span>%{exportProgress}</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${exportProgress}%` }} /></div>
              </div>
            ) : (
              <Button type="button" variant="outline" className="button-ink" onClick={downloadArchive} disabled={entries.length === 0}><Download size={16} />Arşivi ZIP olarak indir ({entries.length})</Button>
            )}
          </div>}
        </div>
      )}
    </section>
  </main></div>;
}
