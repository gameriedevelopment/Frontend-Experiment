import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { useSmoothScroll } from "@/app/SmoothScroll";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { links } from "@/config/links";
import { cn } from "@/lib/cn";
import { Brand } from "./Brand";

const navigation = [
  { label: "Platform", href: "#platform" },
  { label: "Who it's for", href: "#audiences" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export function SiteHeader() {
  const { scrollY } = useScroll();
  const { setLocked } = useSmoothScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 32));

  useEffect(() => {
    setLocked(open);
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setLocked]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-gutter sm:pt-4">
      <div
        className={cn(
          "relative z-10 mx-auto flex h-14 max-w-shell items-center justify-between rounded-full pl-4 pr-2 transition-[background-color,box-shadow] duration-500 ease-out-expo sm:pl-5",
          scrolled || open
            ? "bg-ink-900/75 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/10 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <Brand />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mist-300 transition-colors hover:text-mist-50"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <a
            href={links.signIn}
            className="hidden rounded-full px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mist-300 transition-colors hover:text-mist-50 sm:block"
          >
            Sign in
          </a>
          <ButtonLink href={links.register} size="sm" icon="arrowUpRight" orb>
            Join Gamerie
          </ButtonLink>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className="grid size-10 place-items-center rounded-full text-mist-50 hover:bg-white/8 lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            className="fixed inset-0 flex flex-col justify-end bg-ink-950/96 px-gutter pb-10 pt-28 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <ul className="space-y-1">
              {navigation.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 + index * 0.05, ease: easeOutExpo }}
                >
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="type-display flex items-center justify-between border-b border-white/8 py-4 text-[2rem] leading-none"
                  >
                    {item.label}
                    <Icon name="arrowRight" className="size-6 text-lavender-400" />
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="mt-10 grid gap-3">
              <ButtonLink href={links.register} size="lg" icon="arrowUpRight" orb className="justify-between">
                Create your player ID
              </ButtonLink>
              <ButtonLink href={links.signIn} tone="outline" size="lg">
                Sign in
              </ButtonLink>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
