import type { ComponentPropsWithoutRef } from "react";

export function Container({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={`mx-auto w-full max-w-shell px-gutter ${className}`}
    />
  );
}

export function SectionHeading({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      {...props}
      className={`font-display text-heading font-black tracking-[-0.064em] text-balance ${className}`}
    />
  );
}
