export type PlacementQuestion = {
  id: string;
  difficulty: 1 | 2 | 3 | 4;
  prompt: string;
  options: string[];
  correctIndex: number;
  skill: string;
};

export const placementQuestions: PlacementQuestion[] = [
  { id: "a1-01", difficulty: 1, prompt: "I ___ from Türkiye.", options: ["am", "is", "are", "be"], correctIndex: 0, skill: "be fiili" },
  { id: "a1-02", difficulty: 1, prompt: "She ___ coffee every morning.", options: ["drink", "drinks", "drinking", "drank"], correctIndex: 1, skill: "geniş zaman" },
  { id: "a1-03", difficulty: 1, prompt: "There ___ two books on the table.", options: ["is", "are", "am", "be"], correctIndex: 1, skill: "there is / there are" },
  { id: "a1-04", difficulty: 1, prompt: "We don't have ___ milk.", options: ["some", "any", "many", "a"], correctIndex: 1, skill: "miktar ifadeleri" },
  { id: "a1-05", difficulty: 1, prompt: "My brother ___ a student.", options: ["are", "am", "is", "be"], correctIndex: 2, skill: "be fiili" },
  { id: "a1-06", difficulty: 1, prompt: "I usually ___ the bus to school.", options: ["take", "takes", "taking", "took"], correctIndex: 0, skill: "günlük rutin" },
  { id: "a1-07", difficulty: 1, prompt: "Can you ___ me with this bag?", options: ["help", "helps", "helping", "to help"], correctIndex: 0, skill: "can / rica" },
  { id: "a1-08", difficulty: 1, prompt: "The cinema is ___ the bank and the café.", options: ["between", "under", "behind", "from"], correctIndex: 0, skill: "yer edatları" },
  { id: "a1-09", difficulty: 1, prompt: "Which reply is most natural? 'How are you?'", options: ["I am twenty.", "I'm fine, thanks.", "I live in Ankara.", "It is Monday."], correctIndex: 1, skill: "günlük iletişim" },
  { id: "a1-10", difficulty: 1, prompt: "Read: 'The shop opens at nine.' What time can you go?", options: ["8:30", "9:00", "7:00", "midnight"], correctIndex: 1, skill: "okuma anlama" },
  { id: "a1-11", difficulty: 1, prompt: "I have ___ orange in my bag.", options: ["a", "an", "the", "some"], correctIndex: 1, skill: "artikeller" },
  { id: "a1-12", difficulty: 1, prompt: "We ___ watching a film now.", options: ["is", "am", "are", "be"], correctIndex: 2, skill: "şimdiki zaman" },
  { id: "a2-01", difficulty: 2, prompt: "I ___ my homework before dinner yesterday.", options: ["finish", "have finished", "finished", "was finish"], correctIndex: 2, skill: "geçmiş zaman" },
  { id: "a2-02", difficulty: 2, prompt: "If it ___ tomorrow, we will stay home.", options: ["rains", "rained", "will rain", "is raining"], correctIndex: 0, skill: "birinci koşul" },
  { id: "a2-03", difficulty: 2, prompt: "This jacket is ___ than that one.", options: ["more cheap", "cheaper", "cheap", "the cheapest"], correctIndex: 1, skill: "karşılaştırmalar" },
  { id: "a2-04", difficulty: 2, prompt: "Have you ever ___ to London?", options: ["go", "went", "been", "going"], correctIndex: 2, skill: "present perfect" },
  { id: "a2-05", difficulty: 2, prompt: "I was cooking when my friend ___.", options: ["calls", "called", "was calling", "has called"], correctIndex: 1, skill: "past continuous" },
  { id: "a2-06", difficulty: 2, prompt: "You ___ wear a seat belt in a car.", options: ["should", "should to", "are should", "shoulds"], correctIndex: 0, skill: "tavsiye ve zorunluluk" },
  { id: "a2-07", difficulty: 2, prompt: "I need to ___ a decision soon.", options: ["do", "make", "take", "put"], correctIndex: 1, skill: "sık kullanılan kalıp" },
  { id: "a2-08", difficulty: 2, prompt: "Could you tell me ___ the station is?", options: ["where", "what", "when", "which"], correctIndex: 0, skill: "yol sorma" },
  { id: "a2-09", difficulty: 2, prompt: "Read: 'Mert missed the bus, so he arrived late.' Why was Mert late?", options: ["He woke up early.", "He missed the bus.", "The bus was empty.", "He walked slowly."], correctIndex: 1, skill: "okuma anlama" },
  { id: "a2-10", difficulty: 2, prompt: "Which message is appropriate for a friend?", options: ["I would be grateful for your response.", "Wanna grab coffee later?", "Dear Sir or Madam,", "Please find attached."], correctIndex: 1, skill: "günlük iletişim" },
  { id: "a2-11", difficulty: 2, prompt: "There isn't ___ information on this website.", options: ["many", "much", "a few", "an"], correctIndex: 1, skill: "miktar ifadeleri" },
  { id: "a2-12", difficulty: 2, prompt: "My phone is ___ than yours, but yours is more expensive.", options: ["small", "smaller", "smallest", "more small"], correctIndex: 1, skill: "karşılaştırmalar" },
  { id: "b1-01", difficulty: 3, prompt: "By the time I arrived, the film ___.", options: ["started", "had started", "has started", "was starting"], correctIndex: 1, skill: "past perfect" },
  { id: "b1-02", difficulty: 3, prompt: "I wish I ___ more time to read.", options: ["have", "had", "will have", "am having"], correctIndex: 1, skill: "wish yapısı" },
  { id: "b1-03", difficulty: 3, prompt: "The book ___ by millions of people every year.", options: ["reads", "is read", "has read", "was reading"], correctIndex: 1, skill: "edilgen yapı" },
  { id: "b1-04", difficulty: 3, prompt: "She asked me where I ___.", options: ["live", "lived", "am living", "will live"], correctIndex: 1, skill: "dolaylı anlatım" },
  { id: "b1-05", difficulty: 3, prompt: "If I ___ enough money, I would travel more.", options: ["have", "had", "will have", "had had"], correctIndex: 1, skill: "ikinci koşul" },
  { id: "b1-06", difficulty: 3, prompt: "I'm used to ___ up early on weekdays.", options: ["get", "getting", "got", "have got"], correctIndex: 1, skill: "used to yapısı" },
  { id: "b1-07", difficulty: 3, prompt: "The meeting was ___ because the manager was ill.", options: ["put off", "put up", "put out", "put on"], correctIndex: 0, skill: "phrasal verbs" },
  { id: "b1-08", difficulty: 3, prompt: "I can't remember ___ I locked the door.", options: ["if", "that", "what", "whose"], correctIndex: 0, skill: "dolaylı soru" },
  { id: "b1-09", difficulty: 3, prompt: "Read: 'Although the rain was heavy, the event continued.' What happened?", options: ["The event was cancelled.", "The event continued.", "It did not rain.", "People stayed home."], correctIndex: 1, skill: "okuma anlama" },
  { id: "b1-10", difficulty: 3, prompt: "Which phrase softens a disagreement politely?", options: ["You're wrong.", "I see your point, but...", "That's nonsense.", "Never say that."], correctIndex: 1, skill: "günlük iletişim" },
  { id: "b1-11", difficulty: 3, prompt: "She succeeded ___ the exam after months of study.", options: ["to pass", "in passing", "at pass", "for passing"], correctIndex: 1, skill: "fiil + edat" },
  { id: "b1-12", difficulty: 3, prompt: "The teacher suggested that we ___ a short break.", options: ["take", "took", "taking", "to take"], correctIndex: 0, skill: "öneri yapıları" },
  { id: "b2-01", difficulty: 4, prompt: "Had I known, I ___ you sooner.", options: ["would tell", "would have told", "will tell", "told"], correctIndex: 1, skill: "üçüncü koşul" },
  { id: "b2-02", difficulty: 4, prompt: "He speaks as though he ___ everything.", options: ["knows", "knew", "has known", "will know"], correctIndex: 1, skill: "varsayımsal anlatım" },
  { id: "b2-03", difficulty: 4, prompt: "No sooner ___ home than it started to rain.", options: ["I had arrived", "had I arrived", "I arrived", "did I arrive"], correctIndex: 1, skill: "devrik yapı" },
  { id: "b2-04", difficulty: 4, prompt: "The proposal is worth ___ carefully.", options: ["consider", "to consider", "considering", "considered"], correctIndex: 2, skill: "fiilimsi yapılar" },
  { id: "b2-05", difficulty: 4, prompt: "The new policy is expected to have a significant ___ on prices.", options: ["effect", "affect", "effective", "affection"], correctIndex: 0, skill: "akademik kelime" },
  { id: "b2-06", difficulty: 4, prompt: "Not only ___ late, but he also forgot the documents.", options: ["he arrived", "did he arrive", "he did arrive", "arrived he"], correctIndex: 1, skill: "devrik yapı" },
  { id: "b2-07", difficulty: 4, prompt: "The issue needs ___ before a final decision is made.", options: ["to discuss", "discussing", "to be discussed", "being discuss"], correctIndex: 2, skill: "edilgen fiilimsi" },
  { id: "b2-08", difficulty: 4, prompt: "Her explanation was so ___ that everyone understood the complex idea.", options: ["obscure", "clear", "ambiguous", "vague"], correctIndex: 1, skill: "anlam inceliği" },
  { id: "b2-09", difficulty: 4, prompt: "Read: 'The article acknowledges the benefits but cautions against rapid implementation.' What is the writer's view?", options: ["Completely opposed.", "Entirely enthusiastic.", "Balanced but cautious.", "Uninterested."], correctIndex: 2, skill: "okuma çıkarımı" },
  { id: "b2-10", difficulty: 4, prompt: "Which expression is best for a measured opinion?", options: ["This is obviously perfect.", "It seems reasonable to suggest that...", "Everyone knows this is true.", "There is no debate."], correctIndex: 1, skill: "görüş belirtme" },
  { id: "b2-11", difficulty: 4, prompt: "She would rather you ___ her before making changes.", options: ["tell", "told", "will tell", "have told"], correctIndex: 1, skill: "would rather" },
  { id: "b2-12", difficulty: 4, prompt: "The results, ___ were unexpected, require further investigation.", options: ["that", "which", "where", "what"], correctIndex: 1, skill: "tanımlayıcı olmayan relative clause" },
];

