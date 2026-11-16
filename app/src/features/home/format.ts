const dayMs = 86_400_000;

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function formatToday(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(date);
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

/** "Today", "Tomorrow", a weekday within the next week, or a short date beyond that. */
export function formatRelativeDay(value: string | Date, now = new Date()) {
  const date = new Date(value);
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / dayMs);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days < 7) return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date);
}

/** formatRelativeDay for use mid-sentence: "today" and "tomorrow" in lower case, names as they are. */
export function formatSentenceDay(value: string | Date, now = new Date()) {
  const label = formatRelativeDay(value, now);
  return label === "Today" || label === "Tomorrow" ? label.toLowerCase() : label;
}

export function formatWhen(value: string | Date, now = new Date()) {
  return `${formatRelativeDay(value, now)} · ${formatTime(value)}`;
}
