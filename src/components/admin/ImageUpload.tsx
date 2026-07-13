import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, X, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPT_ATTR = "image/jpeg,image/jpg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;
const SIGNED_TTL = 60 * 60 * 24 * 365 * 10; // 10 years

function extFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = () => inputRef.current?.click();

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    const file = files?.[0];
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError("صيغة غير مدعومة. المسموح: JPG، JPEG، PNG، WebP");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("حجم الصورة يتجاوز 5 ميغابايت");
      return;
    }

    setUploading(true);
    try {
      const path = `items/${crypto.randomUUID()}.${extFor(file)}`;
      const { error: upErr } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { cacheControl: "31536000", contentType: file.type });
      if (upErr) throw upErr;
      const { data, error: signErr } = await supabase.storage
        .from("menu-images")
        .createSignedUrl(path, SIGNED_TTL);
      if (signErr || !data?.signedUrl) throw signErr ?? new Error("signed url");
      onChange(data.signedUrl);
    } catch {
      setError("تعذر رفع الصورة، حاول مرة أخرى");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const remove = () => {
    setError(null);
    onChange("");
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-muted animate-fade-in">
          <img
            src={value}
            alt="معاينة"
            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-foreground/70 to-transparent p-2.5">
            <button
              type="button"
              onClick={pick}
              disabled={uploading}
              className="rounded-lg bg-card/90 px-3 py-1.5 text-xs font-bold text-foreground shadow-card transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? "جارٍ الرفع..." : "تغيير"}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={uploading}
              aria-label="حذف الصورة"
              className="rounded-full bg-card/90 p-1.5 text-secondary shadow-card transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm animate-fade-in">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={pick}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pick()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={
            "flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/40 px-4 text-center transition-colors " +
            (dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/60 hover:bg-muted/70")
          }
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {uploading ? "جارٍ الرفع..." : "اسحب الصورة هنا أو اضغط للاختيار"}
          </p>
          <p className="text-xs text-muted-foreground">JPG · PNG · WebP — حتى 5MB</p>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2 text-xs text-secondary animate-fade-in">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
