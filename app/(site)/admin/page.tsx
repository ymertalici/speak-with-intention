"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Check, Clipboard, KeyRound, Loader2, ShieldAlert, UsersRound, XCircle } from "lucide-react";

export default function Admin() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading";

  const utils = trpc.useUtils();
  const students = trpc.admin.students.useQuery(undefined, { enabled: session?.user?.role === "admin" });
  const codes = trpc.admin.accessCodes.useQuery(undefined, { enabled: session?.user?.role === "admin" });
  const updateAccess = trpc.admin.setAccess.useMutation({ onSuccess: async () => { await utils.admin.students.invalidate(); toast.success("Öğrenci erişimi güncellendi."); }, onError: error => toast.error(error.message) });
  const createCode = trpc.admin.createAccessCode.useMutation({ onSuccess: async data => { await utils.admin.accessCodes.invalidate(); toast.success(`Yeni kod üretildi: ${data.code}`, { description: "Kodu öğrencinle paylaş; kayıt sırasında kullanabilir." }); }, onError: error => toast.error(error.message) });
  const revokeCode = trpc.admin.revokeAccessCode.useMutation({ onSuccess: async () => { await utils.admin.accessCodes.invalidate(); toast.success("Kod geçersiz hale getirildi."); }, onError: error => toast.error(error.message) });

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Kod kopyalandı: " + code);
    } catch {
      toast.error("Kopyalanamadı; kodu metinden seçip kopyalayabilirsin.");
    }
  }
  if (loading) return <main className="loading-page"><Loader2 className="animate-spin" /> Hazırlanıyor…</main>;
  if (session?.user?.role !== "admin") return <div className="admin-denied"><ShieldAlert size={30} /><h1>Bu alan sana açık değil.</h1><p>Yönetim paneli yalnızca yetkili hesaplara görünür.</p><Link href="/program"><Button className="button-ink">Öğrenci çalışma alanına dön</Button></Link></div>;
  return <div className="admin-page"><AppHeader /><main className="container admin-main"><Link href="/program" className="back-link"><ArrowLeft size={16} /> Çalışma alanına dön</Link><section className="admin-heading"><div><p className="section-label">YÖNETİM ALANI</p><h1>Öğrenci erişimi<br /><em>tek bir yerde.</em></h1></div><div className="admin-stat"><UsersRound size={19} /><span><strong>{students.data?.length ?? "—"}</strong> kayıtlı hesap</span></div></section><section className="admin-table-card"><div className="admin-table-title"><div><h2>Kayıtlı öğrenciler</h2><p>Yeni giriş yapan hesapların program erişimini buradan etkinleştir.</p></div></div>{students.isLoading ? <div className="table-state"><Loader2 className="animate-spin" /> Öğrenciler getiriliyor…</div> : students.error ? <div className="table-state table-error">Öğrenci listesi alınamadı: {students.error.message}</div> : <div className="student-table-wrap"><table><thead><tr><th>Öğrenci</th><th>Hesap</th><th>Son giriş</th><th>Erişim</th><th /></tr></thead><tbody>{students.data?.map(student => { const isAdmin = student.role === "admin"; const enabled = isAdmin || student.accessEnabled === true; return <tr key={student.id}><td><strong>{student.name || "İsimsiz öğrenci"}</strong>{isAdmin && <span className="role-tag">Yönetici</span>}</td><td>{student.email || "E-posta paylaşılmadı"}</td><td>{student.lastSignedIn ? new Date(student.lastSignedIn).toLocaleDateString("tr-TR") : "—"}</td><td><span className={`access-state ${enabled ? "access-on" : "access-off"}`}>{enabled ? <Check size={13} /> : null}{enabled ? "Aktif" : "Bekliyor"}</span></td><td><Button size="sm" variant={enabled && !isAdmin ? "outline" : "default"} disabled={isAdmin || updateAccess.isPending} onClick={() => updateAccess.mutate({ userId: student.id, enabled: !enabled })}>{isAdmin ? "Sabit" : enabled ? "Erişimi kapat" : "Erişimi aç"}</Button></td></tr>; })}{students.data?.length === 0 && <tr><td colSpan={5}><div className="table-state">Henüz giriş yapan öğrenci yok.</div></td></tr>}</tbody></table></div>}</section><section className="admin-table-card"><div className="admin-table-title"><div><h2>Kayıt kodları</h2><p>Öğrencilerin kayıt sırasında kullanacağı kodları buradan oluştur. Bir kod bir kez kullanıldığında otomatik olarak tek kullanım olur; istersen manuel olarak geçersiz hâle getirebilirsin.</p></div><Button variant="default" className="button-ink" onClick={() => createCode.mutate()} disabled={createCode.isPending}>{createCode.isPending ? <Loader2 className="animate-spin" /> : <KeyRound size={16} />}{createCode.isPending ? "Üretiliyor…" : "Yeni kod üret"}</Button></div>{codes.isLoading ? <div className="table-state"><Loader2 className="animate-spin" /> Kodlar yükleniyor…</div> : codes.error ? <div className="table-state table-error">Kod listesi alınamadı: {codes.error.message}</div> : <div className="student-table-wrap"><table><thead><tr><th>Kod</th><th>Durum</th><th>Kullanım</th><th>Üretim</th><th /></tr></thead><tbody>{codes.data?.map(item => { const used = item.usageCount > 0; return <tr key={item.id}><td><code className="access-code-text">{item.code}</code></td><td><span className={`access-state ${item.revoked ? "access-off" : "access-on"}`}>{item.revoked ? <XCircle size={13} /> : <Check size={13} />}{item.revoked ? "Geçersiz" : "Etkin"}</span></td><td>{used ? `1 kez kullanıldı` : "Henüz kullanılmadı"}</td><td>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</td><td><Button size="sm" variant="outline" disabled={item.revoked || revokeCode.isPending} onClick={() => revokeCode.mutate({ id: item.id })}>{item.revoked ? "Yeniden açılmaz" : "Geçersiz kıl"}</Button><Button size="sm" variant="default" className="ml-2" onClick={() => copyCode(item.code)} disabled={item.revoked} title="Kodu panoya kopyala"><Clipboard size={13} /></Button></td></tr>; })}{(!codes.data || codes.data.length === 0) && <tr><td colSpan={5}><div className="table-state">Henüz oluşturulmuş kod yok.</div></td></tr>}</tbody></table></div>}</section></main></div>;
}
