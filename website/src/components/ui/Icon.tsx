import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  AtIcon,
  BinocularsIcon,
  CaretDownIcon,
  CastleTurretIcon,
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
  SealCheckIcon,
  ShieldStarIcon,
  SparkleIcon,
  TiktokLogoIcon,
  TrophyIcon,
  UserFocusIcon,
  UsersThreeIcon,
  XIcon,
  XLogoIcon,
  YoutubeLogoIcon,
  type Icon as PhosphorIcon,
  type IconWeight,
} from "@phosphor-icons/react";
import type { SVGProps } from "react";
import { cn } from "@/lib/cn";

const icons = {
  identity: UserFocusIcon,
  community: UsersThreeIcon,
  team: ShieldStarIcon,
  verified: SealCheckIcon,
  hub: CastleTurretIcon,
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
