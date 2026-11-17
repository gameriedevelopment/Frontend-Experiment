import type {
  DraftPayload,
  GrandFinalMode,
  HostedFormat,
  HostedTournamentDetail,
  Tiebreaker,
} from "../types";
import { fromLocalInput, toLocalInput } from "../utils";

export const STEPS = [
  { key: "basics", label: "Basics", hint: "Host, game and where it is played" },
  { key: "format", label: "Format", hint: "Entrants, bracket and seeding" },
  { key: "rules", label: "Match rules", hint: "Best-of, timers and tiebreakers" },
  { key: "registration", label: "Registration", hint: "Who can join and check-in" },
  { key: "schedule", label: "Schedule & prizes", hint: "Start time, rounds and prize pool" },
  { key: "review", label: "Review", hint: "Check everything and publish" },
] as const;
export type StepKey = (typeof STEPS)[number]["key"];

export const BRACKET_SIZES = [4, 8, 16, 32, 64, 128, 256];
export const BEST_OF = [1, 3, 5, 7];
export const REGIONS = [
  "Europe",
  "North America",
  "South America",
  "Middle East",
  "Africa",
  "Asia",
  "Oceania",
  "Global",
];
export const TIEBREAKER_LABELS: Record<Tiebreaker, string> = {
  head_to_head: "Head-to-head",
  game_difference: "Game difference",
  games_won: "Games won",
  wins: "Series wins",
};

export interface DraftForm {
  basics: {
    host: string;
    name: string;
    gameId: string;
    platform: string;
    region: string;
    description: string;
    mode: "online" | "lan";
    venueName: string;
    venueAddress: string;
    stations: string;
  };
  format: {
    entrantType: "player" | "team";
    teamSize: number;
    substitutes: number;
    format: HostedFormat;
    bracketSize: number;
    seedingMethod: "manual" | "random";
    minEntrants: number;
    groupCount: number;
    doubleRoundRobin: boolean;
  };
  rules: {
    bestOf: number;
    rounds: Record<string, number>;
    thirdPlaceMatch: boolean;
    grandFinalMode: GrandFinalMode;
    win: number;
    draw: number;
    loss: number;
    allowDraws: boolean;
    tiebreakers: Tiebreaker[];
    noShowMinutes: number;
    reportWindowMinutes: number;
    replayDeadlineMinutes: number;
    rulesText: string;
  };
  registration: {
    registrationMode: "open" | "approval" | "invite";
    regions: string[];
    minRankingScore: string;
    maxRankingScore: string;
    minRosterSize: string;
    registrationClosesAt: string;
    checkInOpensMinutesBefore: number;
    checkInClosesMinutesBefore: number;
  };
  schedule: {
    startsAt: string;
    roundMode: "fixed" | "deadline";
    roundIntervalMinutes: number;
    hasPrize: boolean;
    prizeDescription: string;
    currency: string;
    prizeTotal: string;
    split: Array<{ placement: number; amount: string }>;
  };
}

const hostValue = (type: string, id: string) => `${type}:${id}`;

export function parseHost(value: string): { hostType: "user" | "team" | "hub"; hostId?: string } {
  const [type, id] = value.split(":");
  return type === "user" ? { hostType: "user" } : { hostType: type as "team" | "hub", hostId: id };
}

