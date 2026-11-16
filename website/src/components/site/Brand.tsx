export function Brand() {
  return (
    <a
      href="#top"
      aria-label="Gamerie home"
      className="inline-flex w-fit items-center gap-2.5 rounded-control font-display text-[1.65rem] leading-none font-bold tracking-[-0.06em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <img
        src="/favicon.svg"
        alt=""
        className="size-8"
        width="32"
        height="32"
      />
      Gamerie<span className="-ml-2 text-brand">.</span>
    </a>
  );
}
