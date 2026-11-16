import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

const solid = { fill: "currentColor", stroke: "none" } as const;

const glyphs = {
  arrowUpRight: <path d="M7 17 17 7M8.5 7H17v8.5" />,
  arrowRight: <path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" />,
  arrowDown: <path d="M12 4.5v15M5.5 13l6.5 6.5 6.5-6.5" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 9h16M4 15h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
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
  trophy: (
    <>
      <path d="M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0V4Z" />
      <path d="M7.5 6H4.5v1.5a3 3 0 0 0 3 3M16.5 6h3v1.5a3 3 0 0 1-3 3M12 14v3.5M8 20.5h8M9.5 17.5h5" />
    </>
  ),
  verified: (
    <>
      <path d="M8.25 3h7.5L21 8.25v7.5L15.75 21h-7.5L3 15.75v-7.5L8.25 3Z" />
      <path d="m8.5 12.25 2.4 2.4 4.6-4.9" />
    </>
  ),
  spark: (
    <>
      <path d="M11 4.5c.7 4.3 3.2 6.8 7.5 7.5-4.3.7-6.8 3.2-7.5 7.5-.7-4.3-3.2-6.8-7.5-7.5 4.3-.7 6.8-3.2 7.5-7.5Z" />
      <path d="M19 2.5v3.5M17.25 4.25h3.5" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="m12 12 6-6" />
      <circle cx="15.75" cy="9.25" r="1" {...solid} />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" {...solid} />
    </>
  ),
  coin: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 1.66 3.13 3 7 3s7-1.34 7-3V7M5 12v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" />
    </>
  ),
  feed: (
    <>
      <rect x="3.5" y="4" width="17" height="7" rx="2" />
      <rect x="3.5" y="13" width="17" height="7" rx="2" />
      <path d="M7 7.5h6M7 16.5h4" />
    </>
  ),
  hub: (
    <>
      <path d="M12 2.75 20 7.4v9.2l-8 4.65-8-4.65V7.4l8-4.65Z" />
      <circle cx="12" cy="10" r="2" />
      <path d="M8.75 16.25a3.25 3.25 0 0 1 6.5 0" />
    </>
  ),
  crown: (
    <>
      <path d="M3.5 8.5 8 12l4-6.5 4 6.5 4.5-3.5-1.75 10H5.25L3.5 8.5Z" />
      <path d="M6 21h12" />
    </>
  ),
  at: (
    <>
      <circle cx="12" cy="12" r="3.75" />
      <path d="M15.75 12v1.5a2.75 2.75 0 0 0 5.5 0V12a9.25 9.25 0 1 0-3.6 7.3" />
    </>
  ),
  vote: (
    <>
      <path d="M4 13.5h16v6.5H4zM7.5 13.5V5h9v8.5" />
      <path d="m9.5 9 1.75 1.75L14.5 7.5" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="8" width="17" height="4.5" rx="1" />
      <path d="M5 12.5v8h14v-8M12 8v12.5M12 8S10.5 3.5 8 4.25 9 8 12 8Zm0 0s1.5-4.5 4-3.75S15 8 12 8Z" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3.5h5M10.5 3.5v5.25L5 18.5a1.5 1.5 0 0 0 1.3 2.25h11.4A1.5 1.5 0 0 0 19 18.5l-5.5-9.75V3.5" />
      <path d="M7.5 14.5h9" />
    </>
  ),
  headset: (
    <>
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <rect x="3.5" y="13.5" width="4" height="6" rx="1.5" />
      <rect x="16.5" y="13.5" width="4" height="6" rx="1.5" />
      <path d="M18.5 19.5c0 1.1-1.5 2-4 2H13" />
    </>
  ),
  controller: (
    <>
      <path d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.4l-.9 4.4a2.5 2.5 0 0 1-4.3 1.2l-1.7-2h-5l-1.7 2a2.5 2.5 0 0 1-4.3-1.2l-.9-4.4A4.5 4.5 0 0 1 7 7.5Z" />
      <path d="M8 10.5v3M6.5 12h3" />
      <circle cx="15.5" cy="11" r="0.9" {...solid} />
      <circle cx="17.5" cy="13" r="0.9" {...solid} />
    </>
  ),
  chat: (
    <>
      <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 3.5v-3.5a2 2 0 0 1-2-2v-8Z" />
      <path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01" />
    </>
  ),
  bolt: <path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12L13 3Z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof glyphs;

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
};

export function Icon({ name, className, strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("size-5 shrink-0", className)}
      {...props}
    >
      {glyphs[name]}
    </svg>
  );
}
