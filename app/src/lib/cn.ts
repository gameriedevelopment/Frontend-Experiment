import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-lg",
            "display-md",
            "display-sm",
            "heading",
            "lead",
            "label",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Display titles step down a size for long names, so a hero never wraps into three lines. */
export const titleSize = (text: string | undefined, long = 22) =>
  (text?.length ?? 0) > long ? "text-[clamp(1.75rem,3.4vw,2.75rem)]" : "text-heading";
