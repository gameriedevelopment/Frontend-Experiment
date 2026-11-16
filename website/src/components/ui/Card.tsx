import type { ComponentPropsWithoutRef } from "react";

const variants = {
  surface: "border-line bg-paper text-ink",
  image: "border-orbit-edge bg-stage text-foreground",
};

type CardProps = ComponentPropsWithoutRef<"article"> & {
  variant?: keyof typeof variants;
};

export function Card({
  variant = "surface",
  className = "",
  ...props
}: CardProps) {
  return (
    <article
      {...props}
      className={`overflow-hidden rounded-card border ${variants[variant]} ${className}`}
    />
  );
}
