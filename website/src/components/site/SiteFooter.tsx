import { links } from "../../links";
import { Container } from "../ui/Section";
import { Brand } from "./Brand";

const footerGroups = [
  {
    name: "Platform",
    items: [
      ["Explore Gamerie", "#platform"],
      ["Who it’s for", "#community"],
      ["FAQ", "#faq"],
    ],
  },
  {
    name: "Community",
    items: [
      ["Discord", links.discord],
      ["Partners", links.partners],
      ["Sign in", links.signIn],
    ],
  },
  {
    name: "Legal",
    items: [
      ["Terms", links.terms],
      ["Privacy", links.privacy],
      ["Cookie policy", links.cookies],
      ["Community guidelines", links.guidelines],
      ["Minors policy", links.minors],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/12 bg-deep">
      <Container className="pt-10 pb-6 sm:pt-12">
        <div className="grid gap-8 md:grid-cols-[0.95fr_2.05fr]">
          <div>
            <Brand />
            <p className="mt-4 text-sm text-secondary">
              Play. Connect. Belong.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-6 sm:grid-cols-3"
          >
            {footerGroups.map(({ name, items }) => (
              <div key={name}>
                <h2 className="mb-3 text-sm font-bold text-foreground">
                  {name}
                </h2>
                <ul className="flex flex-col gap-2">
                  {items.map(([label, href]) => (
                    <li key={href}>
                      <a
                        href={href}
                        className="inline-block rounded-control py-0.5 text-sm text-secondary hover:text-brand-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p className="mt-9 border-t border-white/12 pt-5 text-xs text-secondary">
          © {new Date().getFullYear()} Gamerie
        </p>
      </Container>
    </footer>
  );
}