export function emptyDraft(userHost = ""): DraftForm {
  return {
    basics: {
      host: userHost,
      name: "",
      gameId: "",
      platform: "",
      region: "Europe",
      description: "",
      mode: "online",
      venueName: "",
      venueAddress: "",
      stations: "8",
    },
    format: {
      entrantType: "player",
      teamSize: 5,
      substitutes: 1,
      format: "single_elimination",
      bracketSize: 16,
      seedingMethod: "random",
      minEntrants: 4,
      groupCount: 1,
      doubleRoundRobin: false,
    },
    rules: {
      bestOf: 3,
      rounds: {},
      thirdPlaceMatch: false,
      grandFinalMode: "single",
      win: 3,
      draw: 1,
      loss: 0,
      allowDraws: false,
      tiebreakers: ["head_to_head", "game_difference", "games_won"],
      noShowMinutes: 10,
      reportWindowMinutes: 60,
      replayDeadlineMinutes: 1440,
      rulesText: "",
    },
    registration: {
      registrationMode: "open",
      regions: [],
      minRankingScore: "",
      maxRankingScore: "",
      minRosterSize: "",
      registrationClosesAt: "",
      checkInOpensMinutesBefore: 60,
      checkInClosesMinutesBefore: 10,
    },
    schedule: {
      startsAt: "",
      roundMode: "deadline",
      roundIntervalMinutes: 60,
      hasPrize: false,
      prizeDescription: "",
      currency: "USD",
      prizeTotal: "",
      split: [],
    },
  };
}

export function draftFromTournament(t: HostedTournamentDetail): DraftForm {
  const base = emptyDraft();
  const rules = t.matchRules;
  return {
    basics: {
      host: t.host.type && t.host.id ? hostValue(t.host.type, t.host.id) : base.basics.host,
      name: t.name,
      gameId: t.gameId ?? "",
      platform: t.platform,
      region: t.region ?? base.basics.region,
      description: t.description ?? "",
      mode: t.mode,
      venueName: t.venue?.name ?? "",
      venueAddress: t.venue?.address ?? "",
      stations: String(t.venue?.stations ?? base.basics.stations),
    },
    format: {
      entrantType: t.entrantType ?? base.format.entrantType,
      teamSize: t.teamSize && t.entrantType === "team" ? t.teamSize : base.format.teamSize,
      substitutes: t.substitutes ?? base.format.substitutes,
      format: t.format ?? base.format.format,
      bracketSize: t.bracketSize ?? base.format.bracketSize,
      seedingMethod: t.seedingMethod ?? base.format.seedingMethod,
      minEntrants: t.minEntrants ?? base.format.minEntrants,
      groupCount: rules?.groupCount ?? 1,
      doubleRoundRobin: rules?.doubleRoundRobin ?? false,
    },
    rules: rules
      ? {
          bestOf: rules.bestOf.default,
          rounds: { ...(rules.bestOf.rounds ?? {}) },
          thirdPlaceMatch: rules.thirdPlaceMatch,
          grandFinalMode: rules.grandFinalMode,
          win: rules.points.win,
          draw: rules.points.draw,
          loss: rules.points.loss,
          allowDraws: rules.allowDraws,
          tiebreakers: rules.tiebreakers,
          noShowMinutes: rules.noShowMinutes,
          reportWindowMinutes: rules.reportWindowMinutes,
          replayDeadlineMinutes: rules.replayDeadlineMinutes,
          rulesText: rules.rulesText ?? "",
        }
      : base.rules,
    registration: {
      registrationMode: t.registrationMode ?? "open",
      regions: t.eligibility?.regions ?? [],
      minRankingScore: t.eligibility?.minRankingScore?.toString() ?? "",
      maxRankingScore: t.eligibility?.maxRankingScore?.toString() ?? "",
      minRosterSize: t.eligibility?.minRosterSize?.toString() ?? "",
      registrationClosesAt: toLocalInput(t.registrationClosesAt),
      checkInOpensMinutesBefore: t.schedule?.checkInOpensMinutesBefore ?? 60,
      checkInClosesMinutesBefore: t.schedule?.checkInClosesMinutesBefore ?? 10,
    },
    schedule: {
      startsAt: toLocalInput(t.startsAt),
      roundMode: t.schedule?.roundMode ?? "deadline",
      roundIntervalMinutes: t.schedule?.roundIntervalMinutes ?? 60,
      hasPrize: Boolean(t.prize),
      prizeDescription: t.prize?.description ?? "",
      currency: t.prize?.currency ?? "USD",
      prizeTotal: t.prize ? String(t.prize.total) : "",
      split: (t.prize?.split ?? []).map((entry) => ({
        placement: entry.placement,
        amount: String(entry.amount),
      })),
    },
  };
}

