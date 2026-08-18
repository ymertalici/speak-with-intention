"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { PendingAccessGate, SignInGate } from "@/components/AccessGate";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, Mic2, PenLine, Sparkles } from "lucide-react";
import { useVoiceDictation } from "@/hooks/useVoiceDictation";

const categoryLabels: Record<string, string> = {
  grammar: "Dilbilgisi",
  wordChoice: "Kelime seçimi",
  wordOrder: "Kelime dizilişi",
  fluency: "Akıcılık",
  pronunciationCue: "Telaffuz ipucu",
};

const exampleText = "Yesterday I go to the library and I have met my friend there. We was studying for our exam, but I didn't understood the grammar question.";
const minimumTextLength = 12;

function useAnalysisProgress(isPending: boolean) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!isPending) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setProgress(0);
      return;
    }
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress(current => {
        if (current >= 95) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 95;
        }
        const step = current < 30 ? 12 : current < 60 ? 8 : current < 90 ? 3 : 1;
        return Math.min(95, current + step);
      });
    }, 350);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isPending]);
  useEffect(() => {
    if (!isPending && progress > 0 && progress < 100) setProgress(100);
  }, [isPending, progress]);
  return progress;
}

export default function LanguageCoach() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";

  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const analyse = trpc.learning.analyseLanguage.useMutation();
  const [mode, setMode] = useState<"writing" | "speechTranscript">("writing");
  const [text, setText] = useState(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams("");
    const transferred = params.get("transcript");
    if (transferred && transferred.length >= minimumTextLength) return transferred;
    return "";
  });
  const [showArchive, setShowArchive] = useState(false);
  const [viewingRecordId, setViewingRecordId] = useState<number | null>(null);
  const history = trpc.learning.practiceHistory.useQuery(undefined, { enabled: isAuthenticated && showArchive });

  if (loading || false) return <div className="coach-page"><AppHeader /><main className="container coach-main coach-intro-state"><section className="coach-hero"><div><p className="section-label">AI DİL KOÇU</p><h1>Metnini bir<br /><em>koçla</em> incele.</h1><p>İngilizce yazını ya da konuşma dökümünü tamamla. Koç, seni bölmeden metnin sonrasında hata nedenlerini, düzeltme adımlarını ve tekrar cümlelerini çıkarır.</p></div><aside><Sparkles size={18} /><strong>Analiz alanın hazırlanıyor.</strong><span>Hesap ve program erişimi kontrol edilirken çalışma biçimini görebilirsin.</span></aside></section><section className="coach-intro-card grid grid-cols-1 gap-8 rounded-[18px] bg-[#1d2a38] p-7 text-[#f8f5ee] shadow-[0_22px_55px_rgba(25,36,49,.16)] md:grid-cols-[1.3fr_.7fr] md:p-10"><div><p className="section-label !text-[#e5ae8b]">SONUÇTA NE ALIRSIN?</p><h2 className="mt-4 text-[clamp(32px,4vw,52px)] font-semibold leading-[.98] tracking-[-.06em]">Hatanın adı değil,<br />nedenini öğrenirsin.</h2><ul className="mt-7 grid gap-3 border-t border-white/15 pt-6 text-sm leading-6 text-[#d9d4ca]"><li>Yazdığın özgün cümle ve daha doğal düzeltmesi</li><li>Kuralın metin içindeki bağlamla uzun açıklaması</li><li>Adım adım uygulama ve hemen söyleyebileceğin yeni cümle</li></ul></div><div className="flex min-h-36 items-center justify-center gap-3 rounded-[14px] border border-white/15 bg-white/5 p-6 text-center text-sm leading-6 text-[#e7e1d7]"><Loader2 className="h-5 w-5 animate-spin text-[#e5ae8b]" /><span>{loading ? "Giriş durumun kontrol ediliyor…" : "Program erişimin hazırlanıyor…"}</span></div></section></main></div>;
  if (!isAuthenticated) return <SignInGate />;
  if (!programStatus.data?.hasAccess) return <PendingAccessGate />;

  const progress = useAnalysisProgress(analyse.isPending);
  const feedback = analyse.data;
  const submit = () => {
    const submittedText = text.trim();
    if (submittedText.length < minimumTextLength) return;
    analyse.mutate({ text: submittedText, mode });
  };
  const loadExample = () => {
    analyse.reset();
    setMode("writing");
    setText(exampleText);
  };
  const archivedAnalyses = (history.data ?? []).filter(record => record.type === "Yazı / döküm analizi");
  const { isRecording, unsupported, startRecording, stopRecording } = useVoiceDictation((draft, isFinal) => {
    setText(current => {
      const separator = current.length > 0 && !current.endsWith(" ") && !current.endsWith("\n") ? " " : "";
      return isFinal ? current + separator + draft : current;
    });
  });

  return <div className="coach-page"><AppHeader /><main className="container coach-main">
    <section className="coach-hero"><div><p className="section-label">AI DİL KOÇU</p><h1>Hata değil,<br /><em>sebep</em> bul.</h1><p>Bir paragrafını veya konuşma dökümünü gönder. Koç, sohbet bittikten sonra dilbilgisi hatalarının kök nedenini, doğru biçimi, uygulama adımlarını ve sana özel tekrar görevini çıkarır.</p></div><aside><Sparkles size={18} /><strong>Akış bozulmaz.</strong><span>Geri bildirim yalnızca metnin tamamlandıktan sonra gelir.</span></aside></section>
    <section className="coach-workspace"><article><div className="coach-toggle"><button className={mode === "writing" ? "is-selected" : ""} onClick={() => setMode("writing")}><PenLine size={15} /> Yazı analizi</button><button className={mode === "speechTranscript" ? "is-selected" : ""} onClick={() => setMode("speechTranscript")}><Mic2 size={15} /> Konuşma dökümü</button></div><textarea value={text} onChange={event => setText(event.target.value)} placeholder={mode === "writing" ? "Kısa bir İngilizce cümle veya paragraf yaz. Örneğin: Yesterday I have gone to the library..." : "Konuşma laboratuvarından aldığın İngilizce dökümü buraya yapıştır."} maxLength={2800} />{!unsupported && <div className="dictation-row"><button type="button" className={"dictation-button" + (isRecording ? " is-recording" : "")} onClick={() => (isRecording ? stopRecording() : startRecording())} aria-pressed={isRecording}>{isRecording ? <Mic2 className="pulse-mic" size={15} /> : <Mic2 size={15} />}{isRecording ? "Dinliyorum… (durdur)" : "Mikrofonla yaz"}</button>{isRecording && <span className="dictation-hint">İngilizce konuş; söylediklerin metin alanına düşecek.</span>}</div>}{unsupported && !isRecording && <p className="dictation-unsupported">Bu tarayıcı dikteyi desteklemiyor; metni doğrudan yazabilirsin.</p>}<div className="coach-action-row"><p aria-live="polite">{text.trim().length}/2800 · {text.trim().length < minimumTextLength ? `Analiz için ${minimumTextLength - text.trim().length} karakter daha gerekli` : "Analize hazır"}</p><div className="coach-actions"><Button type="button" variant="outline" onClick={loadExample} disabled={analyse.isPending}>Örnek metni yükle</Button><Button className="button-ink" onClick={submit} disabled={text.trim().length < minimumTextLength || analyse.isPending}>{analyse.isPending ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}{analyse.isPending ? "Kök nedenler aranıyor…" : "Metni analiz et"}</Button></div></div></article><aside><p className="section-label">NASIL OKUR?</p><h3>1. Cümleyi görür.</h3><p>Önce söylediğin veya yazdığın biçimi ayırır.</p><h3>2. Sebebi açıklar.</h3><p>Kuralı, anlam farkını ve hatanın neden oluştuğunu örneğin üzerinden anlatır.</p><h3>3. Dönüştürür.</h3><p>Küçük uygulama adımları ve sana özel bir tekrar cümlesi verir.</p></aside></section>
    {analyse.isPending && <section className="coach-progress" aria-live="polite"><div className="progress-label"><strong>Analiz ilerlemesi</strong><span>%{progress}</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div><p className="progress-status">{progress < 40 ? "Metnin taranıyor ve hatalar ayrıştırılıyor…" : progress < 95 ? "Kök nedenler ve düzeltme adımları üretiliyor…" : "Son düzeltmeler toplanıyor…"}</p></section>}
    {analyse.error && <section className="coach-error" role="alert"><AlertCircle size={20} /><div><strong>Analiz henüz tamamlanamadı.</strong><p>{analyse.error.message}</p><Button variant="outline" size="sm" onClick={submit} disabled={analyse.isPending || text.trim().length < minimumTextLength}>Tekrar dene</Button></div></section>}
    <section className="coach-archive-toggle"><Button type="button" variant="outline" onClick={() => setShowArchive(current => !current)} disabled={analyse.isPending}>{showArchive ? "Kaydedilen analizleri gizle" : "Kaydedilen analizlerimi gör"}</Button>{archivedAnalyses.length > 0 && <span className="archive-count">{archivedAnalyses.length} kayıt</span>}</section>
    {showArchive && <section className="coach-archive" aria-live="polite">{archivedAnalyses.length === 0 ? <div className="archive-empty"><Loader2 className="animate-spin" /><span>Analizlerin yükleniyor…</span></div> : archivedAnalyses.map(record => <div className="archive-item" key={record.id}><div><p className="archive-meta">{new Date(record.createdAt).toLocaleString("tr-TR")} · {record.focus === "speechTranscript" ? "Konuşma dökümü" : "Yazı"}</p><p className="archive-text">{record.sourceText}</p></div><div className="archive-overview">{record.overview}</div><div className="archive-actions"><Button type="button" variant="outline" size="sm" onClick={() => setViewingRecordId(viewingRecordId === record.id ? null : record.id)}>{viewingRecordId === record.id ? "Ayrıntıyı kapat" : "Ayrıntılı incele"}</Button></div>{viewingRecordId === record.id && <div className="archive-detail"><p className="section-label">GÜÇLÜ YÖNLER</p><div className="strength-chips">{record.strengths.map(strength => <span key={strength}>{strength}</span>)}</div><p className="section-label mt-4">DÜZELTME ADIMLARI</p>{record.corrections.map((item, index) => <div className="diagnosis-item" key={`${item.before}-${index}`}><del>{item.before}</del><strong>{item.after}</strong><p>{item.reason}</p><small>Tekrar: {item.practice}</small></div>)}<p className="section-label mt-4">SIRADAKİ</p><p>{record.nextStep}</p><p className="archive-note">Bu analiz profilindeki arşivde de saklanıyor.</p></div>}</div>)}</section>}
    {feedback && <section className="language-feedback"><div className="feedback-intro"><p className="section-label">KOÇ NOTU</p><h2>{feedback.overview}</h2><div className="strength-chips">{feedback.strengths.map(strength => <span key={strength}><CheckCircle2 size={13} /> {strength}</span>)}</div></div><div className="diagnosis-grid"><article><p className="section-label">KÖK NEDENLER</p>{feedback.diagnoses.length ? feedback.diagnoses.map((item, index) => <div className="diagnosis-item diagnosis-detail" key={`${item.original}-${index}`}><span>{categoryLabels[item.category] ?? item.category}</span><del>{item.original}</del><strong>{item.correction}</strong><p className="diagnosis-root">{item.rootCause}</p><p className="diagnosis-explanation">{item.detailedExplanation}</p><small>{item.shortRule}</small><div className="repair-steps"><b>Nasıl düzeltirsin?</b><ol>{item.practicalSteps.map(step => <li key={step}>{step}</li>)}</ol></div><div className="retry-sentence"><ChevronRight size={15} /><span><b>Hemen dene:</b> {item.retrySentence}</span></div></div>) : <p>Bu metinde öne çıkan bir hata seçilmedi. Güçlü noktalarını koruyarak daha uzun bir metin dene.</p>}</article><article className="next-drill-card"><p className="section-label">BİR SONRAKİ TEKRAR</p><h3>{feedback.nextDrill}</h3><p>Bu çalışmayı yüksek sesle yapabilir veya Konuşma Laboratuvarı’na dönüp yeni bir döküm hazırlayabilirsin.</p></article></div></section>}
  </main></div>;
}
