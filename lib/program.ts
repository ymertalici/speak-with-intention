export type PromptCategory = "Konuşma" | "Düzeltme" | "Kelime" | "Sınav";

export type PracticePrompt = {
  id: string;
  category: PromptCategory;
  title: string;
  description: string;
  body: string;
};

export type ProgramWeek = {
  number: number;
  label: string;
  title: string;
  focus: string;
  goal: string;
  duration: string;
  vocabulary: { word: string; meaning: string; example: string }[];
  exercises: { id: string; title: string; description: string; duration: string }[];
  task: { title: string; description: string; outcome: string };
  prompts: PracticePrompt[];
};

const speakingPrompt = (topic: string, level = "A2-B1") => `You are my English speaking practice partner.
My level is ${level}. Today's topic is ${topic}.
Ask me one question at a time and wait for my answer.
Respond naturally and keep the conversation moving.
Do not correct me, rewrite my sentences, or interrupt my flow while we are talking.
Only when I say "conversation finished", give feedback in this order:
1. two things I did well,
2. up to five important corrections with natural alternatives,
3. three useful phrases from our conversation,
4. one short next practice task.
Use simple English. Do not claim to assess pronunciation from text.`;

const correctionPrompt = `Act as a supportive English teacher.
Correct my paragraph without changing my meaning.
Show the result in three parts:
1. My original text,
2. A corrected version,
3. Three short explanations of the most important mistakes.
My level is A2-B1, so keep the explanations simple.
Do not rewrite the text in advanced English.`;

const vocabularyPrompt = (words: string) => `Help me practise these English words: ${words}.
Ask me to make one sentence with one word at a time.
If my sentence is understandable, praise the meaning first.
Then give one correction or a more natural alternative.
Use examples appropriate for an A2-B1 learner.`;

const testPrompt = (topic: string) => `Give me a short English speaking test for an A2-B1 learner.
Ask five questions about ${topic}.
Ask one question at a time and wait for my answer.
Do not interrupt me with corrections during the test.
Only after I say "test finished", evaluate my full conversation under these headings:
1. clarity,
2. vocabulary,
3. grammar,
4. fluency.
Give one specific improvement task for each weak area.
Do not claim to measure pronunciation precisely from text.`;

