import type { ReactNode } from "react";
import { cardVariants } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";
import { Accent, SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { FeedTicker, FitGauge, HubRow, ProfileInsights, Scoreboard } from "./FeatureWidgets";

type Surface = "stage" | "lavender" | "paper" | "outline";

const iconTile: Record<Surface, string> = {
  stage: "bg-lavender-400 text-ink-950",
  lavender: "bg-ink-950 text-lavender-300",
  paper: "bg-ink-950 text-lavender-300",
  outline: "bg-lavender-400 text-ink-950",
};

const copyTone: Record<Surface, string> = {
  stage: "text-mist-300",
  lavender: "text-ink-950/70",
  paper: "text-ink-700",
  outline: "text-ink-700",
};

function FeatureCard({
  icon,
  title,
  copy,
  surface,
  className,
  delay = 0,
  children,
}: {
  icon: IconName;
  title: string;
  copy: string;
  surface: Surface;
  className?: string;
  delay?: number;
  children?: ReactNode;
}) {
  return (
    <Reveal delay={delay} className={cn("min-w-0", className)}>
      <article
        className={cn(
          cardVariants({ surface, padding: "md", interactive: true }),
          "flex h-full flex-col gap-7",
        )}
      >
        <div>
          <span className={cn("grid size-11 place-items-center rounded-2xl", iconTile[surface])}>
            <Icon name={icon} />
          </span>
          <h3 className="type-display mt-6 text-display-sm">{title}</h3>
          <p className={cn("mt-3 max-w-md text-[0.95rem] leading-relaxed", copyTone[surface])}>{copy}</p>
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
            eyebrow="The platform"
            title={["Everything in", "one lobby."]}
            aside={
              <p>
                Profile, squad, team, feed and competition in one place, <Accent>instead of eight apps that never talk.</Accent>
              </p>
            }
          />
        </Reveal>

        <div className="mt-14 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            className="md:col-span-2"
            surface="stage"
            icon="spark"
            title="A profile that keeps up"
            copy="Gamerie reads your gaming history to surface your best achievements and playstyle, building a living resume of your potential."
          >
            <ProfileInsights />
          </FeatureCard>
          <FeatureCard
            surface="lavender"
            icon="community"
            title="Intelligent matchmaking"
            copy="Teammates matched on skill, playstyle and ambition."
            delay={0.08}
          >
            <FitGauge />
          </FeatureCard>
          <FeatureCard
            surface="paper"
            icon="target"
            title="Challenge ecosystem"
            copy="Compete solo or with your team. Every verified result levels up your ranking."
          >
            <Scoreboard />
          </FeatureCard>
          <FeatureCard
            surface="paper"
            icon="feed"
            title="Live feed"
            copy="React to the latest results and posts from the players and teams you follow."
            delay={0.08}
          >
            <FeedTicker />
          </FeatureCard>
          <FeatureCard
            surface="outline"
            icon="radar"
            title="Career & scouting"
            copy="Direct access to esports orgs and sponsors looking for verified talent."
            delay={0.16}
          >
            <div className="flex flex-wrap gap-2">
              <Tag tone="paper" size="md">Verified talent</Tag>
              <Tag tone="paper" size="md">Scout requests</Tag>
              <Tag tone="paper" size="md">Trials</Tag>
            </div>
          </FeatureCard>
          <FeatureCard
            className="md:col-span-2"
            surface="outline"
            icon="hub"
            title="Teams & hubs"
            copy="Give rosters and communities a real home with roles, posts, membership and a shared history."
          >
            <HubRow />
          </FeatureCard>
          <FeatureCard
            surface="stage"
            icon="coin"
            title="Creator earnings"
            copy="Launch subscriptions, offer coaching and build a reliable income from your community."
            delay={0.08}
          >
            <p className="type-display text-display-lg text-lavender-400">
              80%
              <span className="type-label ml-3 align-middle text-mist-300">Yours to keep</span>
            </p>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
