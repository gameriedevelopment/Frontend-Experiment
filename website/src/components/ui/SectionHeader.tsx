import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "dark" | "light";

export function Eyebrow({
  children,
  tone = "dark",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "type-label flex items-center gap-2.5",
        tone === "dark" ? "text-mist-300" : "text-lavender-700",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          tone === "dark" ? "bg-signal" : "bg-lavender-600",
        )}
      />
      {children}
    </p>
  );
}

export function DisplayTitle({
  lines,
  tone = "dark",
  as: Heading = "h2",
  className,
}: {
  lines: readonly [string, string];
  tone?: Tone;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Heading className={cn("type-display text-display-lg text-balance", className)}>
      <span className="block">{lines[0]}</span>
      <span
        className={cn(
          "block",
          tone === "dark" ? "text-lavender-400" : "text-lavender-600",
        )}
      >
        {lines[1]}
      </span>
    </Heading>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  aside,
  tone = "dark",
  className,
}: {
  eyebrow: string;
  title: readonly [string, string];
  aside?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-12 lg:items-end", className)}>
      <div className="lg:col-span-8">
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        <DisplayTitle lines={title} tone={tone} className="mt-6" />
      </div>
      {aside && (
        <div
          className={cn(
            "max-w-md text-lead lg:col-span-4 lg:justify-self-end",
            tone === "dark" ? "text-mist-300" : "text-ink-700",
          )}
        >
          {aside}
        </div>
      )}
    </div>
  );
}

export function Accent({ children }: { children: ReactNode }) {
  return <em className="font-serif text-[1.18em] leading-none">{children}</em>;
}
