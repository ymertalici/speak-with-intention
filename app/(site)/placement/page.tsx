"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { PendingAccessGate, SignInGate } from "@/components/AccessGate";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronRight, Loader2, Sparkles } from "lucide-react";

type Question = { id: string; difficulty: number; prompt: string; options: string[]; skill: string };
type PlacementResult = { cefrLevel: string; score: number; roadmap: { title: string; focus: string; next: string }; xp: number };

function PlacementPending() {
  return <div className="placement-page"><AppHeader /><main className="container placement-main">
    <section className="placement-hero"><div><p className="section-label">ADAPTİF SEVİYE HARİTASI</p><h1>Sorular seni<br /><em>dinlesin.</em></h1><p>İlk sorudan son soruya kadar zorluk, verdiğin yanıta göre değişir. Sonunda yalnızca bir etiket değil, sonraki çalışmanın için net bir yön alırsın.</p></div><aside><Sparkles size={18} /><span>12 soru · uyarlanan zorluk</span><strong>Ölçüm hazırlanıyor</strong></aside></section>
    <section className="placement-start-card"><p className="section-label">KİŞİSEL ROTA</p><h2>Önce yanıtların dinlenir.</h2><p>Ölçüm, öğrenci profilin ve program erişimin hazır olduğunda başlar. İlk sorudan önce yanıtlaman gereken hiçbir şey yoktur.</p><div className="placement-pending-row"><Loader2 className="animate-spin" size={17} /><span>Ölçüm alanın hazırlanıyor…</span></div></section>
  </main></div>;
}

export default function Placement() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";
  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const profile = trpc.learning.profile.useQuery(undefined, { enabled: isAuthenticated && programStatus.data?.hasAccess });
  const start = trpc.learning.startPlacement.useMutation();
  const answer = trpc.learning.answerPlacement.useMutation();
  const [attemptKey, setAttemptKey] = useState<string>();
  const [question, setQuestion] = useState<Question>();
  const [selected, setSelected] = useState<number>();
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PlacementResult>();

  if (loading) return <PlacementPending />;
  if (!isAuthenticated) return <SignInGate />;
  if (!programStatus.data?.hasAccess) return <PendingAccessGate />;

  const begin = () => start.mutate(undefined, { onSuccess: data => { setAttemptKey(data.attemptKey); setQuestion(data.question); setSelected(undefined); setProgress(0); setResult(undefined); } });
  const submit = () => {
    if (!attemptKey || !question || selected === undefined) return;
    answer.mutate({ attemptKey, questionId: question.id, selectedIndex: selected }, {
      onSuccess: data => {
        setSelected(undefined);
        if (data.complete) { setQuestion(undefined); setResult(data.result); profile.refetch(); }
        else { setQuestion(data.nextQuestion); setProgress(data.progress); }
      },
    });
  };

  return <div className="placement-page"><AppHeader /><main className="container placement-main">
    <section className="placement-hero"><div><p className="section-label">ADAPTİF SEVİYE HARİTASI</p><h1>Sorular seni<br /><em>dinlesin.</em></h1><p>İlk sorudan son soruya kadar zorluk, verdiğin yanıta göre değişir. Sonunda yalnızca bir etiket değil, sonraki çalışmanın için net bir yön alırsın.</p></div><aside><Sparkles size={18} /><span>12 soru · uyarlanan zorluk</span><strong>{profile.data?.cefrLevel ? `Son ölçüm: ${profile.data.cefrLevel}` : "Başlamaya hazır"}</strong></aside></section>
    {!question && !result && <section className="placement-start-card"><p className="section-label">BAŞLANGIÇ NOKTASI</p><h2>{profile.data?.placementCompleted ? "Yeni seviyeni tekrar kontrol et." : "Kendine uygun sorudan başla."}</h2><p>Yanıtların tek tek kaydedilir ve kişisel profilinden başka kimseyle paylaşılmaz. Her doğru yanıtta XP kazanırsın.</p><Button className="button-ink" onClick={begin} disabled={start.isPending}>{start.isPending ? <Loader2 className="animate-spin" /> : <ChevronRight size={16} />}{profile.data?.placementCompleted ? "Yeni ölçüm başlat" : "Seviyemi ölç"}</Button></section>}
    {question && <section className="adaptive-question-card"><div className="question-topline"><span>ADIM {progress + 1} / 12</span><span>Seviye {question.difficulty} · {question.skill}</span></div><div className="question-progress"><i style={{ width: `${((progress + 1) / 12) * 100}%` }} /></div><h2>{question.prompt}</h2><div className="answer-options">{question.options.map((option, index) => <button key={option} className={selected === index ? "is-selected" : ""} onClick={() => setSelected(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{selected === index && <CheckCircle2 size={17} />}</button>)}</div><div className="question-actions"><p>Yanıtın, bir sonraki sorunun zorluğunu belirleyecek.</p><Button className="button-ink" onClick={submit} disabled={selected === undefined || answer.isPending}>{answer.isPending ? <Loader2 className="animate-spin" /> : "Yanıtı kaydet"}<ChevronRight size={16} /></Button></div></section>}
    {result && <section className="placement-result-card"><p className="section-label">SENİN ÖĞRENME HARİTAN</p><div className="result-level">{result.cefrLevel}</div><h2>{result.roadmap.title}</h2><p>Bu ölçümde {result.score}/12 doğru yaptın. Şu an en çok {result.roadmap.focus} alanını güçlendirmek sana fayda sağlar.</p><div><strong>Sonraki rota</strong><span>{result.roadmap.next}</span></div><Button className="button-ink" onClick={begin}>Tekrar dene <ChevronRight size={16} /></Button></section>}
  </main></div>;
}
