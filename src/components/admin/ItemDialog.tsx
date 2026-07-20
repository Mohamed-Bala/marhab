import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Modal } from "@/components/Modal";
import type { Category, MenuItem } from "@/lib/menu";

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function ItemDialog({
  open,
  item,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nameAr, setNameAr] = useState("");
  const [descAr, setDescAr] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNameAr(item?.name_ar ?? "");
    setDescAr(item?.description_ar ?? "");
    setPrice(item ? String(item.price) : "");
    setCategoryId(item?.category_id ?? categories[0]?.id ?? "");
  }, [open, item, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      name_ar: nameAr.trim(),
      description_ar: descAr.trim() || null,
      price: Number(price),
      category_id: categoryId,
      image_url: null,
    };
    const { error } = item
      ? await supabase.from("menu_items").update(payload).eq("id", item.id)
      : await supabase.from("menu_items").insert(payload);
    setBusy(false);
    if (error) {
      toast.error("تعذر حفظ الصنف");
      return;
    }
    toast.success(item ? "تم تحديث الصنف" : "تمت إضافة الصنف");
    onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={item ? "تعديل صنف" : "إضافة صنف"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">اسم الصنف *</label>
          <input required value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">الوصف</label>
          <textarea rows={2} value={descAr} onChange={(e) => setDescAr(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">السعر (ج.س) *</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              dir="ltr"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">التصنيف *</label>
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </select>
          </div>
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
