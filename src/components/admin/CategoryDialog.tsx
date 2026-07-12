import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Modal } from "@/components/Modal";
import type { Category } from "@/lib/menu";

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function CategoryDialog({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nameAr, setNameAr] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNameAr(category?.name_ar ?? "");
    setSortOrder(String(category?.sort_order ?? 0));
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = { name_ar: nameAr.trim(), sort_order: Number(sortOrder) || 0 };
    const { error } = category
      ? await supabase.from("categories").update(payload).eq("id", category.id)
      : await supabase.from("categories").insert(payload);
    setBusy(false);
    if (error) {
      toast.error("تعذر حفظ التصنيف");
      return;
    }
    toast.success(category ? "تم تحديث التصنيف" : "تمت إضافة التصنيف");
    onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={category ? "تعديل تصنيف" : "إضافة تصنيف"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">اسم التصنيف *</label>
          <input required value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">ترتيب العرض</label>
          <input
            type="number"
            dir="ltr"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </form>
    </Modal>
  );
}
