import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — مطعم الركن الجميل" },
      { name: "description", content: "تسجيل دخول مدير المطعم إلى لوحة التحكم." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? translateAuthError(err.message) : "حدث خطأ ما");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="text-2xl font-extrabold text-primary">
            مطعم الركن الجميل
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">لوحة تحكم المدير</p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-card">
          <h2 className="mb-5 text-center text-lg font-bold">تسجيل الدخول</h2>

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
              {busy ? "لحظة..." : "دخول"}
            </button>
          </form>
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
  if (message.includes("Email not confirmed")) return "يرجى تأكيد بريدك الإلكتروني أولاً";
  return message;
}