export type PlacementAnswer = { difficulty: number; correct: boolean };
export function publicQuestion(question: PlacementQuestion) { const { correctIndex: _correctIndex, ...safeQuestion } = question; return safeQuestion; }
export function getQuestion(questionId: string) { return placementQuestions.find(question => question.id === questionId); }
export function chooseNextQuestion(answeredIds: string[], targetDifficulty: number) { const unanswered = placementQuestions.filter(question => !answeredIds.includes(question.id)); if (!unanswered.length) return undefined; return [...unanswered].sort((a, b) => Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty) || a.difficulty - b.difficulty)[0]; }
export function nextDifficulty(currentDifficulty: number, correct: boolean) { return Math.max(1, Math.min(4, currentDifficulty + (correct ? 1 : -1))); }
export function deriveCefr(attempts: PlacementAnswer[]) { const weightedCorrect = attempts.reduce((sum, item) => sum + (item.correct ? item.difficulty : 0), 0); const correctCount = attempts.filter(item => item.correct).length; const highCorrect = attempts.filter(item => item.correct && item.difficulty >= 3).length; if (weightedCorrect >= 33 || (correctCount >= 9 && highCorrect >= 4)) return "B2"; if (weightedCorrect >= 24 || (correctCount >= 7 && highCorrect >= 2)) return "B1"; if (weightedCorrect >= 14 || correctCount >= 5) return "A2"; return "A1"; }
export function roadmapFor(level: string) { const roadmaps: Record<string, { title: string; focus: string; next: string }> = { A1: { title: "Temel A1", focus: "temel cümle kalıpları ve günlük rutinler", next: "A2'ye geçmek için Hafta 1 ve Hafta 2'yi tamamla." }, A2: { title: "Güçlü A2", focus: "geçmiş deneyimler, planlar ve kısa diyaloglar", next: "B1'e yaklaşmak için Hafta 2 ve Hafta 3'e odaklan." }, B1: { title: "Bağımsız B1", focus: "gerekçelendirme, hikâye anlatımı ve akıcı konuşma", next: "B2 için Hafta 3 ve Hafta 4 konuşmalarını derinleştir." }, B2: { title: "Gelişen B2", focus: "ince anlam farkları, görüş savunma ve daha doğal akış", next: "Konuşma laboratuvarında daha uzun, temalı sohbetlere geç." } }; return roadmaps[level] ?? roadmaps.A1; }
export function xpLevel(xp: number) { if (xp >= 360) return { title: "Akıcı Anlatıcı", nextAt: 600 }; if (xp >= 180) return { title: "Ritim Kurucu", nextAt: 360 }; if (xp >= 70) return { title: "Cümle Avcısı", nextAt: 180 }; return { title: "İlk Cümle", nextAt: 70 }; }
export function safeLeaderboardName(name: string | null) { const parts = (name ?? "Öğrenci").trim().split(/\s+/).filter(Boolean); if (!parts.length) return "Öğrenci"; return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[1][0]}.`; }
