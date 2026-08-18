"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { ArrowUpRight, LogOut, ShieldCheck, UserRound } from "lucide-react";

export function AppHeader({ dark = false }: { dark?: boolean }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user ?? null;
  const loading = status === "loading";
  const isAuthenticated = !!session;
  const logout = () => void signOut({ redirect: false }).then(() => router.push("/"));
  const accountAction = () => {
    if (isAuthenticated) router.push("/program");
    else router.push("/login");
  };

  return (
    <header className={`app-header ${dark ? "app-header-dark" : ""}`}>
      <div className="app-header-inner">
        <Brand />
        <nav className="top-nav" aria-label="Ana navigasyon">
          <a href="/#program">Program</a>
          <Link href="/conversation">Konuşma</Link>
          <Link href="/coach">Analiz</Link>
          <Link href="/weekly-coach">Koçluk</Link>
          <Link href="/placement">Seviye</Link>
          <Link href="/vocabulary">Kelimeler</Link>
          <Link href="/leaderboard">Puanlar</Link>
          <Link href="/support">Destek</Link>
          {user?.role === "admin" && <Link href="/admin">Yönetim</Link>}
        </nav>
        <div className="header-actions">
          {!loading && isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" onClick={accountAction} className="header-user-button">
                <UserRound size={15} />
                <span className="hidden sm:inline">Profilim</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Çıkış yap" className="header-logout">
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <Button onClick={accountAction} size="sm" className="button-ink">
              Programa gir <ArrowUpRight size={15} />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function AdminPill() {
  const { data: session } = useSession();
  if (session?.user?.role !== "admin") return null;
  return (
    <Link href="/admin" className="admin-pill">
      <ShieldCheck size={14} /> Yönetici
    </Link>
  );
}