/** Steps the server already holds, so the stepper can mark them complete. */
export function completedSteps(t: HostedTournamentDetail | undefined): Set<StepKey> {
  const done = new Set<StepKey>();
  if (!t) return done;
  done.add("basics");
  if (t.entrantType && t.bracketSize && t.minEntrants) done.add("format");
  if (t.matchRules) done.add("rules");
  if (t.registrationClosesAt && t.schedule?.checkInOpensMinutesBefore) done.add("registration");
  if (t.startsAt && t.schedule?.roundMode) done.add("schedule");
  return done;
}

const number = (value: string) => (value.trim() === "" ? null : Number(value));

export type StepErrors = Partial<Record<string, string>>;

export function validateStep(step: StepKey, form: DraftForm, now = Date.now()): StepErrors {
  const errors: StepErrors = {};
  if (step === "basics") {
    const b = form.basics;
    if (!b.host) errors.host = "Choose who is hosting";
    if (b.name.trim().length < 3) errors.name = "Use at least 3 characters";
    if (b.name.trim().length > 80) errors.name = "Keep it under 80 characters";
    if (!b.gameId) errors.gameId = "Choose a game from the Games page";
    if (!b.platform) errors.platform = "Choose a platform";
    if (!b.region) errors.region = "Choose a region";
    if (b.mode === "lan") {
      if (b.venueName.trim().length < 2) errors.venueName = "Add the venue name";
      if (b.venueAddress.trim().length < 4) errors.venueAddress = "Add the venue address";
      const stations = Number(b.stations);
      if (!Number.isInteger(stations) || stations < 1 || stations > 512) {
        errors.stations = "Between 1 and 512 stations";
      }
    }
  }
  if (step === "format") {
    const f = form.format;
    if (f.minEntrants < 2 || f.minEntrants > f.bracketSize) {
      errors.minEntrants = `Between 2 and ${f.bracketSize}`;
    }
    if (f.format === "round_robin") {
      if (f.groupCount * 2 > f.bracketSize) errors.groupCount = "Each group needs two entrants";
      if (f.minEntrants < f.groupCount * 2) {
        errors.minEntrants = `At least ${f.groupCount * 2} to fill every group`;
      }
    }
  }
  if (step === "rules") {
    if (form.rules.rulesText.length > 10000)
      errors.rulesText = "Keep rules under 10,000 characters";
  }
  if (step === "registration") {
    const r = form.registration;
    const closes = fromLocalInput(r.registrationClosesAt);
    if (!closes) errors.registrationClosesAt = "Choose when registration closes";
    else if (new Date(closes).getTime() <= now)
      errors.registrationClosesAt = "Pick a time in the future";
    if (r.checkInClosesMinutesBefore + 10 > r.checkInOpensMinutesBefore) {
      errors.checkInClosesMinutesBefore = "Keep check-in open for at least 10 minutes";
    }
    const min = number(r.minRankingScore);
    const max = number(r.maxRankingScore);
    if (min !== null && max !== null && min > max)
      errors.minRankingScore = "Minimum is above maximum";
  }
  if (step === "schedule") {
    const s = form.schedule;
    const starts = fromLocalInput(s.startsAt);
    if (!starts) errors.startsAt = "Choose a start time";
    else {
      const checkInOpens =
        new Date(starts).getTime() - form.registration.checkInOpensMinutesBefore * 60_000;
      if (checkInOpens < now + 5 * 60_000) {
        errors.startsAt = "Start later: check-in must open at least 5 minutes from now";
      }
      const closes = fromLocalInput(form.registration.registrationClosesAt);
      const checkInCloses =
        new Date(starts).getTime() - form.registration.checkInClosesMinutesBefore * 60_000;
      if (closes && new Date(closes).getTime() > checkInCloses) {
        errors.startsAt = "Registration must close before check-in closes";
      }
    }
    if (s.hasPrize) {
      const total = Number(s.prizeTotal);
      if (!Number.isFinite(total) || total <= 0) errors.prizeTotal = "Enter the prize pool";
      if (!/^[A-Z]{3}$/.test(s.currency)) errors.currency = "Use a 3-letter currency code";
      const placements = s.split.map((entry) => entry.placement);
      if (new Set(placements).size !== placements.length) errors.split = "Each place once";
      if (placements.some((p) => p > form.format.bracketSize))
        errors.split = "A place is beyond the bracket size";
      const sum = s.split.reduce((acc, entry) => acc + (Number(entry.amount) || 0), 0);
      if (s.split.length && Math.abs(sum - total) > 0.009) {
        errors.split = "The split must add up to the prize pool";
      }
    }
  }
  return errors;
}

