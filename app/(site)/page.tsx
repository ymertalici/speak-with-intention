"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { programWeeks } from "@/lib/program";
import { ArrowDownRight, ArrowRight, Check, CirclePlay, Copy, MessageCircleMore, Mic, Sparkles, TimerReset, Volume2 } from "lucide-react";

const principles = [
  ["01", "Kısa ama düzenli", "Her gün yalnızca 10–15 dakikalık net bir adım."],
  ["02", "Yönlendirilmiş AI", "Hazır komutlar, seni boş ekranda bırakmaz."],
  ["03", "Görünen ilerleme", "İşaretle, yansıt ve kendi sesini duy."],
];

export default function Home() {
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const router = useRouter();
  const programStatus = trpc.program.status.useQuery(undefined, { enabled: isAuthenticated });
  const joinAction = () => {
    if (isAuthenticated) router.push("/program");
    else router.push("/login");
  };

  return (
    <div className="landing-page">
      <AppHeader dark />
      <main>
        <section className="hero-section">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-grid" />
          <div className="container hero-layout">
            <div className="hero-copy">
              <div className="hero-kicker"><span /> A2–B1 · 4 haftalık konuşma pratiği</div>
              <h1>İngilizceyi<br />daha çok bilmek<br />değil, <em>kullanmak.</em></h1>
              <p>Yapay zekâ ile kontrolsüzce vakit geçirmek yerine, her gün neyi ve nasıl çalışacağını bilen sakin bir konuşma rutini kur.</p>
              <div className="hero-ctas">
                <Button onClick={joinAction} className="button-copper button-xl">Programa katıl <ArrowRight size={17} /></Button>
                <a href="#program" className="watch-link"><CirclePlay size={18} /> Nasıl çalışır?</a>
              </div>
              {isAuthenticated && programStatus.data && (
                <p className="signed-in-note"><Check size={14} /> Giriş yapıldı · {programStatus.data.hasAccess ? "Çalışma alanın hazır" : "Erişim durumun bekliyor"}</p>
              )}
            </div>
            <div className="hero-object" aria-label="Dört haftalık program özeti">
              <div className="object-topline"><span>YOUR PRACTICE</span><span>04 WEEKS</span></div>
              <div className="object-center">
                <p>GOOD<br />THINGS<br />TAKE<br /><em>VOICE.</em></p>
              </div>
              <div className="object-progress"><span>Week 01</span><div><i /><i /><i /><i /></div><span>begin</span></div>
              <div className="floating-note"><Sparkles size={15} /> Bir sonraki adımın hazır.</div>
            </div>
          </div>
        </section>

        <section className="manifesto-section">
          <div className="container manifesto-grid">
            <p className="section-label">BU PROGRAM KİMİN İÇİN?</p>
            <div>
              <h2>Kelime biliyor ama cümle kurarken duruyorsan, burası senin için tasarlandı.</h2>
              <p className="large-copy">Her hafta tek bir konuşma amacı, küçük alıştırmalar ve düşünmeden kullanabileceğin AI komutları. Mükemmel olmaya değil, devam etmeye odaklanırsın.</p>
            </div>
          </div>
        </section>

        <section id="program" className="roadmap-section">
          <div className="container">
            <div className="section-heading">
              <div><p className="section-label">DÖRT HAFTALIK YOL</p><h2>Bir ay. Dört açık odak.</h2></div>
              <p>Her hafta bir öncekinin üzerine sakince eklenir. İçerik kısa kalır; alışkanlık kalıcılaşır.</p>
            </div>
            <div className="roadmap-list">
              {programWeeks.map(week => (
                <div className="roadmap-row" key={week.number}>
                  <span className="week-number">0{week.number}</span>
                  <span className="week-label">{week.label}</span>
                  <h3>{week.title}</h3>
                  <p>{week.focus}</p>
                  <span className="week-time"><TimerReset size={15} /> {week.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="practice-section">
          <div className="container practice-layout">
            <div className="practice-card">
              <div className="mini-window-head"><span /><span /><span /><b>AI PRACTICE</b></div>
              <p className="prompt-label">COPIED PROMPT</p>
              <pre>You are my English speaking practice partner. Ask me one question at a time and wait for my answer...</pre>
              <div className="mini-window-footer"><span><Check size={14} /> Simple English</span><button aria-label="Komutu kopyala"><Copy size={15} /></button></div>
            </div>
            <div className="practice-copy">
              <p className="section-label">YAPAY ZEKÂ, AMA YÖNSÜZ DEĞİL</p>
              <h2>Boş sohbet değil.<br /><em>Amaçlı</em> pratik.</h2>
              <p>Konuşma, düzeltme, kelime ve mini sınav için hazırlanan komutlar; seviyeni, çalışacağın konuyu ve geri bildirimin tonunu baştan belirler.</p>
              <div className="practice-tags"><span>Konuşma</span><span>Düzeltme</span><span>Kelime</span><span>Sınav</span></div>
            </div>
          </div>
        </section>

        <section className="conversation-teaser-section"><div className="container conversation-teaser"><div><p className="section-label">KONUŞMA LABORATUVARI</p><h2>Akışı bölme.<br /><em>Sohbetten sonra</em> fark et.</h2><p>İki kişinin konuşma dökümünü ekle veya destekleyen tarayıcılarda sesini yazıya dök. AI, seni konuşurken durdurmadan; sohbet bittiğinde önemli hatalarını, doğal alternatifleri ve sıradaki alıştırmanı toplar.</p><div className="teaser-actions"><Link href="/conversation" className="teaser-link"><Mic size={17} /> Konuşma alanını aç</Link><Link href="/vocabulary" className="teaser-link teaser-link-soft"><Volume2 size={17} /> Günlük kelimeleri çalış</Link></div></div><aside><span>CONVERSATION RULE</span><strong>Talk first.<br />Review <em>after.</em></strong><p>Akışını koru. Geri bildirim daha sonra gelsin.</p></aside></div></section>

        <section className="one-to-one-section"><div className="container one-to-one-card"><div><p className="section-label">BİREBİR SESLİ KONUŞMA</p><h2>Daha kişisel bir<br /><em>konuşma alanı</em> istersen.</h2><p>AI ile kurduğun rutini, Yusuf Mert Alıcı ile yapılacak ücretli birebir konuşma dersleriyle derinleştirebilirsin. Seviye, hedef ve uygun zaman için e-posta üzerinden bilgi al.</p></div><a href="mailto:ymertalici@gmail.com?subject=Birebir%20online%20İngilizce%20konu%C5%9Fma%20dersi%20hakk%C4%B1nda" className="one-to-one-link"><MessageCircleMore size={18} /> Birebir ders hakkında yaz</a></div></section>

        <section className="principles-section">
          <div className="container">
            <p className="section-label">SİSTEMİN MANTIĞI</p>
            <div className="principles-grid">
              {principles.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div className="container closing-card">
            <span className="closing-star">✦</span>
            <p className="section-label">BAŞLAMAK İÇİN HAZIRSIN</p>
            <h2>Sesin, çalıştıkça<br /><em>yerini bulur.</em></h2>
            <p>Dört haftalık sakin ve yönlendirilmiş konuşma yolculuğuna giriş yap.</p>
            <Button onClick={joinAction} className="button-copper button-xl">Çalışma alanıma git <ArrowDownRight size={17} /></Button>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="container"><span>Speak with Intention</span><span>Yusuf Mert Alıcı tarafından tasarlanmıştır · Vercel üzerinde barındırılmaktadır</span><Link href="/support">Destek & SSS</Link></div></footer>
    </div>
  );
}
