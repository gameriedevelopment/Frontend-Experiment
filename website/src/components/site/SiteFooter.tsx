import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { links, socialLinks } from "@/config/links";
import { hasCookiePreferences, openCookiePreferences } from "@/lib/consent";
import { Brand } from "./Brand";

const columns = [
  {
    title: "Platform",
    items: [
      { label: "How it works", href: "#platform" },
      { label: "Who it's for", href: "#audiences" },
      { label: "Features", href: "#features" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Discord", href: links.discord, external: true },
      { label: "Founding partners", href: links.partners, external: true },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms of service", href: links.terms, external: true },
      { label: "Privacy policy", href: links.privacy, external: true },
      { label: "Cookie policy", href: links.cookies, external: true },
      { label: "Community guidelines", href: links.guidelines, external: true },
      { label: "Minors policy", href: links.minors, external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-paper px-gutter pb-4 text-ink-950 sm:pb-6">
      <div className="relative mx-auto max-w-shell overflow-hidden rounded-panel bg-paper-deep px-6 pt-12 sm:px-10 lg:px-14 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Brand className="text-ink-950 [&_svg]:text-lavender-700" />
            <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-ink-700">
              The verified platform for competitive gamers. Your game, on the record.
            </p>
            <ButtonLink href={links.partners} external tone="ink" size="sm" icon="arrowUpRight" orb className="mt-7">
              Esports org? Partner with us
            </ButtonLink>
            <ul className="mt-8 flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="grid size-10 place-items-center rounded-full bg-ink-950/6 text-ink-950 transition-colors duration-300 hover:bg-ink-950 hover:text-lavender-300"
                  >
                    <Icon name={social.icon} className="size-4.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="type-label text-ink-950/50">{column.title}</h2>
                <ul className="mt-5 space-y-3">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        {...("external" in item && item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="group inline-flex items-center gap-1.5 text-[0.95rem] text-ink-700 transition-colors hover:text-ink-950"
                      >
                        {item.label}
                        {"external" in item && item.external && (
                          <Icon
                            name="arrowUpRight"
                            className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60"
                          />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="type-label mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ink-950/10 py-6 text-ink-950/50">
          <p>© {new Date().getFullYear()} Gamerie. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {hasCookiePreferences && (
              <button
                type="button"
                onClick={openCookiePreferences}
                className="type-label flex items-center gap-1.5 transition-colors hover:text-ink-950"
              >
                <Icon name="cookie" className="size-3.5" weight="bold" />
                Cookie settings
              </button>
            )}
            <p>Made for players, everywhere.</p>
          </div>
        </div>

        <div className="@container pb-6 sm:pb-10">
          <p
            aria-hidden="true"
            className="type-display pointer-events-none select-none whitespace-nowrap text-center text-[18cqw] leading-[0.8] tracking-[-0.04em] text-lavender-300"
          >
            Gamerie
          </p>
        </div>
      </div>
    </footer>
  );
}