export function sectionPayload(step: StepKey, form: DraftForm): DraftPayload {
  if (step === "basics") {
    const b = form.basics;
    return {
      basics: {
        ...parseHost(b.host),
        name: b.name.trim(),
        gameId: b.gameId,
        platform: b.platform,
        region: b.region,
        description: b.description.trim() || undefined,
        mode: b.mode,
        venue:
          b.mode === "lan"
            ? {
                name: b.venueName.trim(),
                address: b.venueAddress.trim(),
                stations: Number(b.stations),
              }
            : undefined,
      },
    };
  }
  if (step === "format") {
    const f = form.format;
    const team = f.entrantType === "team";
    return {
      format: {
        entrantType: f.entrantType,
        teamSize: team ? f.teamSize : undefined,
        substitutes: team ? f.substitutes : undefined,
        format: f.format,
        bracketSize: f.bracketSize,
        seedingMethod: f.seedingMethod,
        minEntrants: f.minEntrants,
        groupCount: f.format === "round_robin" ? f.groupCount : undefined,
        doubleRoundRobin: f.format === "round_robin" ? f.doubleRoundRobin : undefined,
      },
    };
  }
  if (step === "rules") {
    const r = form.rules;
    const rounds = Object.fromEntries(
      Object.entries(r.rounds).filter(([, value]) => value && value !== r.bestOf),
    );
    return {
      rules: {
        bestOf: { default: r.bestOf, rounds },
        thirdPlaceMatch: r.thirdPlaceMatch,
        grandFinalMode: r.grandFinalMode,
        points: { win: r.win, draw: r.draw, loss: r.loss },
        allowDraws: r.allowDraws,
        tiebreakers: r.tiebreakers,
        noShowMinutes: r.noShowMinutes,
        reportWindowMinutes: r.reportWindowMinutes,
        replayDeadlineMinutes: r.replayDeadlineMinutes,
        rulesText: r.rulesText.trim() || undefined,
      },
    };
  }
  if (step === "registration") {
    const r = form.registration;
    return {
      registration: {
        registrationMode: r.registrationMode,
        eligibility: {
          minRankingScore: number(r.minRankingScore),
          maxRankingScore: number(r.maxRankingScore),
          regions: r.regions,
          minRosterSize: form.format.entrantType === "team" ? number(r.minRosterSize) : null,
        },
        registrationClosesAt: fromLocalInput(r.registrationClosesAt)!,
        checkInOpensMinutesBefore: r.checkInOpensMinutesBefore,
        checkInClosesMinutesBefore: r.checkInClosesMinutesBefore,
      },
    };
  }
  if (step === "schedule") {
    const s = form.schedule;
    return {
      schedule: {
        startsAt: fromLocalInput(s.startsAt)!,
        roundMode: s.roundMode,
        roundIntervalMinutes: s.roundIntervalMinutes,
        prize: s.hasPrize
          ? {
              description: s.prizeDescription.trim(),
              currency: s.currency,
              total: Number(s.prizeTotal),
              split: s.split.map((entry) => ({
                placement: entry.placement,
                amount: Number(entry.amount) || 0,
              })),
            }
          : null,
      },
    };
  }
  return {};
}

