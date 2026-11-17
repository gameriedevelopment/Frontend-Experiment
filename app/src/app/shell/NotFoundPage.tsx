import { LinkButton } from "@/components/ui/Button";
import { StatePanel } from "@/components/ui/StatePanel";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

/** Unknown addresses inside the app say so, rather than quietly landing on Home. */
export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="grid min-h-[60svh] place-items-center">
      <StatePanel
        icon="search"
        title="This page doesn't exist"
        description="The link may be old or mistyped. Search for what you were after, or head home."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <LinkButton to="/home" size="sm" icon="home">
              Go home
            </LinkButton>
            <LinkButton to="/search" tone="outline" size="sm" icon="search">
              Search
            </LinkButton>
          </div>
        }
      />
    </div>
  );
}
