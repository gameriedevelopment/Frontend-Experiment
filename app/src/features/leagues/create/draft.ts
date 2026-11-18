import type {
  LeagueBasicsInput,
  LeagueDetail,
  LeagueFormatInput,
  LeagueJoiningInput,
  LeaguePlayoffsInput,
  LeaguePrize,
  LeagueRulesInput,
  LeagueScheduleInput,
} from "../types";

export const LEAGUE_STEPS = [
  { key: "basics", label: "Basics" },
  { key: "format", label: "Format" },
  { key: "schedule", label: "Schedule" },
  { key: "rules", label: "Rules" },
  { key: "entry", label: "Entry & prizes" },
  { key: "review", label: "Review" },
] as const;

export type LeagueStep = (typeof LEAGUE_STEPS)[number]["key"];

export interface LeagueDraftForm {
  basics: LeagueBasicsInput;
  format: LeagueFormatInput;
  /** Dates are local "YYYY-MM-DDTHH:mm" strings while editing. */
  schedule: LeagueScheduleInput;
  rules: LeagueRulesInput;
  playoffs: LeaguePlayoffsInput;
  joining: LeagueJoiningInput;
  prize: { enabled: boolean; description: string; currency: string; places: number[] };
}

export type LeagueFormErrors = Record<string, string>;

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

export function localTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function emptyLeagueDraft(hubId: string): LeagueDraftForm {
  const starts = new Date(Date.now() + 7 * DAY);
  starts.setHours(0, 0, 0, 0);
  const ends = new Date(starts.getTime() + 10 * WEEK);
  return {
    basics: { hubId, name: "", gameId: "", platform: "", region: "", description: "" },
    format: { entrantType: "team", teamSize: 5, substitutes: 2, format: "single", groupCount: 0, groupAllocation: "random", playScope: "anyone" },
    schedule: { startsAt: toLocalInput(starts), endsAt: toLocalInput(ends), weekStartDay: 1, matchDay: 3, matchTime: "20:00", timeZone: localTimeZone() },
    rules: { winPoints: 3, drawPoints: 1, lossPoints: 0, allowDraws: false, bestOf: 3, tiebreakers: ["head_to_head", "game_difference", "games_won"], allowedMaps: [], allowedModes: [], rulesText: "" },
    playoffs: { size: 4, format: "single_elimination" },
    joining: { joinMode: "open", maxParticipants: 8, rosterChangesPerWeek: 1, organizersCanPlay: false },
    prize: { enabled: false, description: "", currency: "USD", places: [0, 0, 0] },
  };
}

export function leagueDraftFromDetail(league: LeagueDetail): LeagueDraftForm {
  const season = league.selectedSeason;
  const fallback = emptyLeagueDraft(league.host.id ?? "");
  if (!season) return { ...fallback, basics: { ...fallback.basics, name: league.name, gameId: league.game.id, platform: league.platform } };
  return {
    basics: {
      hubId: league.host.type === "hub" ? (league.host.id ?? undefined) : undefined,
      name: league.name,
      gameId: league.game.id,
      platform: league.platform,
      region: league.region ?? "",
      description: league.description ?? "",
    },
    format: {
      entrantType: league.entrantType,
      teamSize: league.teamSize ?? undefined,
      substitutes: league.substitutes,
      format: season.format,
      groupCount: season.groups.count,
      groupAllocation: season.groups.allocation,
      playScope: season.groups.playScope,
    },
    schedule: {
      startsAt: season.startsAt ? toLocalInput(new Date(season.startsAt)) : fallback.schedule.startsAt,
      endsAt: season.endsAt ? toLocalInput(new Date(season.endsAt)) : fallback.schedule.endsAt,
      weekStartDay: season.weekStartDay,
      matchDay: season.matchDay,
      matchTime: season.matchTime,
      timeZone: season.timeZone,
    },
    rules: {
      winPoints: season.points.win,
      drawPoints: season.points.draw,
      lossPoints: season.points.loss,
      allowDraws: season.allowDraws,
      bestOf: season.bestOf,
      tiebreakers: season.tiebreakers,
      allowedMaps: season.allowedMaps,
      allowedModes: season.allowedModes,
      rulesText: season.rulesText ?? "",
    },
    playoffs: { size: season.playoffs?.size ?? null, format: season.playoffs?.format ?? null },
    joining: {
      joinMode: league.joinMode,
      maxParticipants: season.maxParticipants,
      rosterChangesPerWeek: season.rosterChangesPerWeek,
      organizersCanPlay: Boolean(league.organizersCanPlay),
    },
    prize: {
      enabled: Boolean(season.prize),
      description: season.prize?.description ?? "",
      currency: season.prize?.currency ?? "USD",
      places: [1, 2, 3].map((placement) => season.prize?.places.find((place) => place.placement === placement)?.amount ?? 0),
    },
  };
}

