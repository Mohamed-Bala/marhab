import { formatPrice, type MenuItem } from "@/lib/menu";

export function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-card shadow-card transition-shadow hover:shadow-card-hover">
      {item.image_url && (
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={item.image_url}
            alt={item.name_ar}
            width={800}
            height={600}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {!item.is_available && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
              <span className="rounded-full bg-card px-4 py-1.5 text-sm font-bold text-secondary">
                غير متوفر حالياً
              </span>
            </div>
          )}
        </div>
      )}
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
      </div>
    </article>
  );
}
