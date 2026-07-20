import { formatPrice, type MenuItem } from "@/lib/menu";

export function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <div className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h3 className="min-w-0 truncate text-lg font-bold">{item.name_ar}</h3>
          <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            {formatPrice(Number(item.price))}
          </span>
        </div>
        {item.description_ar && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.description_ar}
          </p>
        )}
        {!item.is_available && (
          <span className="mt-3 inline-block rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
            غير متوفر حالياً
          </span>
        )}
      </div>
    </article>
  );
}
