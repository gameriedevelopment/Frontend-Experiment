import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  AtIcon,
  BinocularsIcon,
  CaretDownIcon,
  ChatCircleDotsIcon,
  CheckIcon,
  CoinsIcon,
  CookieIcon,
  CrosshairIcon,
  CrownIcon,
  DiscordLogoIcon,
  FlaskIcon,
  GameControllerIcon,
  GiftIcon,
  HeadsetIcon,
  InstagramLogoIcon,
  LightningIcon,
  LinkedinLogoIcon,
  ListChecksIcon,
  ListIcon,
  LockSimpleIcon,
  NewspaperIcon,
  PlusIcon,
  SparkleIcon,
  TiktokLogoIcon,
  TrophyIcon,
  XIcon,
  XLogoIcon,
  YoutubeLogoIcon,
  type Icon as PhosphorIcon,
  type IconWeight,
} from "@phosphor-icons/react";
import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

const solid = { fill: "currentColor", stroke: "none" } as const;

// Gamerie's own identity glyphs, drawn on the token motif. Everything generic comes from Phosphor.
const glyphs = {
  token: (
    <>
      <circle cx="12" cy="6" r="3.25" {...solid} />
      <rect x="8.75" y="10.75" width="6.5" height="10.5" rx="3.25" {...solid} />
    </>
  ),
  identity: (
    <>
      <path d="M3.5 8V3.5H8M16 3.5h4.5V8M20.5 16v4.5H16M8 20.5H3.5V16" />
      <circle cx="12" cy="8.5" r="2.25" />
      <path d="M9.75 17.5v-2.25a2.25 2.25 0 0 1 4.5 0v2.25" />
    </>
  ),
  community: (
    <>
      <circle cx="12" cy="5.5" r="2.25" />
      <path d="M9.75 13.5V12a2.25 2.25 0 0 1 4.5 0v1.5" />
      <circle cx="5" cy="12" r="1.75" />
      <path d="M3.25 19.5v-1.25a1.75 1.75 0 0 1 3.5 0v1.25" />
      <circle cx="19" cy="12" r="1.75" />
      <path d="M17.25 19.5v-1.25a1.75 1.75 0 0 1 3.5 0v1.25M8 16.5h.01M12 17.5h.01M16 16.5h.01" />
    </>
  ),
  team: (
    <>
      <path d="M12 2.75 19.5 5.5v6c0 4.6-3.1 7.9-7.5 9.75C7.6 19.4 4.5 16.1 4.5 11.5v-6L12 2.75Z" />
      <circle cx="12" cy="9" r="1.75" />
      <path d="M10.25 15.5v-1.75a1.75 1.75 0 0 1 3.5 0v1.75" />
    </>
  ),
  verified: (
    <>
      <path d="M8.25 3h7.5L21 8.25v7.5L15.75 21h-7.5L3 15.75v-7.5L8.25 3Z" />
      <path d="m8.5 12.25 2.4 2.4 4.6-4.9" />
    </>
  ),
  hub: (
    <>
      <path d="M12 2.75 20 7.4v9.2l-8 4.65-8-4.65V7.4l8-4.65Z" />
      <circle cx="12" cy="10" r="2" />
      <path d="M8.75 16.25a3.25 3.25 0 0 1 6.5 0" />
    </>
  ),
} satisfies Record<string, ReactNode>;

const library = {
  arrowUpRight: ArrowUpRightIcon,
  arrowRight: ArrowRightIcon,
  arrowDown: ArrowDownIcon,
  chevronDown: CaretDownIcon,
  plus: PlusIcon,
  menu: ListIcon,
  close: XIcon,
  check: CheckIcon,
  lock: LockSimpleIcon,
  trophy: TrophyIcon,
  spark: SparkleIcon,
  radar: BinocularsIcon,
  target: CrosshairIcon,
  coin: CoinsIcon,
  feed: NewspaperIcon,
  crown: CrownIcon,
  at: AtIcon,
  vote: ListChecksIcon,
  gift: GiftIcon,
  flask: FlaskIcon,
  headset: HeadsetIcon,
  controller: GameControllerIcon,
  chat: ChatCircleDotsIcon,
  bolt: LightningIcon,
  cookie: CookieIcon,
  discord: DiscordLogoIcon,
  x: XLogoIcon,
  instagram: InstagramLogoIcon,
  tiktok: TiktokLogoIcon,
  youtube: YoutubeLogoIcon,
  linkedin: LinkedinLogoIcon,
} satisfies Record<string, PhosphorIcon>;

type GlyphName = keyof typeof glyphs;
type LibraryName = keyof typeof library;
export type IconName = GlyphName | LibraryName;
export type { IconWeight };

const glyphStroke: Record<IconWeight, number> = {
  thin: 0.75,
  light: 1.1,
  regular: 1.5,
  bold: 2.25,
  fill: 1.5,
  duotone: 1.5,
};

const isLibraryIcon = (name: IconName): name is LibraryName => name in library;

type IconProps = Omit<SVGProps<SVGSVGElement>, "name" | "ref"> & {
  name: IconName;
  weight?: IconWeight;
};

export function Icon({ name, weight = "regular", className, ...props }: IconProps) {
  const classes = cn("size-5 shrink-0", className);

  if (isLibraryIcon(name)) {
    const LibraryIcon = library[name];
    return (
      <LibraryIcon weight={weight} aria-hidden="true" focusable="false" className={classes} {...props} />
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={glyphStroke[weight]}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={classes}
      {...props}
    >
      {glyphs[name]}
    </svg>
  );
}
