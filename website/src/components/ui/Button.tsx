import { cva, type VariantProps } from "class-variance-authority";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-full font-sans font-semibold uppercase tracking-[0.13em] transition-[background-color,color,box-shadow,transform] duration-300 ease-out-expo active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lavender-400",
  {
    variants: {
      tone: {
        lavender: "bg-lavender-400 text-ink-950 hover:bg-lavender-300",
        ink: "bg-ink-950 text-mist-50 hover:bg-ink-700",
        light: "bg-mist-50 text-ink-950 hover:bg-white",
        outline: "ring-1 ring-inset ring-current/25 hover:ring-current/60",
        ghost: "hover:bg-current/8",
      },
      size: {
        sm: "h-10 px-4 text-[0.66rem]",
        md: "h-12 px-6 text-[0.7rem]",
        lg: "h-14 px-7 text-[0.74rem]",
      },
      withOrb: { true: "", false: "" },
    },
    compoundVariants: [
      { withOrb: true, size: "sm", class: "pr-1" },
      { withOrb: true, size: "md", class: "pr-1.5" },
      { withOrb: true, size: "lg", class: "pr-2" },
    ],
    defaultVariants: { tone: "lavender", size: "md", withOrb: false },
  },
);

const orbVariants = cva(
  "grid place-items-center rounded-full transition-transform duration-500 ease-out-expo",
  {
    variants: {
      tone: {
        lavender: "bg-ink-950 text-lavender-300",
        ink: "bg-lavender-400 text-ink-950",
        light: "bg-ink-950 text-mist-50",
        outline: "bg-current/10",
        ghost: "bg-current/10",
      },
      size: { sm: "size-8", md: "size-9", lg: "size-10" },
    },
    defaultVariants: { tone: "lavender", size: "md" },
  },
);

type Variants = Omit<VariantProps<typeof buttonVariants>, "withOrb">;

type SharedProps = Variants & {
  icon?: IconName;
  orb?: boolean;
  children: ReactNode;
};

function Content({ icon, orb, tone, size, children }: SharedProps) {
  if (!icon) return <>{children}</>;
  if (!orb) {
    return (
      <>
        {children}
        <Icon name={icon} className="size-4" />
      </>
    );
  }
  const turns = icon === "arrowUpRight";
  return (
    <>
      {children}
      <span
        className={cn(
          orbVariants({ tone, size }),
          turns && "group-hover/button:rotate-45",
        )}
      >
        <Icon name={icon} className="size-4" weight="bold" />
      </span>
    </>
  );
}

type ButtonLinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
    external?: boolean;
  };

export function ButtonLink({
  tone,
  size,
  icon,
  orb = false,
  external,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={cn(buttonVariants({ tone, size, withOrb: orb && Boolean(icon) }), className)}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      {...props}
    >
      <Content icon={icon} orb={orb} tone={tone} size={size}>
        {children}
      </Content>
    </a>
  );
}

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Button({
  tone,
  size,
  icon,
  orb = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ tone, size, withOrb: orb && Boolean(icon) }), className)}
      {...props}
    >
      <Content icon={icon} orb={orb} tone={tone} size={size}>
        {children}
      </Content>
    </button>
  );
}