/** Suggested split by placement: 50/30/20 for three places, scaled for two or four. */
export function suggestSplit(
  total: number,
  places: number,
): Array<{ placement: number; amount: string }> {
  const weights =
    places >= 4 ? [45, 25, 15, 15] : places === 3 ? [50, 30, 20] : places === 2 ? [65, 35] : [100];
  let allotted = 0;
  return weights.map((weight, index) => {
    const amount =
      index === weights.length - 1
        ? Math.round((total - allotted) * 100) / 100
        : Math.round(((total * weight) / 100) * 100) / 100;
    allotted += amount;
    return { placement: index + 1, amount: String(amount) };
  });
}

export interface PreviewRound {
  key: string;
  label: string;
  matches: number;
}

export interface FormatPreview {
  lanes: Array<{ title: string; rounds: PreviewRound[] }>;
  groups: number[] | null;
  totalMatches: number;
  guaranteed: number;
}

const upperName = (fromEnd: number, _total: number, round: number, double: boolean) => {
  const names = ["Final", "Semifinal", "Quarterfinal"];
  if (fromEnd < names.length)
    return double ? `Upper ${names[fromEnd].toLowerCase()}` : names[fromEnd];
  return double ? `Upper round ${round}` : `Round of ${2 ** (fromEnd + 1)}`;
};

/** Mirrors the server's bracket engine so the create flow can preview structure and match counts. */
export function previewFormat(
  format: DraftForm["format"],
  rules: DraftForm["rules"],
): FormatPreview {
  const size = format.bracketSize;
  const upperRounds = Math.log2(size);
  if (format.format === "round_robin") {
    const groups = Array.from(
      { length: format.groupCount },
      (_, index) =>
        Math.floor(size / format.groupCount) + (index < size % format.groupCount ? 1 : 0),
    );
    const legs = format.doubleRoundRobin ? 2 : 1;
    const totalMatches = groups.reduce((sum, n) => sum + ((n * (n - 1)) / 2) * legs, 0);
    const largest = Math.max(...groups);
    const roundsCount = (largest % 2 ? largest : largest - 1) * legs;
    return {
      lanes: [
        {
          title: "Rounds",
          rounds: Array.from({ length: roundsCount }, (_, index) => ({
            key: `group:${index + 1}`,
            label: `Round ${index + 1}`,
            matches: Math.floor(largest / 2) * groups.length,
          })),
        },
      ],
      groups,
      totalMatches,
      guaranteed: (Math.min(...groups) - 1) * legs,
    };
  }

  const double = format.format === "double_elimination";
  const upper: PreviewRound[] = Array.from({ length: upperRounds }, (_, index) => ({
    key: `upper:${index + 1}`,
    label: upperName(upperRounds - index - 1, upperRounds, index + 1, double),
    matches: size / 2 ** (index + 1),
  }));
  if (!double) {
    const third = rules.thirdPlaceMatch && upperRounds >= 2;
    return {
      lanes: [
        {
          title: "Bracket",
          rounds: third
            ? [...upper, { key: "third_place:1", label: "Third-place match", matches: 1 }]
            : upper,
        },
      ],
      groups: null,
      totalMatches: size - 1 + (third ? 1 : 0),
      guaranteed: 1,
    };
  }

  const lowerRounds = 2 * (upperRounds - 1);
  const lower: PreviewRound[] = Array.from({ length: lowerRounds }, (_, index) => ({
    key: `lower:${index + 1}`,
    label: index + 1 === lowerRounds ? "Lower final" : `Lower round ${index + 1}`,
    matches: size / 2 ** (Math.ceil((index + 1) / 2) + 1),
  }));
  const finals: PreviewRound[] = [{ key: "grand_final:1", label: "Grand final", matches: 1 }];
  if (rules.grandFinalMode === "reset") {
    finals.push({ key: "grand_final:2", label: "Grand final reset", matches: 1 });
  }
  return {
    lanes: [
      { title: "Upper bracket", rounds: upper },
      { title: "Lower bracket", rounds: lower },
      { title: "Grand final", rounds: finals },
    ],
    groups: null,
    totalMatches: 2 * size - 2 + (rules.grandFinalMode === "reset" ? 1 : 0),
    guaranteed: 2,
  };
}
