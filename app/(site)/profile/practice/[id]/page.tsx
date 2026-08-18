"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { PendingAccessGate, SignInGate } from "@/components/AccessGate";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ClipboardList } from "lucide-react";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default function PracticeReview() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";
  const params = useParams<{ id: string }>();
  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const history = trpc.learning.practiceHistory.useQuery(undefined, { enabled: isAuthenticated && Boolean(programStatus.data?.hasAccess) });

  if (loading || false) return <div className="coach-page"><AppHeader /><main className="container py-24 text-[#1d2a38]">İnceleme hazırlanıyor…</main></div>;
  if (!isAuthenticated) return <SignInGate />;
  if (!programStatus.data?.hasAccess) return <PendingAccessGate />;
  const entry = history.data?.find(item => item.id === Number(params?.id));

  return <div className="coach-page"><AppHeader /><main className="container py-12 md:py-16"><Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-[#9b5435]"><ArrowLeft size={16} /> Pratik arşivine dön</Link>{history.isLoading ? <p className="mt-8 text-[#65707a]">İnceleme yükleniyor…</p> : !entry ? <section className="mt-8 rounded-[18px] border border-dashed border-[#cfc4b4] bg-[#fbf9f4] p-8"><h1 className="text-2xl font-semibold text-[#1d2a38]">Bu pratik kaydı bulunamadı.</h1><p className="mt-2 text-sm leading-6 text-[#65707a]">Kayıt sana ait olmayabilir veya arşivden kaldırılmış olabilir.</p></section> : <section className="mt-8 max-w-4xl"><p className="section-label">KAYITLI PRATİK İNCELEMESİ</p><div className="mt-3 flex flex-wrap items-center gap-3"><span className="rounded-full bg-[#f3e4d6] px-3 py-1 text-xs font-semibold text-[#9b5435]">{entry.type}</span>{entry.focus && <span className="text-sm text-[#65707a]">{entry.focus}</span>}<span className="text-sm text-[#65707a]">{formatDate(entry.createdAt)}</span></div><h1 className="mt-5 text-4xl font-semibold tracking-[-.05em] text-[#1d2a38]">{entry.overview}</h1><article className="mt-8 rounded-[20px] border border-[#ded6ca] bg-[#fffdf8] p-6 md:p-8"><p className="section-label">GÖNDERDİĞİN METİN</p><p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#f7f2ea] p-5 text-sm leading-7 text-[#43515e]">{entry.sourceText}</p><p className="mt-8 section-label">DÜZELTMELER</p><div className="mt-3 grid gap-4">{entry.corrections.length ? entry.corrections.map((item, index) => <div key={index} className="rounded-xl border border-[#eee4d6] p-5"><p className="text-base text-[#7d4934]"><del>{item.before}</del> <span className="mx-1">→</span><strong>{item.after}</strong></p><p className="mt-3 text-sm leading-6 text-[#53606c]">{item.reason}</p><p className="mt-3 text-sm font-medium text-[#1d2a38]">Tekrar cümlesi: {item.practice}</p></div>) : <p className="text-sm text-[#53606c]">Bu kayıtta tekil bir düzeltme öne çıkmadı.</p>}</div><p className="mt-6 rounded-xl bg-[#1d2a38] p-5 text-sm leading-7 text-[#f8f5ee]"><ClipboardList className="mr-2 inline h-4 w-4 text-[#e5ae8b]" />Bir sonraki adım: {entry.nextStep}</p></article></section>}</main></div>;
}
