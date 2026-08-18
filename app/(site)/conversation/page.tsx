"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PendingAccessGate, SignInGate } from "@/components/AccessGate";
import { AIChatBox } from "@/components/AIChatBox";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, Clipboard, Loader2, MessageCircle, Mic, MicOff, Sparkles, Volume2 } from "lucide-react";

type RecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEventLike = { resultIndex: number; results: ArrayLike<RecognitionResultLike> };
type RecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((event: RecognitionEventLike) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
type RecognitionConstructor = new () => RecognitionLike;
type ConversationMessage = { role: "user" | "assistant"; content: string };

const starter = `You are my English conversation partner. My level is A2-B1. Let me speak freely and do not correct or interrupt me during the conversation. Ask one natural follow-up question at a time. When I say "conversation finished", give me a short end-of-conversation review with: 1) my strengths, 2) up to five priority corrections, 3) more natural alternatives, and 4) one next practice task. Do not judge pronunciation from text.`;
const suggestedOpeners = ["Hi! I want to talk about my day.", "Can we practise ordering food at a restaurant?", "I want to tell you about my weekend."];

export default function ConversationLab() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";

  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const review = trpc.program.reviewConversation.useMutation({ onError: error => toast.error(error.message) });
  const [reviewProgress, setReviewProgress] = useState(0);
  useEffect(() => {
    if (!review.isPending) { setReviewProgress(0); return; }
    const start = Date.now();
    setReviewProgress(4);
    const interval = window.setInterval(() => {
      setReviewProgress(Math.min(94, 6 + Math.round(((Date.now() - start) / 8000) * 88)));
    }, 250);
    return () => window.clearInterval(interval);
  }, [review.isPending]);
  const [transcript, setTranscript] = useState("");
  const [focus, setFocus] = useState<"everyday" | "fluency" | "grammar" | "vocabulary">("everyday");
  const [recording, setRecording] = useState(false);
  const [workspace, setWorkspace] = useState<"chat" | "transcript">("chat");
  const [chatMessages, setChatMessages] = useState<ConversationMessage[]>([]);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const chat = trpc.program.conversationChat.useMutation({
    onError: error => toast.error(error.message),
    onSuccess: result => setChatMessages(current => [...current, { role: "assistant", content: result.reply }]),
  });

  if (loading || false) return <main className="loading-page"><Loader2 className="animate-spin" /> Hazırlanıyor…</main>;
  if (!isAuthenticated) return <SignInGate />;
  if (!programStatus.data?.hasAccess) return <PendingAccessGate />;

  const copyStarter = async () => {
    await navigator.clipboard.writeText(starter);
    toast.success("Konuşma komutu kopyalandı.");
  };
  const speakText = (text: string) => {
    if (!text.trim()) return toast.error("Önce okunacak bir İngilizce metin ekle.");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  };
  const speakTranscript = () => speakText(transcript);
  const speakLastPartnerReply = () => {
    const lastReply = [...chatMessages].reverse().find(message => message.role === "assistant");
    if (!lastReply) return toast.error("Önce AI’dan bir yanıt al.");
    speakText(lastReply.content);
  };
  const toggleDictation = () => {
    if (recording) { recognitionRef.current?.stop(); return; }
    const browserWindow = window as Window & typeof globalThis & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Recognition) return toast.error("Tarayıcın bu konuşmayı yazıya dökme özelliğini desteklemiyor. Metni elle ekleyebilirsin.");
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = event => {
      let nextText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index]?.isFinal) nextText += ` ${event.results[index][0].transcript}`;
      }
      if (nextText) setTranscript(current => `${current}${nextText}`.trim());
    };
    recognition.onend = () => setRecording(false);
    recognition.onerror = () => { setRecording(false); toast.error("Konuşma yazıya dökülemedi. Metni düzenleyerek devam edebilirsin."); };
    recognition.start();
    setRecording(true);
  };
  const sendChatMessage = (content: string) => {
    const nextMessages: ConversationMessage[] = [...chatMessages, { role: "user", content }];
    setChatMessages(nextMessages);
    chat.mutate({ messages: nextMessages, focus });
  };
  const finishAiConversation = () => {
    if (chatMessages.length < 2) return toast.error("Önce AI ile en az bir mesaj alışverişi yap.");
    setTranscript(chatMessages.map(message => `${message.role === "user" ? "Learner" : "AI partner"}: ${message.content}`).join("\n"));
    setWorkspace("transcript");
    toast.success("Sohbet dökümü inceleme alanına aktarıldı.");
  };

  const feedback = review.data;
  return <div className="conversation-page"><AppHeader /><main className="container conversation-main">
    <section className="conversation-hero"><div><p className="section-label">KONUŞMA LABORATUVARI</p><h1>Konuş. Durmadan.<br /><em>Sonra</em> birlikte bak.</h1><p>AI ile burada İngilizce sohbet edebilir veya iki kişinin mevcut konuşma dökümünü inceletebilirsin. Geri bildirim yalnızca sohbet bittiğinde gelir.</p></div><aside><Sparkles size={18} /><strong>Akış kuralı</strong><span>Geri bildirim yalnızca sohbet bittikten sonra gelir.</span></aside></section>
    <section className="conversation-grid"><div className="transcript-card"><div className="conversation-mode-switch" role="tablist" aria-label="Konuşma çalışma biçimi"><button type="button" role="tab" aria-selected={workspace === "chat"} className={workspace === "chat" ? "is-selected" : ""} onClick={() => setWorkspace("chat")}><MessageCircle size={15} /> AI ile konuş</button><button type="button" role="tab" aria-selected={workspace === "transcript"} className={workspace === "transcript" ? "is-selected" : ""} onClick={() => setWorkspace("transcript")}><Clipboard size={15} /> Dökümü incele</button></div>
      {workspace === "chat" ? <div className="live-chat-workspace"><div className="panel-head"><div><p className="section-label">01 · CANLI PRATİK</p><h2>AI partnerinle İngilizce konuş.</h2></div><span>{chatMessages.filter(message => message.role === "user").length} mesaj</span></div><p className="live-chat-intro">AI, konuşma akarken seni düzeltmez. Sohbet bittiğinde dökümü tek tıkla incelemeye gönderirsin.</p><AIChatBox messages={chatMessages} onSendMessage={sendChatMessage} isLoading={chat.isPending} height="420px" className="live-conversation-chat" placeholder="İngilizce mesajını yaz…" emptyStateMessage="İngilizce bir konu aç; AI partnerin doğal bir soruyla devam etsin." suggestedPrompts={suggestedOpeners} /><div className="live-chat-tools"><Button type="button" variant="outline" onClick={speakLastPartnerReply} disabled={!chatMessages.some(message => message.role === "assistant")}><Volume2 size={16} /> Son AI yanıtını dinle</Button><Button type="button" className="button-ink" onClick={finishAiConversation} disabled={chatMessages.length < 2 || chat.isPending}><Sparkles size={16} /> Sohbeti bitir, dökümü incele</Button></div></div> : <><div className="panel-head"><div><p className="section-label">01 · DÖKÜM</p><h2>Konuşmanı buraya getir.</h2></div><span>{transcript.length}/10000</span></div><textarea value={transcript} onChange={event => setTranscript(event.target.value)} maxLength={10000} placeholder="İki kişinin İngilizce konuşmasını yapıştır veya mikrofonla yazıya dök. Örnek: A: Hi, how was your day? B: It was busy, but..." /><div className="voice-tools"><Button type="button" variant="outline" onClick={toggleDictation}>{recording ? <MicOff size={16} /> : <Mic size={16} />}{recording ? "Yazıya dökmeyi bitir" : "Konuşarak ekle"}</Button><Button type="button" variant="outline" onClick={speakTranscript}><Volume2 size={16} /> Metni sesli oku</Button></div><p className="privacy-note">Yalnızca paylaşma iznin olan konuşmaları kullan. AI sohbetini bitirdiğinde dökümün buraya otomatik gelir; istersen düzenleyebilirsin.</p></>}</div>
      <div className="review-card"><div><p className="section-label">02 · ODAK</p><h2>Bugün neyi fark etmek istiyorsun?</h2></div><div className="focus-list">{([ ["everyday", "Doğal günlük iletişim"], ["fluency", "Akıcılık ve bağlama"], ["grammar", "Önemli dilbilgisi"], ["vocabulary", "Aktif kelime kullanımı"] ] as const).map(([value, label]) => <button key={value} className={focus === value ? "is-selected" : ""} onClick={() => setFocus(value)}>{focus === value && <CheckCircle2 size={15} />}{label}</button>)}</div><Button className="button-ink review-action" disabled={transcript.trim().length < 80 || review.isPending} onClick={() => review.mutate({ transcript, focus })}>{review.isPending ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}{review.isPending ? "Konuşma inceleniyor…" : "Sohbet bitince analiz et"}</Button>{review.isPending && <div className="coach-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={reviewProgress}><span className="coach-progress-bar" style={{ width: `${reviewProgress}%` }} /><span className="coach-progress-label">İnceleniyor… %{reviewProgress}</span></div>}<p className="review-helper">AI ile sohbet ettiysen önce soldaki “Sohbeti bitir” düğmesiyle dökümü bu alana aktar.</p><div className="prompt-mini"><span>HATANIN KÖK NEDENİ</span><p>Her cümledeki zaman, kelime seçimi veya akış sorununu kuralıyla görmek istersen dökümü doğrudan AI Dil Koçu’na gönder.</p><div className="coach-transfer-row"><Button type="button" variant="outline" size="sm" disabled={transcript.trim().length < 80 || review.isPending} onClick={() => { window.open(`/coach?transcript=${encodeURIComponent(transcript)}`, "_blank"); toast.success("Döküm AI Dil Koçu’na aktarıldı."); }}><Sparkles size={15} /> Dökümü AI Dil Koçu’na götür</Button><Link href="/coach" className="coach-inline-link">Ya da boş aç</Link></div></div><div className="prompt-mini"><span>HARİCÎ AI İLE ÇALIŞMAK</span><p>Farklı bir AI aracında konuşmak istersen bu komut, sohbet boyunca düzeltme yapılmasını engeller.</p><Button variant="outline" size="sm" onClick={copyStarter}><Clipboard size={15} /> Akış komutunu kopyala</Button></div></div></section>
    {feedback && <section className="feedback-area"><div className="feedback-intro"><p className="section-label">SENİN KONUŞMA NOTUN</p><h2>{feedback.overall}</h2><div className="strength-chips">{feedback.strengths.map(strength => <span key={strength}>{strength}</span>)}</div></div><div className="feedback-columns"><article><p className="section-label">ÖNCELİKLİ DÜZELTMELER</p>{feedback.priorityCorrections.length ? feedback.priorityCorrections.map(item => <div className="correction-item" key={`${item.said}-${item.improved}`}><span>Senin cümlen</span><del>{item.said}</del><strong>{item.improved}</strong><p>{item.why}</p><small>Tekrar et: {item.practice}</small></div>) : <p>Bu konuşmada öncelikli bir düzeltme seçilmedi. Akışını koruyarak devam et.</p>}</article><article><p className="section-label">CEBİNE AT</p>{feedback.usefulPhrases.map(item => <div className="phrase-item" key={item.phrase}><strong>{item.phrase}</strong><p>{item.reason}</p></div>)}<div className="next-prompt"><span>SIRADAKİ PRATİK</span><p>{feedback.nextConversationPrompt}</p></div></article></div></section>}
  </main></div>;
}
