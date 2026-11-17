import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useEffect, useRef } from "react";

// emoji-mart themes itself on its own element, so the palette is set there rather than inherited.
const palette: Record<string, string> = {
  "--rgb-accent": "198, 163, 255",
  "--rgb-background": "23, 19, 34",
  "--rgb-color": "236, 232, 246",
  "--rgb-input": "33, 28, 48",
  "--color-border": "rgba(255, 255, 255, 0.08)",
  "--color-border-over": "rgba(255, 255, 255, 0.16)",
  "--font-family": "inherit",
  "--border-radius": "20px",
  "--shadow": "none",
};

/** Loaded on demand: the emoji data is large and most visits never open the picker. */
export default function EmojiPanel({ onSelect }: { onSelect: (emoji: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const apply = () => {
      const picker = ref.current?.querySelector<HTMLElement>("em-emoji-picker");
      if (!picker) {
        frame = requestAnimationFrame(apply);
        return;
      }
      Object.entries(palette).forEach(([name, value]) => picker.style.setProperty(name, value));
    };
    apply();
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div ref={ref}>
      <Picker
        data={data}
        theme="dark"
        previewPosition="none"
        skinTonePosition="search"
        navPosition="bottom"
        perLine={8}
        maxFrequentRows={2}
        onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)}
      />
    </div>
  );
}
