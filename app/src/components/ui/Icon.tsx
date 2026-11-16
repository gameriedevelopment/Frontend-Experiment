import {
  AppleLogoIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BellSimpleIcon,
  CalendarDotsIcon,
  CaretDownIcon,
  CastleTurretIcon,
  ChatsCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  CompassIcon,
  DiscordLogoIcon,
  DotsThreeIcon,
  EyeIcon,
  EnvelopeSimpleIcon,
  EyeSlashIcon,
  FacebookLogoIcon,
  GameControllerIcon,
  GearSixIcon,
  GoogleLogoIcon,
  HouseSimpleIcon,
  InfoIcon,
  LightningIcon,
  ListChecksIcon,
  MagnifyingGlassIcon,
  MedalIcon,
  PlusIcon,
  RankingIcon,
  SealCheckIcon,
  ShieldStarIcon,
  SidebarSimpleIcon,
  SignOutIcon,
  SparkleIcon,
  SwordIcon,
  TrophyIcon,
  UserFocusIcon,
  UserIcon,
  UsersThreeIcon,
  WarningCircleIcon,
  XIcon,
  type Icon as PhosphorIcon,
  type IconWeight,
} from "@phosphor-icons/react";
import type { SVGProps } from "react";
import { cn } from "@/lib/cn";

const icons = {
  feed: HouseSimpleIcon,
  discover: CompassIcon,
  games: GameControllerIcon,
  team: ShieldStarIcon,
  hub: CastleTurretIcon,
  messages: ChatsCircleIcon,
  matches: ListChecksIcon,
  challenges: SwordIcon,
  trophy: TrophyIcon,
  ladders: RankingIcon,
  leaderboard: MedalIcon,
  calendar: CalendarDotsIcon,
  identity: UserFocusIcon,
  community: UsersThreeIcon,
  verified: SealCheckIcon,
  user: UserIcon,
  search: MagnifyingGlassIcon,
  bell: BellSimpleIcon,
  settings: GearSixIcon,
  signOut: SignOutIcon,
  sidebar: SidebarSimpleIcon,
  more: DotsThreeIcon,
  eye: EyeIcon,
  eyeSlash: EyeSlashIcon,
  mail: EnvelopeSimpleIcon,
  warning: WarningCircleIcon,
  info: InfoIcon,
  check: CheckIcon,
  plus: PlusIcon,
  close: XIcon,
  spinner: CircleNotchIcon,
  spark: SparkleIcon,
  bolt: LightningIcon,
  chevronDown: CaretDownIcon,
  arrowLeft: ArrowLeftIcon,
  arrowRight: ArrowRightIcon,
  arrowUpRight: ArrowUpRightIcon,
  google: GoogleLogoIcon,
  facebook: FacebookLogoIcon,
  discord: DiscordLogoIcon,
  apple: AppleLogoIcon,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof icons;
export type { IconWeight };

type IconProps = Omit<SVGProps<SVGSVGElement>, "name" | "ref"> & {
  name: IconName;
  weight?: IconWeight;
};

export function Icon({ name, weight = "regular", className, ...props }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      weight={weight}
      aria-hidden="true"
      focusable="false"
      className={cn("size-5 shrink-0", className)}
      {...props}
    />
  );
}