/** Match weeks a full field needs, the same sum the API checks before publishing. */
export function weeksNeeded(form: LeagueDraftForm, field = form.joining.maxParticipants ?? 0) {
  if (field < 2) return 0;
  const { groupCount, playScope, format } = form.format;
  const perGroup = playScope === "own_group" && groupCount > 1 ? Math.ceil(field / groupCount) : field;
  const regular = (perGroup % 2 === 0 ? perGroup - 1 : perGroup) * (format === "double" ? 2 : 1);
  const size = form.playoffs.size ?? 0;
  if (size < 2) return regular;
  const rounds = Math.ceil(Math.log2(Math.min(size, field)));
  return regular + (form.playoffs.format === "double_elimination" ? rounds * 2 : rounds);
}

export function weeksAvailable(form: LeagueDraftForm) {
  const start = new Date(form.schedule.startsAt).getTime();
  const end = new Date(form.schedule.endsAt).getTime();
  return start && end && end > start ? Math.floor((end - start) / WEEK) : 0;
}

export function validateLeagueStep(step: LeagueStep, form: LeagueDraftForm): LeagueFormErrors {
  const errors: LeagueFormErrors = {};
  const all = step === "review";
  if (step === "basics" || all) {
    if (!form.basics.hubId) errors.hubId = "Choose the hub that runs this league.";
    if (form.basics.name.trim().length < 3) errors.name = "Use at least 3 characters.";
    if (!form.basics.gameId) errors.gameId = "Choose a game.";
    if (form.basics.platform.trim().length < 2) errors.platform = "Choose or enter a platform.";
  }
  if (step === "format" || all) {
    if (form.format.entrantType === "team" && (!form.format.teamSize || form.format.teamSize < 1)) errors.teamSize = "Choose the number of starters.";
    if (form.playoffs.size && form.joining.maxParticipants && form.playoffs.size > form.joining.maxParticipants) {
      errors.playoffs = "The playoffs can't be bigger than the field.";
    }
  }
  if (step === "schedule" || all) {
    const start = new Date(form.schedule.startsAt).getTime();
    const end = new Date(form.schedule.endsAt).getTime();
    if (!start) errors.startsAt = "Choose a start date.";
    else if (start <= Date.now()) errors.startsAt = "The season has to start in the future.";
    if (!end) errors.endsAt = "Choose an end date.";
    else if (start && (end - start < 6 * WEEK || end - start > 183 * DAY)) errors.endsAt = "A season runs for between 6 weeks and 6 months.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.schedule.matchTime)) errors.matchTime = "Use a time like 20:00.";
  }
  if (step === "rules" || all) {
    if (form.rules.winPoints < 1) errors.winPoints = "A win is worth at least 1 point.";
    if (form.rules.lossPoints > form.rules.winPoints) errors.lossPoints = "A loss can't be worth more than a win.";
  }
  if (step === "entry" || all) {
    if (form.joining.maxParticipants != null && form.joining.maxParticipants < 2) errors.maxParticipants = "The limit must be at least 2.";
    const needed = weeksNeeded(form);
    const available = weeksAvailable(form);
    if (needed && available && needed > available) {
      errors.maxParticipants = `A full field of ${form.joining.maxParticipants} needs ${needed} match weeks but the season has ${available}. Lower the limit, add groups or lengthen the season.`;
    }
    if (form.prize.enabled && form.prize.places.every((amount) => amount <= 0)) errors.prize = "Add at least one prize amount.";
  }
  return errors;
}

export function schedulePayload(form: LeagueDraftForm): LeagueScheduleInput {
  return { ...form.schedule, startsAt: new Date(form.schedule.startsAt).toISOString(), endsAt: new Date(form.schedule.endsAt).toISOString() };
}

export function prizePayload(form: LeagueDraftForm): LeaguePrize | null {
  if (!form.prize.enabled) return null;
  const places = form.prize.places.map((amount, index) => ({ placement: index + 1, amount })).filter((place) => place.amount > 0);
  return {
    description: form.prize.description.trim(),
    currency: form.prize.currency.toUpperCase() || "USD",
    total: places.reduce((sum, place) => sum + place.amount, 0),
    places,
  };
}

export function formatPayload(form: LeagueDraftForm): LeagueFormatInput {
  const team = form.format.entrantType === "team";
  return { ...form.format, teamSize: team ? form.format.teamSize : undefined, substitutes: team ? form.format.substitutes : undefined };
}

export function toLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
