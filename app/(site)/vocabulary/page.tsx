"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { DragEvent, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { abbreviations, contextualExercises, words } from "@/lib/vocabularyContent";
import { CheckCircle2, LockKeyhole, Volume2 } from "lucide-react";


export default function Vocabulary() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";
  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const hasAccess = Boolean(programStatus.data?.hasAccess);
  const results = trpc.learning.contextualVocabulary.useQuery(undefined, { enabled: hasAccess });
  const utils = trpc.useUtils();
  const saveResult = trpc.learning.completeContextualVocabulary.useMutation({ onSuccess: () => { utils.learning.contextualVocabulary.invalidate(); utils.learning.profile.invalidate(); } });
  const [playing, setPlaying] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const speak = (text: string) => { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "en-US"; utterance.rate = 0.84; utterance.onend = () => setPlaying(null); window.speechSynthesis.speak(utterance); setPlaying(text); };
  const setChoice = (exerciseId: string, choice: string) => setPlaced(current => ({ ...current, [exerciseId]: choice }));
  const onDrop = (event: DragEvent<HTMLButtonElement>, exerciseId: string) => { event.preventDefault(); setChoice(exerciseId, event.dataTransfer.getData("text/plain")); };
  const completed = new Map((results.data ?? []).map(item => [item.exerciseId, item]));
  return <div className="vocabulary-page"><AppHeader /><main className="container vocabulary-main"><section className="vocabulary-hero"><p className="section-label">GÜNLÜK KELİME ALANI</p><h1>Az kelime.<br /><em>Daha çok</em> kullanım.</h1><p>Günlük hayatta tekrar eden, A2–B1 seviyesinde cümle kurmayı kolaylaştıran kelimeleri sesli örnekleriyle çalış.</p></section><section><div className="library-heading"><div><p className="section-label">HER GÜN KULLAN</p><h2>Konuşmanın temel kelimeleri.</h2></div><p>Kelimeleri tek başına ezberleme. Örneği dinle, kendi hayatına göre yeni bir cümle kur ve sesli söyle.</p></div><div className="daily-word-grid">{words.map(([word, meaning, example]) => <article key={word}><div><span>{meaning}</span><Button variant="ghost" size="icon" aria-label={`${word} kelimesini sesli oku`} onClick={() => speak(`${word}. ${example}`)} className={playing === `${word}. ${example}` ? "is-playing" : ""}><Volume2 size={16} /></Button></div><h3>{word}</h3><p>{example}</p></article>)}</div></section><section className="contextual-section"><div className="contextual-heading"><div><p className="section-label">BAĞLAMLA ÖĞREN</p><h2>Kelime hikâyenin<br /><em>içindeyken</em> kalır.</h2><p>Kartı boşluğa sürükle veya seçeneğe dokun. Doğru yerleştirme XP kazandırır.</p></div>{!hasAccess && <div className="contextual-lock"><LockKeyhole size={17} /><span>Bu alan öğrenci programına dahildir.</span><Link href="/program">Programa gir</Link></div>}</div><div className="contextual-grid">{contextualExercises.map(exercise => { const answer = placed[exercise.id]; const saved = completed.get(exercise.id); const isCorrect = saved?.correct ?? (answer === exercise.word); return <article key={exercise.id} className={saved ? "is-completed" : ""}><span className="contextual-number">{exercise.title}</span><h3>{exercise.story}</h3><p>{exercise.sentence.replace("___", "")}{" "}<button className={`word-drop ${answer ? "has-word" : ""} ${saved ? (saved.correct ? "is-correct" : "is-wrong") : ""}`} disabled={!hasAccess || Boolean(saved)} onDragOver={event => event.preventDefault()} onDrop={event => onDrop(event, exercise.id)}>{answer ?? "kelimeyi buraya bırak"}</button></p><div className="word-choice-row">{exercise.options.map(option => <button key={option} draggable={hasAccess && !saved} onDragStart={event => event.dataTransfer.setData("text/plain", option)} onClick={() => hasAccess && !saved && setChoice(exercise.id, option)} className={answer === option ? "is-picked" : ""} disabled={!hasAccess || Boolean(saved)}>{option}</button>)}</div>{hasAccess && !saved && <Button size="sm" variant="outline" disabled={!answer || saveResult.isPending} onClick={() => saveResult.mutate({ exerciseId: exercise.id, correct: answer === exercise.word })}>Yanıtı kontrol et</Button>}{saved && <small className={saved.correct ? "correct-note" : "wrong-note"}>{saved.correct ? <><CheckCircle2 size={14} /> Doğru yerleştirdin · +6 XP</> : "Bu kez olmadı; hikâyeyi tekrar oku ve yarın yeniden dene."}</small>}</article>; })}</div></section><section className="abbreviation-section"><div><p className="section-label">GÜNLÜK KISALTMALAR</p><h2>Duyduğunu tanı.<br />Yerinde kullan.</h2><p>Bu ifadelerin çoğu samimi konuşma veya mesajlaşma içindir. Akademik yazı ve resmî e-postalarda tam biçimlerini tercih et.</p></div><div className="abbreviation-list">{abbreviations.map(([short, full, note]) => <article key={short}><strong>{short}</strong><span>{full}</span><p>{note}</p></article>)}</div></section></main></div>;
}