export const programWeeks: ProgramWeek[] = [
  {
    number: 1,
    label: "Temelini kur",
    title: "Kendini net anlat",
    focus: "Kim olduğun, günün ve alışkanlıkların",
    goal: "Hafta sonunda günlük rutinini iki dakika boyunca rahatça anlatabileceksin.",
    duration: "Günde 10–15 dk",
    vocabulary: [
      { word: "usually", meaning: "genellikle", example: "I usually study in the evening." },
      { word: "currently", meaning: "şu anda", example: "I am currently preparing for university." },
      { word: "prefer", meaning: "tercih etmek", example: "I prefer quiet places to study." },
      { word: "routine", meaning: "rutin", example: "My morning routine is simple." },
      { word: "spend time", meaning: "zaman geçirmek", example: "I spend time with my friends at weekends." },
      { word: "especially", meaning: "özellikle", example: "I especially enjoy learning languages." },
    ],
    exercises: [
      { id: "w1-routine", title: "Cümle iskeletini kur", description: "Rutinini anlatan altı kısa cümleyi tamamla.", duration: "8 dk" },
      { id: "w1-voice", title: "60 saniyelik ses kaydı", description: "Kendini ve gününü doğal bir akışla anlat.", duration: "10 dk" },
      { id: "w1-revise", title: "Bir cümleyi iyileştir", description: "Kayıttan seçtiğin bir cümleyi daha doğal hâle getir.", duration: "5 dk" },
    ],
    task: {
      title: "Haftalık görev: Benim günüm",
      description: "Telefonuna 90–120 saniyelik bir ses kaydı al. Kendini, günlük rutinini ve bir sevdiğin alışkanlığı anlat.",
      outcome: "Kayıt sonunda en az üç yeni kalıbı bilinçli biçimde kullanmış ol.",
    },
    prompts: [
      { id: "w1-speaking", category: "Konuşma", title: "Günlük rutin sohbeti", description: "Tek tek sorularla konuşma akışı başlatır.", body: speakingPrompt("daily routines and personal habits") },
      { id: "w1-correction", category: "Düzeltme", title: "Kısa metin düzeltme", description: "Anlamını koruyarak en önemli hataları açıklar.", body: correctionPrompt },
      { id: "w1-words", category: "Kelime", title: "Kelimeyi cümlede kullan", description: "Bu haftanın kelimelerini aktif kullanımda çalıştırır.", body: vocabularyPrompt("usually, currently, prefer, routine, spend time, especially") },
      { id: "w1-test", category: "Sınav", title: "Hafta sonu mini sınavı", description: "Dört başlıkta net bir değerlendirme sunar.", body: testPrompt("your daily routine and personal interests") },
    ],
  },
  {
    number: 2,
    label: "Hikâye anlat",
    title: "Geçmişini canlandır",
    focus: "Deneyimler, anılar ve küçük hikâyeler",
    goal: "Hafta sonunda geçmişte yaşadığın bir olayı başlangıç, gelişme ve sonuçla anlatabileceksin.",
    duration: "Günde 10–15 dk",
    vocabulary: [
      { word: "recently", meaning: "yakın zamanda", example: "I recently visited my cousin." },
      { word: "suddenly", meaning: "aniden", example: "Suddenly, it started to rain." },
      { word: "realize", meaning: "fark etmek", example: "I realized that I had my phone." },
      { word: "decide", meaning: "karar vermek", example: "We decided to go home." },
      { word: "memorable", meaning: "unutulmaz", example: "It was a memorable day." },
      { word: "luckily", meaning: "neyse ki", example: "Luckily, we found the address." },
    ],
    exercises: [
      { id: "w2-timeline", title: "Olay çizgisi oluştur", description: "Bir anını önce, sonra ve sonuç bölümlerine ayır.", duration: "7 dk" },
      { id: "w2-past", title: "Geçmiş zaman seçimi", description: "Altı fiili hikâyene uygun geçmiş zamanda kullan.", duration: "8 dk" },
      { id: "w2-story", title: "Hikâyeyi seslendir", description: "İki dakikalık anı anlatımını kaydet.", duration: "10 dk" },
    ],
    task: {
      title: "Haftalık görev: Küçük ama unutulmaz bir an",
      description: "Seni gülümseten veya şaşırtan bir olayı anlat. En az iki bağlaç kullan: first, then, because, finally.",
      outcome: "Dinleyen kişi olayın sırasını kolayca takip edebilsin.",
    },
    prompts: [
      { id: "w2-speaking", category: "Konuşma", title: "Anı anlatma sohbeti", description: "Hikâyeni derinleştiren takip soruları sorar.", body: speakingPrompt("a recent memorable experience") },
      { id: "w2-correction", category: "Düzeltme", title: "Hikâye düzeltme", description: "Geçmiş zaman ve bağlaç kullanımına odaklanır.", body: correctionPrompt },
      { id: "w2-words", category: "Kelime", title: "Hikâye kelimeleri", description: "Yeni kelimelerle kendi cümlelerini kurdurur.", body: vocabularyPrompt("recently, suddenly, realize, decide, memorable, luckily") },
      { id: "w2-test", category: "Sınav", title: "Geçmiş deneyim sınavı", description: "Hikâye anlatımını ölçer.", body: testPrompt("a past experience that you remember well") },
    ],
  },
  {
    number: 3,
    label: "Fikrini savun",
    title: "Tercihlerini gerekçelendir",
    focus: "Planlar, fikirler ve nedenler",
    goal: "Hafta sonunda bir tercihini açıkça söyleyip en az iki gerekçeyle destekleyebileceksin.",
    duration: "Günde 10–15 dk",
    vocabulary: [
      { word: "in my opinion", meaning: "bence", example: "In my opinion, online learning is useful." },
      { word: "rather", meaning: "tercihen", example: "I would rather study at home." },
      { word: "although", meaning: "-e rağmen", example: "Although it is hard, I enjoy it." },
      { word: "benefit", meaning: "fayda", example: "One benefit is flexibility." },
      { word: "challenge", meaning: "zorluk", example: "Time management is a challenge." },
      { word: "likely", meaning: "muhtemelen", example: "I will likely choose this option." },
    ],
    exercises: [
      { id: "w3-opinion", title: "Görüşünü seç", description: "İki seçenek arasından tercihini ve nedenini yaz.", duration: "6 dk" },
      { id: "w3-reasons", title: "Neden zinciri kur", description: "Bir fikri because, but ve although ile genişlet.", duration: "8 dk" },
      { id: "w3-debate", title: "Mini fikir konuşması", description: "Bir konu hakkında iki dakikalık konuşma yap.", duration: "10 dk" },
    ],
    task: {
      title: "Haftalık görev: Ben olsam…",
      description: "Bir üniversite öğrencisinin şehir dışında mı, ailesiyle mi yaşaması gerektiği hakkında fikrini paylaş.",
      outcome: "Fikrini, iki sebebini ve küçük bir karşı görüşü içeren akıcı bir konuşma kaydet.",
    },
    prompts: [
      { id: "w3-speaking", category: "Konuşma", title: "Fikir geliştirme sohbeti", description: "Cevabının nedenlerini açmanı sağlar.", body: speakingPrompt("preferences, plans and opinions") },
      { id: "w3-correction", category: "Düzeltme", title: "Görüş metni düzeltme", description: "Anlatım netliğine ve bağlaçlara odaklanır.", body: correctionPrompt },
      { id: "w3-words", category: "Kelime", title: "Fikir kelimeleri", description: "Görüş bildirirken aktif kelime pratiği yaptırır.", body: vocabularyPrompt("in my opinion, rather, although, benefit, challenge, likely") },
      { id: "w3-test", category: "Sınav", title: "Tercih ve plan sınavı", description: "Görüşünü gerekçelendirme becerini ölçer.", body: testPrompt("your preferences and future plans") },
    ],
  },
  {
    number: 4,
    label: "Akışa güven",
    title: "Kendini özgürce ifade et",
    focus: "Birleştirme, yansıtma ve kişisel akıcılık",
    goal: "Hafta sonunda tanıdık bir konuda üç dakikalık daha akıcı ve doğal bir konuşma yapabileceksin.",
    duration: "Günde 10–15 dk",
    vocabulary: [
      { word: "to be honest", meaning: "dürüst olmak gerekirse", example: "To be honest, I was nervous." },
      { word: "as a result", meaning: "sonuç olarak", example: "As a result, I felt more confident." },
      { word: "improve", meaning: "geliştirmek", example: "I want to improve my fluency." },
      { word: "confident", meaning: "özgüvenli", example: "I feel more confident now." },
      { word: "continue", meaning: "devam etmek", example: "I will continue practising every day." },
      { word: "notice", meaning: "fark etmek", example: "I noticed a real change in my speaking." },
    ],
    exercises: [
      { id: "w4-compare", title: "Başlangıçla karşılaştır", description: "İlk haftadaki kaydını dinle ve üç gelişimini not et.", duration: "8 dk" },
      { id: "w4-bridge", title: "Fikirleri bağla", description: "Kısa cümleleri doğal bağlaçlarla tek akışa dönüştür.", duration: "7 dk" },
      { id: "w4-final", title: "Final kaydı", description: "Üç dakikalık kişisel konuşmanı kaydet.", duration: "12 dk" },
    ],
    task: {
      title: "Haftalık görev: Bir ay sonra ben",
      description: "Bu dört haftada ne öğrendiğini, nelerin kolaylaştığını ve sıradaki hedefini anlat.",
      outcome: "Konuşmanda geçmiş, bugün ve gelecekten doğal biçimde söz et.",
    },
    prompts: [
      { id: "w4-speaking", category: "Konuşma", title: "Akıcılık sohbeti", description: "Daha uzun cevaplar vermeni teşvik eder.", body: speakingPrompt("your learning journey, progress and next goals") },
      { id: "w4-correction", category: "Düzeltme", title: "Final metni düzeltme", description: "Tekrarlayan kalıpları ve önemli hataları fark ettirir.", body: correctionPrompt },
      { id: "w4-words", category: "Kelime", title: "Yansıtma kelimeleri", description: "Gelişimini ifade eden cümleler kurdurur.", body: vocabularyPrompt("to be honest, as a result, improve, confident, continue, notice") },
      { id: "w4-test", category: "Sınav", title: "Final konuşma sınavı", description: "Dört haftalık gelişimini yapıcı biçimde değerlendirir.", body: testPrompt("your English learning journey and your next goals") },
    ],
  },
];

export const totalTaskCount = programWeeks.reduce((total, week) => total + week.exercises.length + 1, 0);
