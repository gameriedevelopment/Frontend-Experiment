import Lenis from "lenis";
import { useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const LenisContext = createContext<Lenis | null>(null);

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const instance = new Lenis({ autoRaf: true, anchors: true, lerp: 0.11 });
    setLenis(instance);
    return () => {
      instance.destroy();
      setLenis(null);
    };
  }, [reducedMotion]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export function useSmoothScroll() {
  const lenis = useContext(LenisContext);

  const scrollTo = useCallback(
    (top: number) => {
      if (lenis) lenis.scrollTo(top, { duration: 1.6 });
      else window.scrollTo({ top });
    },
    [lenis],
  );

  const setLocked = useCallback(
    (locked: boolean) => {
      if (locked) lenis?.stop();
      else lenis?.start();
      document.documentElement.style.overflow = locked ? "hidden" : "";
    },
    [lenis],
  );

  return { scrollTo, setLocked };
}
