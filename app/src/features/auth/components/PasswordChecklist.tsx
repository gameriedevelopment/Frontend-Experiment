import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** The rules sign-up enforces; password resets use the same ones so accounts stay consistent. */
export const passwordRules = [
  { label: "8+ characters", test: (value: string) => value.length >= 8 },
  { label: "Uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "Number", test: (value: string) => /[0-9]/.test(value) },
  { label: "Symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul aria-label="Password requirements" className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {passwordRules.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-2 text-[0.8rem] transition-colors duration-300",
              met ? "text-mist-200" : "text-mist-500",
            )}
          >
            <span
              className={cn(
                "grid size-4 place-items-center rounded-full transition-colors duration-300",
                met ? "bg-lavender-400 text-ink-950" : "ring-1 ring-inset ring-white/15",
              )}
            >
              {met && <Icon name="check" className="size-2.5" weight="bold" />}
            </span>
            {rule.label}
            <span className="sr-only">{met ? "met" : "not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}
