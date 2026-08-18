# Speak with Intention — Vercel Kurulum Kılavuzu (PostgreSQL / Neon)

Bu paket, **Speak with Intention** uygulamasının **Vercel üzerinde bağımsız olarak barındırılabilecek** Next.js 15 sürümüdür. Manus altyapısına (Manus OAuth, dahili veritabanı, dahili LLM) hiç bağımlılığı yoktur. Tek ihtiyacı olan şeyler: bir uzak **PostgreSQL veritabanı** (örn. Neon) ve **OpenAI uyumlu bir yapay zekâ API anahtarı**.

> **v2 notu:** Veritabanı katmanı **PostgreSQL** olarak değiştirilmiştir (Neon PostgreSQL uyumlu). MySQL artık desteklenmez.

---

## 1. Genel Bakış

| Bileşen | Vercel sürümündeki karşılık |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| API katmanı | tRPC (App Router route handler'ları) |
| Kimlik doğrulama | NextAuth.js v5 — e-posta + şifre (`trustHost` açık) |
| Veritabanı | PostgreSQL 15+ (Neon, Supabase vb.) — Drizzle ORM + `@neondatabase/serverless` / `pg` |
| Yapay zekâ | OpenAI uyumlu herhangi bir sağlayıcı (OpenAI, Groq, OpenRouter, Together vb.) |

## 2. Ön Koşullar

- [Node.js 22+](https://nodejs.org/) ve [pnpm](https://pnpm.io/) kurulu olmalı (`npm i -g pnpm`)
- Bir **GitHub hesabı** (Vercel, GitHub reposundan dağıtım yapar)
- Bir **Vercel hesabı** (ücretsiz plan yeterlidir)
- Bir **PostgreSQL veritabanı** — öneriler:
  - [Neon](https://console.neon.tech/) (ücretsiz katman, kullanıcı zaten hesabı olan)
  - [Supabase](https://supabase.com) (ücretsiz katman, aynı bağlantı dizesi biçimi)
- Bir **OpenAI uyumlu API anahtarı**:
  - Doğrudan [OpenAI](https://platform.openai.com/api-keys) alınabilir
  - Alternatif: Groq, OpenRouter, Together veya kendi endpoint'iniz (`AI_API_BASE_URL` ile)

## 3. Adım Adım Kurulum

### Adım 1 — Depoyu GitHub'a yükle

1. [github.com/new](https://github.com/new) adresinden yeni bir repo oluştur (örn. `speak-with-intention`).
2. ZIP'i açtıktan sonra terminalde:
   ```bash
   cd ai-english-mini-program-vercel
   git init
   git add -A
   git commit -m "Speak with Intention — Vercel sürümü (PostgreSQL)"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/speak-with-intention.git
   git push -u origin main
   ```

### Adım 2 — Veritabanını oluştur (Neon)

1. [console.neon.tech](https://console.neon.tech/) hesabına giriş yap → **New Project** → **Create project**.
2. Proje oluştuğunda **Settings → Connection strings** bölümünden bağlantı dizesini kopyala (`postgresql://...` ile başlar).
3. Bu string'i Vercel'de `DATABASE_URL` olarak gireceksin.

**ÖNEMLİ:** Uygulama veritabanına ilk bağlandığında tüm tabloları kendisi otomatik oluşturur (`server/ensureTables.ts` — idempotent, `CREATE TABLE IF NOT EXISTS` ile). Manuel migration çalıştırmana gerek yoktur.

### Adım 3 — Ortam değişkenlerini Vercel'e gir

Vercel panosunda: projen → **Settings → Environment Variables → Add Environment Variable** ile şu değerleri ekle (Environments: "Production and Preview"):

| Değişken | Örnek / Açıklama |
|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` ile üretilen en az 32 karakterlik rastgele dize (**boş bırakılırsa kayıt/giriş çöker**) |
| `NEXTAUTH_URL` | Sitenin adresi, örn. `https://learnyourself-chi.vercel.app` (dağıtımdan sonra güncelle) |
| `DATABASE_URL` | Neon bağlantı dizesi (`postgresql://...`) |
| `AI_API_KEY` | OpenAI (veya seçtiğin sağlayıcı) API anahtarı |
| `AI_API_BASE_URL` | API kök adresi, örn. `https://api.openai.com/v1` (boş bırakılırsa OpenAI varsayılır) |
| `AI_MODEL` | (isteğe bağlı) model adı, örn. `gpt-4o-mini` |
| `AUTO_ADMIN_EMAIL` | (isteğe bağlı) ilk hesap olarak yönetici olacak e-posta |
| `REGISTER_CODE` | (isteğe bağlı) yeni kayıtlarda zorunlu kod — boşsa herkese açık kayıt |

> Tüm değişkenlerin tam listesi ve açıklamaları `.env.example` dosyasındadır. Bu dosyayı `.env` olarak kopyalayıp yerel testlerde kullanabilirsin.

> **`AUTH_SECRET` ve `NEXTAUTH_URL` değişmeden "Server error" sayfası alırsın.** İlk dağıtımdan önce mutlaka üret.

### Adım 4 — Vercel'e dağıt

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → GitHub reponu seç.
2. Framework Preset otomatik **Next.js** olarak algılanır.
3. Ortam değişkenlerini gir (yukarıdaki tablo).
4. **Deploy** — ilk dağıtım 2-5 dakika sürebilir.

> **Not:** Vercel'in build komutu otomatik olarak `pnpm build`'dir. `vercel.json` içinde build komutu `NODE_ENV=production pnpm build` olarak açıkça ayarlanmıştır.

### Adım 5 — İlk giriş

1. Siteni aç → **Programa katıl** → e-posta ve şifre ile ilk hesabını oluştur.
2. Kayıtta istenen kod sadece `REGISTER_CODE` tanımlıysa sorulur.
3. İlk hesap, `AUTO_ADMIN_EMAIL` ile eşleşiyorsa (veya o boşsa) otomatik olarak **yönetici** olur; yönetim panelinden öğrenci kayıt kodları üretebilir ve ilerlemeleri görebilirsin.
4. Vercel panelinden **Domains** bölümünde site adresini al ve `NEXTAUTH_URL` değişkenini güncelle (yoksa giriş yönlendirmeleri yanlış URL'ye döner). Güncelledikten sonra **Deployments → Redeploy** yap.

## 4. Yerelde Test Etmek

```bash
pnpm install
cp .env.example .env      # değerleri doldur
pnpm typecheck            # tip kontrolü
pnpm build                # üretim derlemesi (NODE_ENV=production otomatik ayarlanır)
pnpm dev                  # geliştirme sunucusu
```

`pnpm dev` çalışırken uygulama `http://localhost:3000` adresindedir. Yerel test için ücretsiz bir Neon PostgreSQL projesi kullanabilirsin.

## 5. Maliyet Tahmini

- **Vercel (Free):** statik sayfalar + serverless fonksiyonlar ücretsiz kotada yeter; aylık ~50-100 aktif öğrenciye kadar sorunsuz.
- **Neon PostgreSQL (Free):** başlangıç kotasi fazlasıyla yeterli.
- **LLM:** gpt-4o-mini kullanılırsa 1 analiz ~0.001-0.01 USD; aylık binlerce analiz ücretsiz kota içinde kalabilir.
- Toplam öngörülen aylık maliyet: **0-5 USD** (kullanım artana kadar).

## 6. Teknik Notlar

- Şema **PostgreSQL** için yazılmıştır (`drizzle/schema.ts`): `serial` birincil anahtarlar, `boolean`, rol alanı `VARCHAR` + `CHECK` kısıtı (enum yerine), `ON CONFLICT DO UPDATE` tabanlı upsert. MySQL artık desteklenmez.
- Veritabanı sürücüsü hem **neon-http** (Vercel sunucusuz ortamı için optimal) hem **pg** (yerel test) ile çalışır; bağlantı dizesi biçimine göre otomatik seçilir.
- Kimlik doğrulama `session.strategy: "jwt"` ve `trustHost: true` kullanır — sunucusuz ortamda oturumlar JWT olarak tarayıcıda saklanır.
- Çok satırlı `CREATE TABLE` deyimleri drizzle'ın `sql` etiketli şablonu yerine ham string olarak driver'a iletilir (paketli sunucu çalışma zamanındaki bir ayrıştırma sorununu aşmak için).
- AI uç noktası `AI_API_BASE_URL` + `/chat/completions` biçiminde kullanılır; standart OpenAI formatını destekleyen her sağlayıcıyla çalışır.
- Öğrenci ilerleme verileri, analizler ve XP sistemi tamamen veritabanında saklanır; Vercel'in statik sınırlarından etkilenmez.

## 7. Sorun Giderme

| Sorun | Çözüm |
|---|---|
| Kayıtta "Server error" | Önce `AUTH_SECRET` tanımlı olduğundan emin ol (boşsa uygulama açıklayıcı bir log bırakır; Vercel **Monitoring → Runtime Logs**). Logda `UntrustedHost` varsa `NEXTAUTH_URL` adresini canlı domaine güncelle. Değişiklikten sonra **Redeploy** yap |
| Environment Variables boş görünüyor | Vercel panelinde Settings → Environment Variables'ta `AUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `AI_API_KEY` mutlaka dolu olmalı — tüm değişkenler eksikse kayıt/giriş çöker |
| Veritabanına bağlanamıyor | `DATABASE_URL`'in `postgresql://` ile başladığından emin ol (MySQL dizesi `mysql://` çalışmaz). Neon'da projenin **Settings → Connection strings** bölümünden kopyala |
| Build başarısız: `non-standard NODE_ENV` | `NODE_ENV=production pnpm build` komutunu kullan; `vercel.json` bunu Vercel'de otomatik yapar |
| AI analizi hata veriyor | `AI_API_KEY` ve `AI_API_BASE_URL` doğruluğunu test et: `curl -H "Authorization: Bearer $AI_API_KEY" https://api.openai.com/v1/models` |
| İlk hesap yönetici değil | `AUTO_ADMIN_EMAIL` değişkenini o e-posta ile tanımlayıp projeyi yeniden dağıt |

---

*Speak with Intention — Yusuf Mert Alıcı tarafından tasarlanmıştır.*
