import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { AudienceSection } from "./AudienceSection";
import { FaqSection } from "./FaqSection";
import { FinalCall } from "./FinalCall";
import { PlayerStory } from "./player-story/PlayerStory";

export function LandingPage() {
  return (
    <div id="top">
      <a
        href="#main"
        className="sr-only z-60 rounded-full bg-brand px-4 py-3 font-bold text-stage focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="story-scroll:scroll-mt-18">
        <PlayerStory />
        <AudienceSection />
        <FaqSection />
        <FinalCall />
      </main>
      <SiteFooter />
    </div>
  );
}
