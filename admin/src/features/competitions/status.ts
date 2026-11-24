type Tone = "signal" | "lavender" | "mist" | "danger";

const STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "mist" },
  registration: { label: "Registration", tone: "lavender" },
  check_in: { label: "Check-in", tone: "lavender" },
  awaiting_start: { label: "Starting", tone: "lavender" },
  upcoming: { label: "Upcoming", tone: "lavender" },
  live: { label: "Live", tone: "signal" },
  in_progress: { label: "Live", tone: "signal" },
  playoffs: { label: "Playoffs", tone: "signal" },
  paused: { label: "Paused", tone: "danger" },
  completed: { label: "Finished", tone: "mist" },
  archived: { label: "Archived", tone: "mist" },
  cancelled: { label: "Cancelled", tone: "danger" },
  active: { label: "Active", tone: "lavender" },
};

/** One vocabulary for tournament phases, ladder statuses and league seasons. */
export function competitionStatus(status: string | null | undefined): { label: string; tone: Tone } {
  if (status && STATUS[status]) return STATUS[status];
  return { label: status ? status.replace(/_/g, " ") : "—", tone: "mist" };
}
