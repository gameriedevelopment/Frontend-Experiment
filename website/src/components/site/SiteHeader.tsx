import { GamerieIcon } from "../ui/GamerieIcon";
import { links } from "../../links";
import { ActionLink } from "../ui/ActionLink";
import { Container } from "../ui/Section";
import { Brand } from "./Brand";

const navigation = [
  ["Platform", "#platform"],
  ["Who it’s for", "#community"],
  ["FAQ", "#faq"],
];

export function SiteHeader() {
  return (
    <header className="z-50 border-b border-white/12 bg-stage text-foreground story-scroll:sticky story-scroll:top-0">
      <Container className="grid grid-cols-[1fr_auto] items-center gap-x-4 md:h-[4.4375rem] md:grid-cols-[1fr_auto_1fr]">
        <div className="col-start-1 row-start-1 py-3.5 md:py-0">
          <Brand />
        </div>
        <nav
          aria-label="Main navigation"
          className="col-span-2 row-start-2 -mx-gutter flex gap-6 border-t border-white/12 px-gutter sm:gap-8 md:col-span-1 md:col-start-2 md:row-start-1 md:mx-0 md:border-0 md:px-0"
        >
          {navigation.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="flex min-h-11 items-center rounded-control text-sm font-semibold text-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="col-start-2 row-start-1 flex items-center justify-end gap-3 md:col-start-3 md:gap-5">
          <a
            href={links.signIn}
            className="hidden rounded-control text-sm font-semibold text-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand min-[420px]:inline"
          >
            Sign in
          </a>
          <ActionLink href={links.register} variant="secondary" size="compact">
            Join Gamerie <GamerieIcon name="external" size={16} />
          </ActionLink>
        </div>
      </Container>
    </header>
  );
}
