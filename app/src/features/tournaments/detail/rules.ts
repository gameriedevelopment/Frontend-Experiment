import type { HostedTournamentDetail } from "../types";
import { formatMoney, ordinal } from "../utils";

export interface RuleSection {
  id: string;
  title: string;
  rules: string[];
}

const minutes = (value: number) =>
  value >= 1440
    ? `${value / 1440} day${value === 1440 ? "" : "s"}`
    : value >= 60
      ? `${value / 60} hour${value === 60 ? "" : "s"}`
      : `${value} minutes`;

export function ruleSections(t: HostedTournamentDetail): RuleSection[] {
  const rules = t.matchRules;
  const team = t.entrantType === "team";
  const side = team ? "team" : "player";
  const sides = team ? "teams" : "players";
  const leader = team ? "Team leaders" : "Players";
  const bestOf = rules?.bestOf.default ?? 1;
  const longer = Object.entries(rules?.bestOf.rounds ?? {}).filter(([, value]) => value !== bestOf);

  const format: string[] = [];
  if (t.format === "single_elimination") {
    format.push(
      `Single elimination for up to ${t.bracketSize} ${sides}. A ${side} is out after one series loss.`,
    );
    format.push(
      rules?.thirdPlaceMatch
        ? "The semifinal losers play a third-place match."
        : "There is no third-place match. Both semifinal losers place 3rd.",
    );
  } else if (t.format === "double_elimination") {
    format.push(
      `Double elimination for up to ${t.bracketSize} ${sides}. A first loss drops you to the lower bracket; a second loss eliminates.`,
    );
    format.push(
      rules?.grandFinalMode === "reset"
        ? "Grand final with bracket reset: the lower-bracket finalist must win twice."
        : rules?.grandFinalMode === "extended_series"
          ? "The grand final is a longer series."
          : "The grand final is a single series.",
    );
  } else {
    format.push(
      `${rules?.doubleRoundRobin ? "Double" : "Single"} round robin in ${rules?.groupCount ?? 1} group${(rules?.groupCount ?? 1) > 1 ? "s" : ""}. Everyone plays everyone in their group.`,
    );
    format.push(
      `A win is worth ${rules?.points.win ?? 3}, a draw ${rules?.points.draw ?? 1} and a loss ${rules?.points.loss ?? 0} points. Draws are ${rules?.allowDraws ? "allowed" : "not allowed"}.`,
    );
    if (rules?.tiebreakers.length) {
      const labels = {
        head_to_head: "head-to-head",
        game_difference: "game difference",
        games_won: "games won",
        wins: "series wins",
      };
      format.push(
        `Level on points is decided by ${rules.tiebreakers.map((item) => labels[item]).join(", then ")}. Anyone still level shares the place.`,
      );
    }
  }
  format.push(
    `Every series is best of ${bestOf}${longer.length ? `, with longer series in ${longer.length} later round${longer.length > 1 ? "s" : ""}` : ""}.`,
  );
  format.push(
    t.seedingMethod === "manual"
      ? "Seeds are set by the organizer. Top seeds get byes when fewer entrants check in than the bracket size."
      : "Seeds are drawn at random when the bracket is generated. Top seeds get byes when the field is short.",
  );

  const eligibility: string[] = [];
  if (team) {
    eligibility.push(
      `Teams of ${t.teamSize}${t.substitutes ? ` with up to ${t.substitutes} substitutes` : ""}. Every player needs a Gamerie account.`,
    );
  }
  eligibility.push(`A player can be on only one roster in this tournament.`);
  if (team) eligibility.push("Rosters lock at check-in. Only listed substitutes may play.");
  if (t.eligibility?.regions.length)
    eligibility.push(`Open to ${t.eligibility.regions.join(", ")} only.`);
  if (t.eligibility?.minRankingScore != null || t.eligibility?.maxRankingScore != null) {
    eligibility.push(
      `Gamerie ranking score between ${t.eligibility.minRankingScore ?? 0} and ${t.eligibility.maxRankingScore ?? "any"}${team ? " (starting players' average)" : ""}.`,
    );
  }
  if (t.eligibility?.minRosterSize)
    eligibility.push(`Rosters need at least ${t.eligibility.minRosterSize} players.`);

  const checkIn = [
    `Check-in opens ${t.schedule?.checkInOpensMinutesBefore ?? 60} minutes before the start and closes ${t.schedule?.checkInClosesMinutesBefore ?? 10} minutes before.`,
    `A ${side} that does not check in is removed, and the first checked-in ${side} on the waitlist takes the place.`,
    "When check-in closes the bracket is generated and the tournament starts.",
  ];

  const matches = [
    `Every match is a tournament challenge. It appears in Challenges and your Calendar automatically and cannot be declined.`,
    t.schedule?.roundMode === "fixed"
      ? "Rounds start at fixed times set by the organizer."
      : `Each round has a deadline. Opponents agree a time; if they do not, the organizer sets one.`,
    `${leader} mark ready at match time. A ${side} not ready ${rules?.noShowMinutes ?? 10} minutes after the match time forfeits. If neither is ready, both forfeit.`,
    "A Messages thread opens between the two sides when the match is created.",
  ];

  const scores = [
    `After the series, either ${team ? "team leader" : "player"} declares the final score, for example 2-1. No confirmation is needed.`,
    `The other side has ${minutes(rules?.reportWindowMinutes ?? 60)} to report a wrong result, or can accept it to move the bracket on sooner.`,
    "Once a score is declared, the other side cannot declare again; it can only report.",
    `Reports are decided by Gamerie admins. If there is no proof, the series is replayed within ${minutes(rules?.replayDeadlineMinutes ?? 1440)}.`,
    "The organizer cannot enter or change results.",
  ];

  const conduct = [
    "Cheating, playing on someone else's account, or fielding an unlisted player leads to disqualification.",
    "Abusive behaviour can be reported with Gamerie's report tools.",
    "The organizer may disqualify an entrant who breaks these rules. Gamerie admins may remove an entrant or the tournament.",
  ];

  const prizes: string[] = [];
  if (t.prize?.total) {
    const split = (t.prize.split ?? []).map(
      (row) => `${formatMoney(row.amount, t.prize!.currency)} for ${ordinal(row.placement)}`,
    );
    prizes.push(
      `${formatMoney(t.prize.total, t.prize.currency)} in total${split.length ? `: ${split.join(", ")}` : ""}.`,
    );
    if (t.prize.description) prizes.push(t.prize.description);
    prizes.push(
      `Prizes are paid by ${t.official ? "Gamerie" : (t.host.name ?? "the organizer")}, not by Gamerie.`,
    );
    if (!t.official) prizes.push("A prize that is not paid can be reported to Gamerie.");
  } else {
    prizes.push(
      "This tournament has no prize. Placements still go on every player's Gamerie record.",
    );
  }

  const sections: RuleSection[] = [
    { id: "format", title: "Format", rules: format },
    { id: "eligibility", title: "Eligibility and rosters", rules: eligibility },
    { id: "check-in", title: "Check-in", rules: checkIn },
    { id: "matches", title: "Matches", rules: matches },
    { id: "scores", title: "Scores and reports", rules: scores },
    { id: "conduct", title: "Conduct", rules: conduct },
    { id: "prizes", title: "Prizes", rules: prizes },
  ];
  if (rules?.rulesText?.trim()) {
    sections.splice(4, 0, { id: "organizer", title: "Organizer rules", rules: [] });
  }
  return sections;
}

export function keyRules(t: HostedTournamentDetail): string[] {
  const rules = t.matchRules;
  const team = t.entrantType === "team";
  return [
    team
      ? `Rosters lock at check-in${t.substitutes ? `; up to ${t.substitutes} substitutes per team` : ""}.`
      : "Check in during the check-in window to keep your place.",
    `${team ? "A team" : "A player"} not ready ${rules?.noShowMinutes ?? 10} minutes after match time forfeits.`,
    `${team ? "The team leader" : "Either player"} declares the final series score.`,
    `Wrong results can be reported within ${minutes(rules?.reportWindowMinutes ?? 60)}; Gamerie admins decide.`,
  ];
}
