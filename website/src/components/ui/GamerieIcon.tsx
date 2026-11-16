const artwork = {
  identity: (
    <>
      <path d="M7 2.75H3v4m10-4h4v4M3 13.25v4h4m10-4v4h-4" />
      <path
        d="m10 5.75 4.25 4.25L10 14.25 5.75 10 10 5.75Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  players: (
    <>
      <circle cx="8" cy="6.75" r="2.5" />
      <path d="M2.75 16.25v-1.5a3 3 0 0 1 3-3h4.5a3 3 0 0 1 3 3v1.5H2.75ZM13.4 4.65a2.3 2.3 0 0 1 0 4.45m1.45 2.65a3 3 0 0 1 2.4 2.95v1.55" />
    </>
  ),
  team: (
    <>
      <path d="M10 2.85 16.25 5v4.85c0 3.55-2.5 5.85-6.25 7.3-3.75-1.45-6.25-3.75-6.25-7.3V5L10 2.85Z" />
      <path
        d="m10 6.15 3.15 3.28L10 12.7 6.85 9.43 10 6.15Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  competition: (
    <>
      <path d="M6.35 3.65h7.3v4.7a3.65 3.65 0 0 1-7.3 0v-4.7Zm0 1.8H3.1v1.7a3 3 0 0 0 3.45 2.95m7.1-4.65h3.25v1.7a3 3 0 0 1-3.45 2.95M10 12v3.85m-3.25.5h6.5" />
      <path
        d="m10 5.6 1.4 1.5L10 8.6 8.6 7.1 10 5.6Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  forward: <path d="M3.75 10h12m-4.5-4.5L15.75 10l-4.5 4.5" />,
  down: <path d="M10 3.75v12m-4.5-4.5L10 15.75l4.5-4.5" />,
  external: <path d="m5.1 14.9 9.8-9.8m-6.1 0h6.1v6.1" />,
  expand: <path d="M5.1 10h9.8M10 5.1v9.8" />,
};

export type GamerieIconName = keyof typeof artwork;

interface GamerieIconProps {
  name: GamerieIconName;
  size?: number;
  className?: string;
}

export function GamerieIcon({ name, size = 20, className }: GamerieIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {artwork[name]}
    </svg>
  );
}
