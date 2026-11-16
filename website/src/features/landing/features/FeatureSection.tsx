import type { ReactNode } from "react";
import { cardVariants } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/motion";
import { Accent, SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import { Bracket, ConnectedGames, FeedTicker, HubRow, LeaderboardPreview, Scoreboard } from "./FeatureWidgets";

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
                Profile, teams, competition and conversation in one place, <Accent>instead of a dozen apps that never talk.</Accent>
              </p>
            }
          />
        </Reveal>

        <div className="mt-16 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            className="md:col-span-2"
            surface="stage"
            title="Your games, connected"
            copy="Link the accounts you already play on, and your games come with you to your profile."
          >
            <ConnectedGames />
          </FeatureCard>
          <FeatureCard
            surface="lavender"
            title="Leaderboards"
            copy="Rank players and teams by score, wins, win rate, tournament wins, matches or challenges, overall or by game."
            delay={0.08}
          >
            <LeaderboardPreview />
          </FeatureCard>
          <FeatureCard
            surface="paper"
            title="Challenges"
            copy="Challenge a player or a team, agree a time and play. The result goes on your record."
          >
            <Scoreboard />
          </FeatureCard>
          <FeatureCard
            surface="paper"
            title="Feed & messages"
            copy="Follow players, teams and hubs, react to their results and posts, and message players directly."
            delay={0.08}
          >
            <FeedTicker />
          </FeatureCard>
          <FeatureCard
            surface="outline"
            title="Ladders"
            copy="Season-long standings with points, groups and your own rules. Open to anyone, by approval, for your hub only, or private."
            delay={0.16}
          />
          <FeatureCard
            className="md:col-span-2"
            surface="outline"
            title="Teams & hubs"
            copy="Teams get rosters, roles and posts. Hubs bring teams together, and players join through their team."
          >
            <HubRow />
          </FeatureCard>
          <FeatureCard
            surface="stage"
            title="Hosted tournaments"
            copy="Single elimination, double elimination or round robin, hosted by you, your team or your hub."
            delay={0.08}
          >
            <Bracket />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
