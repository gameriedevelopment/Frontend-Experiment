const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en");

/** Big figures stay exact below 100k, then compact. */
export const figure = (value: number) => (Math.abs(value) >= 100_000 ? compact.format(value) : whole.format(value));

/** "user.ban" or "ladder_dispute_resolved" as words. */
export function describeAction(action: string) {
  const words = action.replace(/[._:]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dayTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatDate = (value: string | null | undefined) => (value ? day.format(new Date(value)) : "—");
export const formatDateTime = (value: string | null | undefined) => (value ? dayTime.format(new Date(value)) : "—");

/** snake_case or lowercase statuses as a label: "in_progress" → "In progress". */
export const statusLabel = (value: string | null | undefined) => {
  if (!value) return "—";
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const ordinal = (value: number) => {
  const tail = value % 100 >= 11 && value % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ?? "th";
  return `${value}${tail}`;
};
