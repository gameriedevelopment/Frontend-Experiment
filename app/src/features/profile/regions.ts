export const PROFILE_REGIONS = [
  "Global",
  "North America",
  "South America",
  "Europe",
  "Western Europe",
  "Northern Europe",
  "Southern Europe",
  "Eastern Europe",
  "Central Europe",
  "Africa",
  "West Africa",
  "North Africa",
  "East Africa",
  "Central Africa",
  "Southern Africa",
  "Middle East",
  "Asia",
  "Oceania",
] as const;

/** The broad regions, for quick pickers. The profile editor offers the finer ones too. */
export const MAIN_REGIONS: ReadonlyArray<(typeof PROFILE_REGIONS)[number]> = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Middle East",
  "Asia",
  "Oceania",
  "Global",
];
