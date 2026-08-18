"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Clock3, Mail, MessageCircleMore, ShieldCheck } from "lucide-react";

const faqs = [
  ["Program kimler için uygun?", "Program A2–B1 seviyesinde, temel İngilizce bilgisi olan fakat konuşurken kendini rahat ifade etmek isteyen öğrenciler için tasarlanmıştır."],
  ["Her gün ne kadar zaman ayırmalıyım?", "Her gün 10–15 dakika ayırman yeterli. Haftalık görev için ek olarak 10–15 dakikalık bir ses kaydı veya kısa konuşma çalışması planlanır."],
  ["AI komutlarını hangi araçta kullanabilirim?", "Komutlar, metinle sohbet edebilen yaygın yapay zekâ araçlarında kullanılmak üzere yazılmıştır. Komutu kopyalayıp tercih ettiğin araca yapıştırman yeterlidir."],
  ["Yapay zekânın her düzeltmesi kesin doğru mu?", "Hayır. Yapay zekâ yararlı bir pratik arkadaşıdır; ancak zaman zaman hatalı veya seviyene uygun olmayan öneriler verebilir. Programdaki örnekleri ve haftalık hedefleri ana referans olarak kullan."],
  ["Kişisel ses kaydı geri bildirimi var mı?", "Konuşma Laboratuvarı, tamamlanmış bir konuşma dökümü üzerinden otomatik geri bildirim verir. Daha ayrıntılı birebir konuşma pratiği için ücretli birebir konuşma dersi hakkında e-posta ile bilgi alabilirsin."],
  ["Birebir online konuşma dersi var mı?", "Evet. Programdan bağımsız, ücretli online sesli İngilizce konuşma seansları için seviyeni ve hedefini kısaca yazarak iletişime geçebilirsin."],
  ["Erişimim görünmüyor; ne yapmalıyım?", "Önce Manus hesabınla giriş yaptığından emin ol. Erişim durumun hâlâ bekliyorsa destek kanalından adını ve kayıt e-postanı paylaş."],
];

export default function Support() {
  return <div className="support-page"><AppHeader /><main className="container support-main">
    <section className="support-hero"><p className="section-label">DESTEK MERKEZİ</p><h1>Çalışmana alan aç.<br /><em>Sorularını</em> netleştir.</h1><p>Programın düzenini korumak için destek kapsamı ve sınırları baştan açık. Böylece sen ne bekleyeceğini, eğitmenin de nasıl yardımcı olacağını bilir.</p></section>
    <section className="support-rule-grid"><article><Clock3 size={21} /><span>Yanıt düzeni</span><h2>Belirlenmiş zamanlarda</h2><p>Sorular, haftada iki sabit yanıt penceresinde toplanır ve cevaplanır. Anlık mesaj desteği sunulmaz.</p></article><article><MessageCircleMore size={21} /><span>Doğru kanal</span><h2>Tek konu, tek mesaj</h2><p>Teknik sorun veya programla ilgili sorunu açık ve kısa biçimde ilet. Aynı konu için ayrı mesaj zincirleri açma.</p></article><article><ShieldCheck size={21} /><span>Program sınırı</span><h2>Birebir ders değil</h2><p>Bu alan, yönlendirilmiş öz çalışma programıdır. Kişiye özel ayrıntılı öğretim veya sınırsız geri bildirim içermez.</p></article></section>
    <section className="faq-section"><div><p className="section-label">SIK SORULAN SORULAR</p><h2>Aradığın cevap<br />burada olabilir.</h2><p>Programın çalışma biçimi, AI kullanımı ve erişim hakkında temel açıklamalar.</p></div><Accordion type="single" collapsible className="faq-accordion">{faqs.map(([question, answer], index) => <AccordionItem key={question} value={`faq-${index}`}><AccordionTrigger>{question}</AccordionTrigger><AccordionContent>{answer}</AccordionContent></AccordionItem>)}</Accordion></section>
    <section className="contact-strip"><Mail size={23} /><div><strong>Erişim, teknik destek veya birebir ders mi gerekiyor?</strong><p>Adını, kayıtlı e-posta adresini ve konunu kısa biçimde yaz. Birebir konuşma dersi için hedefini ve uygun olduğun zaman aralığını ekleyebilirsin.</p></div><a href="mailto:ymertalici@gmail.com">ymertalici@gmail.com <ArrowRight size={16} /></a></section>
    <p className="support-signoff">Yusuf Mert Alıcı tarafından tasarlanan bu çalışma alanı, pratik sistemini Manus ile geliştirmeye açık bir başlangıç noktasıdır.</p>
    <Link href="/program" className="back-home-link">Çalışma alanına git <ArrowRight size={16} /></Link>
  </main></div>;
}
