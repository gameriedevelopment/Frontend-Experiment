import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/** Drop or pick one image, with a live preview of the current or chosen file. */
export function FileDrop({
  label,
  hint,
  accept,
  maxBytes,
  currentUrl,
  file,
  onFile,
  disabled,
  shape = "banner",
  className,
}: {
  label: string;
  hint: string;
  accept: string[];
  maxBytes: number;
  currentUrl?: string | null;
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
  /** Banner is 16:6, cover is 16:9. */
  shape?: "banner" | "cover";
  className?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  useEffect(() => {
    if (!file) return setPreview(currentUrl ?? null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [currentUrl, file]);

  const choose = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!accept.includes(candidate.type)) return setError("Use a JPG, PNG or WebP image.");
    if (candidate.size > maxBytes) return setError(`Keep it under ${Math.round(maxBytes / 1024 / 1024)} MB.`);
    setError("");
    onFile(candidate);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <span className="flex items-baseline justify-between gap-3 text-sm font-medium text-mist-200">
        {label}
        <span className="text-xs font-normal text-mist-500">{hint}</span>
      </span>
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) choose(event.dataTransfer.files[0]);
        }}
        className={cn(
          "group relative grid cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed transition-colors",
          shape === "cover" ? "aspect-video" : "aspect-16/6",
          dragging ? "border-lavender-400 bg-lavender-400/8" : "border-white/15 bg-white/3 hover:border-white/30",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {preview && <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />}
        <span
          className={cn(
            "relative flex flex-col items-center gap-2 rounded-2xl px-4 py-3 text-center text-sm",
            preview ? "bg-ink-950/70 text-mist-100 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100" : "text-mist-400",
          )}
        >
          <Icon name="image" weight="duotone" className="size-6 text-lavender-300" />
          {preview ? "Replace image" : "Drop an image here, or choose one"}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept.join(",")}
          disabled={disabled}
          onChange={(event) => choose(event.target.files?.[0])}
          className="sr-only"
        />
      </label>
      {file && (
        <button
          type="button"
          onClick={() => {
            onFile(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="w-fit text-xs font-medium text-mist-400 hover:text-mist-50"
        >
          Remove {file.name}
        </button>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-[0.8rem] text-danger">
          <Icon name="warning" className="size-3.5" weight="bold" />
          {error}
        </p>
      )}
    </div>
  );
}
