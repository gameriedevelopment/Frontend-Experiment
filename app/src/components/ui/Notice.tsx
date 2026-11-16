import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

const noticeVariants = cva("flex gap-3 rounded-2xl p-4 text-sm leading-relaxed ring-1 ring-inset", {
  variants: {
    tone: {
      danger: "bg-danger/8 text-mist-200 ring-danger/25 [&_svg]:text-danger",
      info: "bg-lavender-400/8 text-mist-200 ring-lavender-400/20 [&_svg]:text-lavender-300",
      signal: "bg-signal/8 text-mist-200 ring-signal/20 [&_svg]:text-signal",
    },
  },
  defaultVariants: { tone: "info" },
});

const toneIcon: Record<NonNullable<VariantProps<typeof noticeVariants>["tone"]>, IconName> = {
  danger: "warning",
  info: "info",
  signal: "verified",
};

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: VariantProps<typeof noticeVariants> & {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn(noticeVariants({ tone }), className)}>
      <Icon name={toneIcon[tone ?? "info"]} className="mt-0.5 size-[1.1rem]" weight="bold" />
      <div className="min-w-0">
        {title && <p className="font-semibold text-mist-50">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
