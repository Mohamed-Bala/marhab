import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { categoriesQuery, menuItemsQuery } from "@/lib/menu";
import { MenuItemCard } from "@/components/MenuItemCard";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(menuItemsQuery),
    ]);
  },
  component: MenuPage,
});

function MenuPage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: items } = useSuspenseQuery(menuItemsQuery);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visibleCategories = useMemo(
    () =>
      activeCategory
        ? categories.filter((c) => c.id === activeCategory)
        : categories,
    [categories, activeCategory],
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-xl text-primary-foreground">
              🍽
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold">مطعم الأصالة</h1>
              <p className="text-xs text-muted-foreground">نكهات شرقية أصيلة</p>
            </div>
          </div>
          <Link
            to="/admin"
            aria-label="لوحة التحكم"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Category chips */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl overflow-x-auto px-4">
          <div className="flex gap-2 py-3">
            <CategoryChip
              label="الكل"
              active={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.name_ar}
                active={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Menu sections */}
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        {visibleCategories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id);
          if (catItems.length === 0) return null;
          return (
            <section key={cat.id} className="mb-12">
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-2xl font-extrabold">{cat.name_ar}</h2>
                <div className="h-1 w-10 rounded-full bg-primary" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {catItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
        {items.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">
            لا توجد أصناف في القائمة بعد.
          </p>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        مطعم الأصالة © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "shrink-0 whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground shadow-card"
          : "shrink-0 whitespace-nowrap rounded-full bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-card transition-colors hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}
