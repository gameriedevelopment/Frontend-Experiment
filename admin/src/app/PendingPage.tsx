import { useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { navFor } from "./shell/navigation";

/** Sections still being rebuilt say so plainly, with the release that brings them. */
export function PendingPage() {
  const { pathname } = useLocation();
  const item = navFor(pathname);
  useDocumentTitle(item?.label ?? "Admin");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader title={item?.label ?? "Not found"} />
      <section className="relative overflow-hidden rounded-card bg-ink-900/70 p-8 ring-1 ring-inset ring-white/6 sm:p-12">
        <div aria-hidden="true" className="halftone absolute inset-0 text-lavender-400/8 mask-[radial-gradient(60%_80%_at_100%_0%,black,transparent)]" />
        <div className="relative max-w-xl">
          <span className="grid size-11 place-items-center rounded-xl bg-lavender-400/12 text-lavender-200">
            <Icon name={item?.icon ?? "info"} className="size-5" />
          </span>
          <p className="type-label mt-6 text-lavender-300">{item?.phase ? `Arrives in phase ${item.phase}` : "Not part of the console"}</p>
          <p className="mt-3 text-lead text-mist-200">
            {item?.phase
              ? `${item.label} is being rebuilt for this console. Until it lands, use the current admin panel for it.`
              : "There's nothing at this address."}
          </p>
        </div>
      </section>
    </div>
  );
}
