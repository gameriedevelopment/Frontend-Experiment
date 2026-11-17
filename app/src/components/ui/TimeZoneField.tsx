import { useMemo, useState, type ReactNode } from "react";
import { Combobox } from "./Combobox";

interface TimezoneOption {
  value: string;
  label: string;
}

function timezoneOffsetMinutes(timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
    const match = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
  } catch {
    return 0;
  }
}

function formatOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "GMT";
  const sign = offsetMinutes > 0 ? "+" : "−";
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  return minutes ? `GMT ${sign}${hours}:${String(minutes).padStart(2, "0")}` : `GMT ${sign}${hours}`;
}

let timezoneCache: TimezoneOption[] | undefined;

function getTimezoneOptions(): TimezoneOption[] {
  if (timezoneCache) return timezoneCache;
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
  const supported = intl.supportedValuesOf?.("timeZone") ?? ["UTC"];
  const zones = supported.includes("UTC") ? supported : ["UTC", ...supported];
  timezoneCache = zones
    .map((zone) => ({ value: zone, label: `${zone.replace(/_/g, " ")} (${formatOffset(timezoneOffsetMinutes(zone))})` }))
    .sort((left, right) => {
      if (left.value === "UTC") return -1;
      if (right.value === "UTC") return 1;
      return left.label.localeCompare(right.label);
    });
  return timezoneCache;
}

export const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export const timeZoneLabel = (zone: string) => getTimezoneOptions().find((option) => option.value === zone)?.label ?? zone.replace(/_/g, " ");

/** Every time zone with this device's first, so nobody needs to know their zone's name to find it. */
export function TimeZoneField({ id, label = "Time zone", value, onChange, hint }: { id: string; label?: string; value: string; onChange: (zone: string) => void; hint?: ReactNode }) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => {
    const term = query.trim().toLowerCase();
    const device = deviceTimeZone();
    const matches = getTimezoneOptions().filter((zone) => !term || zone.label.toLowerCase().includes(term));
    const own = matches.find((zone) => zone.value === device);
    return [...(own ? [own] : []), ...matches.filter((zone) => zone !== own)].map((zone) => ({
      value: zone.value,
      label: zone.label,
      description: zone === own ? "This device's time zone" : undefined,
    }));
  }, [query]);

  return (
    <Combobox
      id={id}
      label={label}
      placeholder="Search time zones"
      query={query}
      onQueryChange={setQuery}
      options={options}
      browse
      browseLabel="All time zones"
      hint={hint}
      value={value ? { value, label: timeZoneLabel(value) } : null}
      onChange={(option) => onChange(option?.value ?? "")}
    />
  );
}
