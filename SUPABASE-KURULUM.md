# Supabase ile Veritabanı Kurulumu — Adım Adım Türkçe Rehber

**Amaç:** Vercel'de yayında olan sitedeki (learnyourself-chi.vercel.app) kayıt hatasını kalıcı olarak çözmek için Supabase üzerinden PostgreSQL veritabanı kurmak ve bu veritabanını siteye bağlamak.

**Süre:** Ortalama 5–10 dakika.
**Maliyet:** Ücretsiz plan yeterli (sitenin ihtiyacı çok az veri).

---

## BÖLÜM 1 — Supabase Projesi Oluşturma

1. [app.supabase.com](https://app.supabase.com) adresine git.
2. Sağ üstten **Sign in** ile giriş yap (ücretsiz hesap için **Google ile giriş** en hızlısıdır).
3. Giriş yaptıktan sonra sağ üstten **New Project** butonuna tıkla.
4. Açılan formda:
   - **Name:** istediğin bir isim yaz (örneğin `english-site`).
   - **Database Password:** bir şifre yaz (bu şifre senin için önemli, not al).
   - **Region:** `West US (North California)` seç (Vercel ile en yakın bölge).
5. **Create new project** butonuna bas.
   - Veritabanı hazırlanması **2–3 dakika** sürer. Sayfadaki adımlar tamamlanıp yeşil tikler görünene kadar bekle.

---

## BÖLÜM 2 — Bağlantı Dizesini (DATABASE_URL) Alma

Proje hazırlanınca şu adımları uygula:

1. Supabase içinde oluşturduğun projeyi aç (dashboard'da proje adına tıkla).
2. Proje açıldığında **sağ üst köşede "Connect" butonu** görürsün — ona tıkla.
   - (Eğer butonu göremiyorsan: sol menüde en alttaki **dişli simgesi (Settings)** → **Database** bölümüne gir; burada da "Connect" / "Connection info" alanı bulunur.)
3. Açılan pencerede **Node.js** dilini seçtiğinden emin ol (genelde varsayılan Node.js'tir).
4. **Direkt bağlantı** (`db.senin-projen.supabase.co` ile biten) kısmındaki dizeyi **tamamen kopyala**.

Dize şuna benzer:

```
postgresql://postgres.ABCDEFGHIJKLMNOP:SENIN_SIFREN@db.abcdefghijklmnopqrst.supabase.co:5432/postgres
```

> **ÖNEMLİ — Dikkat edilecek noktalar:**
>
> - Bağlantı dizesi `postgresql://` ile başlamalı ve `@db.xxx.supabase.co` içermelidir.
> - **Sakın `pooler.supabase.com` ile biten "Session pooler / Transaction pooler" satırını kullanma** — sadece `db.xxx.supabase.co` ile biten **direkt** satır gerek.
> - Satırın sonunda `?options=...` varsa **onu da dahil et**, eksik yapıştırma.
> - Dize içindeki şifre, Bölüm 1'de kendinin yazdığın şifredir.

5. Kopyaladığın dizeyi bana chat'te at (isteğe bağlı — kontrol edeyim) **veya** doğrudan Bölüm 3'e geç.

---

## BÖLÜM 3 — Vercel'de DATABASE_URL'i Güncelleme

1. [vercel.com](https://vercel.com) → Dashboard → **learnyourself** projesine tıkla.
2. Üst menüden **Settings** → sol listeden **Environment Variables** bölümüne gir.
3. `DATABASE_URL` satırını bul → sağdaki **⋯ → Edit**'e tıkla.
4. Neon'dan gelen eski dizeyi **tamamen sil**, Supabase'den kopyaladığın yeni dizeyi yapıştır.
   - Dize hem **Production** hem **Preview** kutularında aynı olmalı (üç kutu varsa hepsine yapıştır).
5. **Save** butonuna bas.

> Aynı sayfada kontrol et (hepsi dolu mu):
>
> | Değişken | Ne yazmalı |
> |---|---|
> | `DATABASE_URL` | Supabase dizesi (yeni yapıştırdığın) |
> | `AUTH_SECRET` | uzun rastgele bir şifre (ellemeyi) |
> | `AI_API_KEY` | OpenAI/Groq anahtarın |
> | `NEXTAUTH_URL` | `https://learnyourself-chi.vercel.app` |

---

## BÖLÜM 4 — Yeniden Dağıtma (Redeploy)

1. Vercel panelinde üst menüden **Deployments**'a gir.
2. En üstteki (en son) dağıtım satırına tıkla.
3. Sağ üstteki **⋯** (üç nokta) simgesine tıkla → **Redeploy** → **Yes**.
4. Bekle; durum **Ready** olduğunda işlem bitmiş demektir.

> **Redeploy ne işe yarar?** Vercel, siteyi **yeni ortam değişkenleriyle** baştan derler. Supabase bağlantısı ancak bu yeniden derlemeyle kullanıma girer.

---

## BÖLÜM 5 — Test Etme

1. `https://learnyourself-chi.vercel.app` adresini yeni sekmede aç.
2. **Hesap oluştur** ile yeni bir deneme hesabı oluştur (farklı bir e-posta ile, örn. `deneme@gmail.com`).
3. Başarılı olursa site seni içeri alır → **çözüldü.**
4. Başarısız olursa: Vercel → proje → üst menü **Monitoring → Logs** → sağdaki filtreden **Runtime** seç ve kırmızı satırları **en alta kaydır** → oradaki hata mesajının ekran görüntüsünü bana at.

---

## Sık Karşılaşılan Tuzaklar

| Belirti | Çözüm |
|---|---|
| "Giriş başarısız" hâlâ sürüyor | Redeploy yapılmamıştır veya DATABASE_URL Save edilmemiştir. Bölüm 3–4'ü tekrarla. |
| Dizede `pooler.supabase.com` var | Yanlış satır kopyalandı; Bölüm 2'de `db.xxx.supabase.co` ile biten direkt satırı kopyala. |
| Supabase projesi hâlâ "Setting up" | Henüz hazır değil; 2–3 dk bekle, sayfayı yenile. |
| "Connect" butonunu bulamıyorum | Sol menüdeki dişli (Settings) → **Database** ekranından "Connection info" bölümüne bak. |
| Tablolar oluştu mu merak | İlk kayıt başarılı olduğunda tablolar otomatik oluşur; Vercel Logs'ta `CREATE TABLE` satırları görünür. |

---

*Karşılaştığın her adımda takılırsan ekran görüntüsü at, kaldığın yerden devam ederiz.*
