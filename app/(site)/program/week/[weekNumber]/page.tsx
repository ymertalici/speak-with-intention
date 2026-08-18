"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PendingAccessGate, SignInGate } from "@/components/AccessGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { programWeeks, type PracticePrompt } from "@/lib/program";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Clipboard, Loader2, Save, Sparkles } from "lucide-react";

function parseTasks(value?: string) { try { return value ? (JSON.parse(value) as string[]) : []; } catch { return []; } }

function PromptCard({ prompt }: { prompt: PracticePrompt }) {
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt.body);
    toast.success("Komut panoya kopyalandı.", { description: "İstediğin AI aracına yapıştırarak başlayabilirsin." });
  };
  return <article className="prompt-card"><div className="prompt-card-head"><Badge variant="outline">{prompt.category}</Badge><button onClick={copyPrompt} className="copy-button" aria-label={`${prompt.title} komutunu kopyala`}><Clipboard size={15} /> Kopyala</button></div><h3>{prompt.title}</h3><p>{prompt.description}</p><pre>{prompt.body}</pre><Button variant="outline" onClick={copyPrompt} className="prompt-copy-cta"><Clipboard size={15} /> Komutu kopyala</Button></article>;
}

export default function WeekPage() {
  const params = useParams<{ weekNumber: string }>();
  const router = useRouter();
  const weekNumber = Number(params?.weekNumber ?? "1");
  const week = programWeeks.find(item => item.number === weekNumber) ?? programWeeks[0];
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";
  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const saveProgress = trpc.program.saveWeekProgress.useMutation({
    onSuccess: async () => { await utils.program.status.invalidate(); toast.success("İlerlemen kaydedildi."); },
    onError: error => toast.error("Kaydedilemedi", { description: error.message }),
  });
  const record = programStatus.data?.progress.find(item => item.weekNumber === week.number);
  const initialTasks = useMemo(() => parseTasks(record?.completedTaskIds), [record?.completedTaskIds]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const allTaskIds = [...week.exercises.map(item => item.id), `w${week.number}-task`];

  useEffect(() => { setCompletedTaskIds(initialTasks); setReflection(record?.reflection ?? ""); }, [initialTasks, record?.reflection, week.number]);
  if (loading) return <main className="loading-page"><Loader2 className="animate-spin" /> Hazırlanıyor…</main>;
  if (!isAuthenticated) return <SignInGate />;
  if (programStatus.isLoading) return <main className="loading-page"><Loader2 className="animate-spin" /> İçerik hazırlanıyor…</main>;
  if (programStatus.error || !programStatus.data?.hasAccess) return <PendingAccessGate />;

  const toggleTask = (id: string) => setCompletedTaskIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const save = () => saveProgress.mutate({ weekNumber: week.number, completedTaskIds, reflection });
  const isWeekComplete = allTaskIds.every(id => completedTaskIds.includes(id));

  return <div className="week-page"><AppHeader /><main className="container week-main">
    <Link href="/program" className="back-link"><ArrowLeft size={16} /> Çalışma alanına dön</Link>
    <section className="week-hero"><div><span className="week-hero-number">0{week.number}</span><p className="section-label">{week.label.toUpperCase()}</p><h1>{week.title}</h1><p>{week.goal}</p></div><aside><span>HAFTALIK RİTİM</span><strong>{week.duration}</strong><p>{week.focus}</p></aside></section>
    <nav className="week-anchor-nav"><a href="#vocabulary">Kelimeler</a><a href="#practice">Alıştırmalar</a><a href="#prompts">AI komutları</a><a href="#reflection">Yansıt</a></nav>
    <section id="vocabulary" className="week-section"><div className="week-section-head"><p className="section-label">01 · KELİMELER</p><h2>Önce tanı, sonra kullan.</h2></div><div className="vocab-grid">{week.vocabulary.map((word, index) => <article key={word.word} className="vocab-card"><span>0{index + 1}</span><h3>{word.word}</h3><p>{word.meaning}</p><em>“{word.example}”</em></article>)}</div></section>
    <section id="practice" className="week-section practice-check-section"><div className="week-section-head"><p className="section-label">02 · MİNİ ALIŞTIRMALAR</p><h2>Küçük adımları görünür kıl.</h2><p>Yaptığın her bölümü işaretle. İlerlemen yalnızca senin hesabında saklanır.</p></div><div className="task-list">{week.exercises.map((exercise, index) => <label className={`task-row ${completedTaskIds.includes(exercise.id) ? "task-row-done" : ""}`} key={exercise.id}><input type="checkbox" checked={completedTaskIds.includes(exercise.id)} onChange={() => toggleTask(exercise.id)} /><span className="custom-check">{completedTaskIds.includes(exercise.id) && <Check size={14} />}</span><span className="task-index">0{index + 1}</span><span className="task-copy"><strong>{exercise.title}</strong><small>{exercise.description}</small></span><span className="task-duration">{exercise.duration}</span></label>)}</div></section>
    <section className="weekly-task-card"><div><span className="weekly-task-star">✦</span><p className="section-label">03 · HAFTALIK GÖREV</p><h2>{week.task.title}</h2><p>{week.task.description}</p><div className="outcome-note"><CheckCircle2 size={16} /> <span><b>Çıkış hedefi:</b> {week.task.outcome}</span></div></div><label className={`task-toggle ${completedTaskIds.includes(`w${week.number}-task`) ? "task-toggle-done" : ""}`}><input type="checkbox" checked={completedTaskIds.includes(`w${week.number}-task`)} onChange={() => toggleTask(`w${week.number}-task`)} /><span>{completedTaskIds.includes(`w${week.number}-task`) ? "Görev tamamlandı" : "Görevi tamamla"}</span><div>{completedTaskIds.includes(`w${week.number}-task`) ? <Check size={15} /> : <ChevronRight size={16} />}</div></label></section>
    <section id="prompts" className="week-section"><div className="week-section-head"><p className="section-label">04 · AI PRATİK KOMUTLARI</p><h2>Hazır çerçeve, gerçek pratik.</h2><p>Komutu tek tıkla kopyala; seçtiğin yapay zekâ aracına yapıştır ve cevap vermeye başla.</p></div><div className="prompt-grid">{week.prompts.map(prompt => <PromptCard prompt={prompt} key={prompt.id} />)}</div></section>
    <section id="reflection" className="reflection-section"><div><p className="section-label">05 · KENDİNE NOT</p><h2>Bu hafta ne değişti?</h2><p>İstersen kısa bir not bırak. Bu alan yalnızca senin ilerleme kaydının bir parçası.</p></div><div className="reflection-form"><textarea value={reflection} onChange={event => setReflection(event.target.value)} maxLength={1200} placeholder="Örneğin: Past tense kullanırken daha rahat hissettim, ama cümlelerimi bağlamak için biraz daha pratik yapmak istiyorum…" /><div className="reflection-foot"><span>{reflection.length}/1200</span><Button onClick={save} disabled={saveProgress.isPending} className="button-ink">{saveProgress.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Kaydet</Button></div></div></section>
    <section className={`week-complete-banner ${isWeekComplete ? "week-complete-visible" : ""}`}><Sparkles size={18} /><div><strong>{isWeekComplete ? "Bu haftayı tamamladın." : "Her adımın yeri var."}</strong><p>{isWeekComplete ? "Kaydın güncellendi. İstersen sıradaki haftaya geçebilirsin." : "Dört görevi bitirdiğinde haftan tamamlanmış sayılır."}</p></div>{isWeekComplete && week.number < 4 && <Button variant="outline" onClick={() => router.push(`/program/week/${week.number + 1}`)}>Sonraki hafta <ChevronRight size={16} /></Button>}</section>
  </main></div>;
}
