import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { categoriesQuery, menuItemsQuery, formatPrice, type Category, type MenuItem } from "@/lib/menu";
import { checkIsAdmin } from "@/lib/admin.functions";
import { ItemDialog } from "@/components/admin/ItemDialog";
import { CategoryDialog } from "@/components/admin/CategoryDialog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — مطعم الأصالة" },
      { name: "description", content: "إدارة قائمة الطعام: الأصناف والتصنيفات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }
    claimAdminIfNone()
      .then((res) => setIsAdmin(Boolean(res?.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, [loading, session, navigate]);

  if (loading || (session && isAdmin === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        جارٍ التحميل...
      </div>
    );
  }

  if (!session) return null;

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-bold">ليست لديك صلاحية الوصول إلى لوحة التحكم</p>
        <Link to="/" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
          العودة إلى القائمة
        </Link>
      </div>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: items = [] } = useQuery(menuItemsQuery);

  const [tab, setTab] = useState<"items" | "categories">("items");
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null });
  const [catDialog, setCatDialog] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["menu_items"] });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const toggleAvailability = async (item: MenuItem) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    if (error) toast.error("تعذر تحديث الصنف");
    else refresh();
  };

  const deleteItem = async (item: MenuItem) => {
    if (!confirm(`حذف "${item.name_ar}"؟`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) toast.error("تعذر حذف الصنف");
    else {
      toast.success("تم حذف الصنف");
      refresh();
    }
  };

  const deleteCategory = async (cat: Category) => {
    const count = items.filter((i) => i.category_id === cat.id).length;
    if (!confirm(`حذف تصنيف "${cat.name_ar}"؟ سيتم حذف ${count} صنف تابع له.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) toast.error("تعذر حذف التصنيف");
    else {
      toast.success("تم حذف التصنيف");
      refresh();
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              aria-label="العودة إلى القائمة"
              className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
            <h1 className="truncate text-lg font-extrabold">لوحة التحكم</h1>
          </div>
          <button
            onClick={signOut}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          <button
            onClick={() => setTab("items")}
            className={
              tab === "items"
                ? "rounded-lg bg-card py-2 text-sm font-bold shadow-card"
                : "rounded-lg py-2 text-sm font-medium text-muted-foreground"
            }
          >
            الأصناف ({items.length})
          </button>
          <button
            onClick={() => setTab("categories")}
            className={
              tab === "categories"
                ? "rounded-lg bg-card py-2 text-sm font-bold shadow-card"
                : "rounded-lg py-2 text-sm font-medium text-muted-foreground"
            }
          >
            التصنيفات ({categories.length})
          </button>
        </div>

        {tab === "items" && (
          <>
            <button
              onClick={() => setItemDialog({ open: true, item: null })}
              className="mb-4 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              إضافة صنف
            </button>
            <div className="space-y-3">
              {categories.map((cat) => {
                const catItems = items.filter((i) => i.category_id === cat.id);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <h3 className="mb-2 mt-5 text-sm font-bold text-muted-foreground">{cat.name_ar}</h3>
                    <div className="space-y-2">
                      {catItems.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card p-3 shadow-card"
                        >
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.name_ar}
                                width={56}
                                height={56}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold">{item.name_ar}</p>
                            <p className="text-sm text-muted-foreground">{formatPrice(Number(item.price))}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => toggleAvailability(item)}
                              title={item.is_available ? "متوفر — اضغط للإخفاء" : "غير متوفر — اضغط للتفعيل"}
                              className={
                                item.is_available
                                  ? "relative h-6 w-11 rounded-full bg-primary transition-colors"
                                  : "relative h-6 w-11 rounded-full bg-border transition-colors"
                              }
                            >
                              <span
                                className={
                                  item.is_available
                                    ? "absolute top-0.5 right-0.5 h-5 w-5 -translate-x-5 rounded-full bg-card shadow-card transition-transform"
                                    : "absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-card shadow-card transition-transform"
                                }
                              />
                            </button>
                            <button
                              onClick={() => setItemDialog({ open: true, item })}
                              aria-label="تعديل"
                              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteItem(item)}
                              aria-label="حذف"
                              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-secondary"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "categories" && (
          <>
            <button
              onClick={() => setCatDialog({ open: true, category: null })}
              className="mb-4 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              إضافة تصنيف
            </button>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{cat.name_ar}</p>
                    <p className="text-sm text-muted-foreground">
                      {items.filter((i) => i.category_id === cat.id).length} صنف
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setCatDialog({ open: true, category: cat })}
                      aria-label="تعديل"
                      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat)}
                      aria-label="حذف"
                      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-secondary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <ItemDialog
        open={itemDialog.open}
        item={itemDialog.item}
        categories={categories}
        onClose={() => setItemDialog({ open: false, item: null })}
        onSaved={refresh}
      />
      <CategoryDialog
        open={catDialog.open}
        category={catDialog.category}
        onClose={() => setCatDialog({ open: false, category: null })}
        onSaved={refresh}
      />
    </div>
  );
}
