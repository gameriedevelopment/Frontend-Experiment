import { useLocation } from "react-router-dom";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { TokenMark } from "@/components/ui/TokenMark";
import { publicLinks } from "@/config/links";
import { pageTitles } from "./navigation";

function titleFor(pathname: string) {
  if (pathname.startsWith("/profile/")) return "Profile";
  const section = `/${pathname.split("/")[1] ?? ""}`;
  return pageTitles[pathname] ?? pageTitles[section] ?? "Gamerie";
}

// Routes keep their real paths while each screen is rebuilt; until then they hand off to the live app.
export function PlaceholderPage() {
  const { pathname, search } = useLocation();
  const title = titleFor(pathname);

  return (
    <div className="grid gap-10">
      <PageHeader eyebrow="Gamerie" title={title} />
      <section className="relative isolate grid min-h-[24rem] place-items-center overflow-hidden rounded-panel bg-ink-900 px-6 py-16 text-center ring-1 ring-inset ring-white/6">
        <div
          aria-hidden="true"
          className="halftone absolute inset-0 -z-10 text-lavender-400/8 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]"
        />
        <div className="grid max-w-md justify-items-center gap-6">
          <span className="grid size-16 place-items-center rounded-2xl bg-ink-950 ring-1 ring-white/10">
            <TokenMark className="h-9 text-lavender-400" />
          </span>
          <div>
            <h2 className="type-display text-display-sm">{title} is next in the rebuild</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-mist-300">
              The new experience is landing screen by screen. Until this one arrives, it opens in the current Gamerie app.
            </p>
          </div>
          <ButtonLink
            href={new URL(`${pathname}${search}`, publicLinks.liveApp).href}
            tone="outline"
            icon="arrowUpRight"
          >
            Open in current app
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
