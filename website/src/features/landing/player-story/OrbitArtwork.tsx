export function OrbitArtwork() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,var(--color-orbit-core)_0%,var(--color-orbit-mid)_35%,var(--color-orbit-edge)_62%,var(--color-stage)_83%)]" />
      <div className="absolute inset-0 opacity-[var(--orbital-light,.68)] [background:radial-gradient(ellipse_at_var(--light-x,50%)_var(--light-y,40%),var(--color-orbit-glow),transparent_57%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-orbit-grid)_0.8px,transparent_0.8px)] bg-size-[8px_8px] opacity-60 [mask-image:radial-gradient(ellipse_at_50%_55%,black_28%,transparent_72%)]" />

      <svg
        viewBox="0 0 720 660"
        fill="none"
        className="absolute left-1/2 top-1/2 h-[112%] w-[108%] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-(--ring-angle) overflow-visible text-brand-light"
      >
        <circle
          cx="360"
          cy="330"
          r="284"
          stroke="currentColor"
          strokeOpacity=".25"
        />
        <circle
          cx="360"
          cy="330"
          r="268"
          stroke="currentColor"
          strokeOpacity=".45"
          strokeDasharray="1 7"
        />
        <circle
          cx="360"
          cy="330"
          r="208"
          stroke="currentColor"
          strokeOpacity=".32"
          strokeDasharray="2 5"
        />
        <circle
          cx="360"
          cy="330"
          r="188"
          stroke="currentColor"
          strokeOpacity=".19"
        />
        <path
          d="M94 228a283 283 0 0 1 256-180m276 383a283 283 0 0 1-256 180"
          stroke="currentColor"
          strokeOpacity=".85"
          strokeWidth="1.7"
          strokeDasharray="5 7"
        />
        <path
          d="M360 620v-13M49 330h13M360 40v13m311 277h-13"
          stroke="currentColor"
          strokeOpacity=".75"
          strokeWidth="1.5"
        />
        <path
          d="M126 96l14 14m440 440 14 14m0-468-14 14M140 550l-14 14"
          stroke="currentColor"
          strokeOpacity=".36"
        />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_46%,transparent_34%,var(--color-stage-fade)_75%,var(--color-stage)_97%)]" />
    </div>
  );
}
