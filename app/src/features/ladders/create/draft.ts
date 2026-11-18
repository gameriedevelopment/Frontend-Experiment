import type {
  LadderBasicsInput,
  LadderDatesPrizeInput,
  LadderDetail,
  LadderFormatInput,
  LadderJoiningInput,
  LadderRulesInput,
} from "../types";

export const LADDER_STEPS = [
  { key: "basics", label: "Identity" },
  { key: "competition", label: "Competition" },
  { key: "access", label: "Access & dates" },
  { key: "review", label: "Review" },
] as const;

export type LadderStep = (typeof LADDER_STEPS)[number]["key"];

export interface LadderDraftForm {
  basics: LadderBasicsInput;
  format: LadderFormatInput;
  rules: LadderRulesInput;
  joining: LadderJoiningInput;
  schedule: {
    startsAt: string;
    endsAt: string;
    prizeEnabled: boolean;
    prizeDescription: string;
    prizeCurrency: string;
    prizePlaces: number[];
  };
}

export type LadderFormErrors = Record<string, string>;

export function emptyLadderDraft(hostId: string): LadderDraftForm {
  const starts = new Date(Date.now() + 24 * 60 * 60 * 1000);
  starts.setMinutes(0, 0, 0);
  const ends = new Date(starts.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    basics: {
      hostType: "user",
      hostId,
      name: "",
      gameId: "",
      platform: "",
      region: "",
      description: "",
    },
    format: {
      entrantType: "player",
      groupCount: 0,
      groupAllocation: "random",
      playScope: "anyone",
    },
    rules: {
      winPoints: 3,
      drawPoints: 1,
      allowDraws: true,
      bestOf: 1,
      rematchWaitHours: 168,
      minimumMatchesForPrizes: 5,
      allowedMaps: [],
      allowedModes: [],
      rulesText: "",
    },
    joining: { joinMode: "open", maxParticipants: null, organizersCanPlay: false },
    schedule: {
      startsAt: toLocalInput(starts),
      endsAt: toLocalInput(ends),
      prizeEnabled: false,
      prizeDescription: "",
      prizeCurrency: "USD",
      prizePlaces: [0, 0, 0],
    },
  };
}

export function ladderDraftFromDetail(ladder: LadderDetail): LadderDraftForm {
  return {
    basics: {
      hostType: ladder.host.type === "gamerie" ? "user" : ladder.host.type,
      hostId: ladder.host.id,
      name: ladder.name,
      gameId: ladder.game.id,
      platform: ladder.platform,
      region: ladder.region || "",
      description: ladder.description,
    },
    format: {
      entrantType: ladder.entrantType,
      teamSize: ladder.teamSize ?? undefined,
      substitutes: ladder.substitutes,
      groupCount: ladder.groups.count,
      groupAllocation: ladder.groups.allocation,
      playScope: ladder.groups.playScope,
    },
    rules: {
      winPoints: ladder.points.win,
      drawPoints: ladder.points.draw,
      allowDraws: ladder.allowDraws,
      bestOf: ladder.bestOf as 1 | 3 | 5,
      rematchWaitHours: ladder.rematchWaitHours ?? ladder.rematchWaitDays * 24,
      minimumMatchesForPrizes: ladder.minimumMatchesForPrizes,
      allowedMaps: ladder.allowedMaps,
      allowedModes: ladder.allowedModes,
      rulesText: ladder.rulesText,
    },
    joining: { joinMode: ladder.joinMode, maxParticipants: ladder.maxParticipants, organizersCanPlay: Boolean(ladder.organizersCanPlay) },
    schedule: {
      startsAt: ladder.startsAt ? toLocalInput(new Date(ladder.startsAt)) : "",
      endsAt: ladder.endsAt ? toLocalInput(new Date(ladder.endsAt)) : "",
      prizeEnabled: Boolean(ladder.prize),
      prizeDescription: ladder.prize?.description ?? "",
      prizeCurrency: ladder.prize?.currency ?? "USD",
      prizePlaces: [1, 2, 3].map(
        (placement) =>
          ladder.prize?.places.find((place) => place.placement === placement)?.amount ?? 0,
      ),
    },
  };
}

export function validateLadderStep(step: LadderStep, form: LadderDraftForm): LadderFormErrors {
  const errors: LadderFormErrors = {};
  if (step === "basics" || step === "review") {
    if (form.basics.name.trim().length < 3) errors.name = "Use at least 3 characters.";
    if (!form.basics.gameId) errors.gameId = "Choose a game.";
    if (form.basics.platform.trim().length < 2) errors.platform = "Choose or enter a platform.";
  }
  if (step === "competition" || step === "review") {
    if (form.format.entrantType === "team" && (!form.format.teamSize || form.format.teamSize < 1)) {
      errors.teamSize = "Enter the number of starting players.";
    }
    if (form.rules.rematchWaitHours < 0 || form.rules.rematchWaitHours > 720) errors.rematchWait = "Use a wait between none and 30 days.";
    if (!form.rules.allowedModes.length) errors.allowedModes = "Choose at least one mode players can use.";
    if (form.rules.winPoints < 0 || form.rules.winPoints > 100)
      errors.winPoints = "Use 0 to 100 points.";
    if (form.rules.allowDraws && (form.rules.drawPoints < 0 || form.rules.drawPoints > 100)) {
      errors.drawPoints = "Use 0 to 100 points.";
    }
  }
  if (step === "access" || step === "review") {
    if (!form.schedule.startsAt) errors.startsAt = "Choose a start date.";
    if (!form.schedule.endsAt) errors.endsAt = "Choose an end date.";
    const start = new Date(form.schedule.startsAt).getTime();
    const end = new Date(form.schedule.endsAt).getTime();
    if (start && end && end <= start) errors.endsAt = "The end must be after the start.";
    if (form.joining.maxParticipants != null && form.joining.maxParticipants < 2) {
      errors.maxParticipants = "The limit must be at least 2.";
    }
    if (form.schedule.prizeEnabled && form.schedule.prizePlaces.every((amount) => amount <= 0)) {
      errors.prizePlaces = "Add at least one prize amount.";
    }
  }
  return errors;
}

export function datesAndPrizePayload(form: LadderDraftForm): LadderDatesPrizeInput {
  const places = form.schedule.prizePlaces
    .map((amount, index) => ({ placement: index + 1, amount }))
    .filter((place) => place.amount > 0);
  return {
    startsAt: new Date(form.schedule.startsAt).toISOString(),
    endsAt: new Date(form.schedule.endsAt).toISOString(),
    prize: form.schedule.prizeEnabled
      ? {
          description: form.schedule.prizeDescription.trim(),
          currency: form.schedule.prizeCurrency.toUpperCase(),
          total: places.reduce((total, place) => total + place.amount, 0),
          places,
        }
      : null,
  };
}

function toLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
