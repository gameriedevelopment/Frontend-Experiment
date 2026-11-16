import type { ComponentPropsWithoutRef } from "react";

const variants = {
  primary:
    "border-brand bg-brand text-stage hover:border-brand-light hover:bg-brand-light",
  secondary:
    "border-white/22 bg-white/7 text-foreground hover:border-brand/65 hover:bg-white/12",
  subtle:
    "border-transparent text-brand-light hover:bg-white/8 hover:text-white",
  inverse:
    "border-ink bg-ink text-paper hover:border-deep hover:bg-deep focus-visible:outline-ink",
};

const sizes = {
  compact: "min-h-10 gap-2 px-4.5 text-sm",
  regular: "min-h-12 gap-2.5 px-3.5 text-sm sm:gap-3 sm:px-5.5",
};

type ActionVariant = keyof typeof variants;
type ActionSize = keyof typeof sizes;

export function actionStyles(
  variant: ActionVariant,
  size: ActionSize,
  className = "",
) {
  return `inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border font-bold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${variants[variant]} ${sizes[size]} ${className}`;
}

type ActionLinkProps = ComponentPropsWithoutRef<"a"> & {
  variant?: ActionVariant;
  size?: ActionSize;
};

export function ActionLink({
  variant = "primary",
  size = "regular",
  className,
  ...props
}: ActionLinkProps) {
  return <a {...props} className={actionStyles(variant, size, className)} />;
}
