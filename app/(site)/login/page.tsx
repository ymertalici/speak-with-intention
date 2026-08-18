"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppHeader } from "@/components/AppHeader";
import { Brand } from "@/components/Brand";
import { AlertCircle, ArrowRight, Sparkles } from "lucide-react";

type Mode = "signin" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [registerCode, setRegisterCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void import("next-auth/react").then(mod => {
      mod.getSession().then(session => {
        if (session) router.replace("/program");
      });
    });
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        name: name.trim() || undefined,
        password,
        registerCode: registerCode.trim() || undefined,
        redirect: false,
      });
      if (result?.error) {
        // NextAuth translates thrown authorize() errors into a generic
        // "Configuration" callback error; surface real DB-connectivity
        // messages instead of blaming the credentials.
        if (result.error === "Configuration") {
          setError("Veritabanına şu an ulaşılamıyor (DNS/bağlantı sorunu). Sunucu günlüklerinde (Vercel → Monitoring → Logs → Runtime) gerçek hata mesajını görebilirsin.");
        } else if (result.error === "CredentialsSignin") {
          setError("Giriş başarısız. E-posta, şifre veya kayıt kodu hatalı.");
        } else {
          setError(`Giriş sırasında bir hata oluştu: ${result.error}`);
        }
      } else {
        router.push("/program");
      }
    } catch {
      setError("Bir bağlantı sorunu oluştu; lütfen tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      <AppHeader dark />
      <main className="gate-page">
        <div className="gate-card">
          <span className="eyebrow"><Sparkles size={14} /> Öğrenci alanı</span>
          <h1>{mode === "signin" ? (<>Pratiğine<br /><em>hoş geldin.</em></>) : (<>Yolculuğun<br /><em>başlasın.</em></>)}</h1>
          <p>{mode === "signin" ? "Hesabınla giriş yap ve çalışma alanına dön." : "Eğitmenin verdiyse kayıt kodunu da gir; yoksa boş bırakıp dene."}</p>
          <form onSubmit={submit} className="gate-form">
            <div className="form-grid">
              <div>
                <Label htmlFor="login-email">E-posta</Label>
                <Input id="login-email" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
              </div>
              {mode === "register" && (
                <div>
                  <Label htmlFor="login-name">Ad soyad</Label>
                  <Input id="login-name" type="text" autoComplete="name" value={name} onChange={event => setName(event.target.value)} />
                </div>
              )}
              <div>
                <Label htmlFor="login-password">Şifre</Label>
                <Input id="login-password" type="password" required autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} />
              </div>
              {mode === "register" && (
                <div>
                  <Label htmlFor="login-code">Kayıt kodu</Label>
                  <Input id="login-code" type="text" autoComplete="off" value={registerCode} onChange={event => setRegisterCode(event.target.value)} placeholder="Eğitmeninden aldığın kod" />
                </div>
              )}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle size={15} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={submitting} className="button-ink button-wide">
              {submitting ? "Hazırlanıyor…" : mode === "signin" ? "Giriş yap" : "Hesap oluştur"} <ArrowRight size={16} />
            </Button>
          </form>
          <p className="text-link" role="group" aria-label="Hesap seçenekleri">
            {mode === "signin" ? (
              <>Hesabın yok mu? <button type="button" onClick={() => setMode("register")}>Kayıt oluştur</button></>
            ) : (
              <>Zaten hesabın var mı? <button type="button" onClick={() => setMode("signin")}>Giriş yap</button></>
            )}
          </p>
          <Link href="/" className="text-link">Programı tekrar incele</Link>
        </div>
      </main>
    </div>
  );
}
