import type { ReactNode } from "react";
import { cardVariants } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/motion";
import { Accent, SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import { FeedTicker, FitGauge, HubRow, ProfileHighlights, Scoreboard } from "./FeatureWidgets";

type Surface = "stage" | "lavender" | "paper" | "outline";

const copyTone: Record<Surface, string> = {
  stage: "text-mist-300",
  lavender: "text-ink-950/70",
  paper: "text-ink-700",
  outline: "text-ink-700",
};

function FeatureCard({
  title,
  copy,
  surface,
  className,
  delay = 0,
  children,
}: {
  title: string;
  copy: string;
  surface: Surface;
  className?: string;
  delay?: number;
  children?: ReactNode;
}) {
  return (
    <Reveal delay={delay} className={cn("min-w-0", className)}>
      <article className={cn(cardVariants({ surface, padding: "none" }), "flex h-full flex-col gap-10 p-7 sm:p-9")}>
        <div>
          <h3 className="text-[1.35rem] font-semibold tracking-[-0.02em]">{title}</h3>
          <p className={cn("mt-2.5 max-w-md text-[0.95rem] leading-relaxed", copyTone[surface])}>{copy}</p>
        </div>
        {children && <div className="mt-auto">{children}</div>}
      </article>
    </Reveal>
  );
}

export function FeatureSection() {
  return (
    <section id="features" className="scroll-mt-24 bg-paper-deep px-gutter py-section">
      <div className="mx-auto max-w-shell">
        <Reveal>
          <SectionHeader
            tone="light"
            title={["Everything in", "one lobby."]}
            aside={
              <p>
                Profile, squad, team, feed and competition in one place, <Accent>instead of eight apps that never talk.</Accent>
              </p>
            }
          />
        </Reveal>

        <div className="mt-16 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            className="md:col-span-2"
            surface="stage"
            title="A profile that keeps up"
            copy="Gamerie reads your gaming history to surface your best achievements and playstyle, building a living resume of your potential."
          >
            <ProfileHighlights />
          </FeatureCard>
          <FeatureCard
            surface="lavender"
            title="Intelligent matchmaking"
            copy="Teammates matched on skill, playstyle and ambition."
            delay={0.08}
          >
            <FitGauge />
          </FeatureCard>
          <FeatureCard
            surface="paper"
            title="Challenge ecosystem"
            copy="Compete solo or with your team. Every verified result levels up your ranking."
          >
            <Scoreboard />
          </FeatureCard>
          <FeatureCard
            surface="paper"
            title="Live feed"
            copy="React to the latest results and posts from the players and teams you follow."
            delay={0.08}
          >
            <FeedTicker />
          </FeatureCard>
          <FeatureCard
            surface="outline"
            title="Career & scouting"
            copy="Direct access to esports orgs and sponsors looking for verified talent."
            delay={0.16}
          />
          <FeatureCard
            className="md:col-span-2"
            surface="outline"
            title="Teams & hubs"
            copy="Give rosters and communities a real home with roles, posts, membership and a shared history."
          >
            <HubRow />
          </FeatureCard>
          <FeatureCard
            surface="stage"
            title="Creator earnings"
            copy="Launch subscriptions, offer coaching and build a reliable income from your community."
            delay={0.08}
          >
            <p className="type-display text-display-lg text-lavender-400">80%</p>
            <p className="mt-2 text-sm text-mist-400">Yours to keep</p>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
