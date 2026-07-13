import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { claimAdminIfNone } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — مطعم الأصالة" },
      { name: "description", content: "تسجيل دخول مدير المطعم إلى لوحة التحكم." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const afterLogin = async () => {
    await supabase.rpc("claim_admin_if_none");
    navigate({ to: "/admin" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await afterLogin();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? translateAuthError(err.message) : "حدث خطأ ما");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("تعذر تسجيل الدخول عبر Google");
      return;
    }
    if (result.redirected) return;
    await afterLogin();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="text-2xl font-extrabold text-primary">
            مطعم الأصالة
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">لوحة تحكم المدير</p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-card">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button
              onClick={() => setMode("login")}
              className={
                mode === "login"
                  ? "rounded-lg bg-card py-2 text-sm font-bold shadow-card"
                  : "rounded-lg py-2 text-sm font-medium text-muted-foreground"
              }
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => setMode("signup")}
              className={
                mode === "signup"
                  ? "rounded-lg bg-card py-2 text-sm font-bold shadow-card"
                  : "rounded-lg py-2 text-sm font-medium text-muted-foreground"
              }
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "لحظة..." : mode === "login" ? "دخول" : "إنشاء حساب"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            أو
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full rounded-xl border border-input bg-background py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            المتابعة عبر Google
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← العودة إلى القائمة
          </Link>
        </p>
      </div>
    </div>
  );
}

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "بيانات الدخول غير صحيحة";
  if (message.includes("already registered")) return "هذا البريد مسجل مسبقاً";
  if (message.includes("Email not confirmed")) return "يرجى تأكيد بريدك الإلكتروني أولاً";
  return message;
}
