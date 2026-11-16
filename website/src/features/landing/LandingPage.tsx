import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AudienceSection } from "./audiences/AudienceSection";
import { BoardStory } from "./board-story/BoardStory";
import { FaqSection } from "./faq/FaqSection";
import { FeatureSection } from "./features/FeatureSection";
import { FinalCall } from "./final-call/FinalCall";
import { PerksSection } from "./perks/PerksSection";
import { StatsBand } from "./stats/StatsBand";

export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <BoardStory />
        <div className="relative z-10 -mt-12 overflow-clip rounded-t-panel bg-paper text-ink-950">
          <AudienceSection />
          <StatsBand />
          <FeatureSection />
          <PerksSection />
          <FaqSection />
          <FinalCall />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
