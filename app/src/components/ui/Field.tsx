import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export const inputClasses =
  "h-12 w-full min-w-0 appearance-none rounded-2xl bg-white/4 px-4 text-[0.95rem] text-mist-50 outline-none pointer-coarse:text-base [&::-webkit-date-and-time-value]:text-left ring-1 ring-inset ring-white/10 transition-[background-color,box-shadow] duration-200 placeholder:text-mist-500 hover:ring-white/18 focus:bg-white/6 focus:ring-2 focus:ring-lavender-400 aria-[invalid=true]:ring-danger/70";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: ReactNode;
  error?: string;
  labelAction?: ReactNode;
};

export function FieldFrame({
  id,
  label,
  error,
  labelAction,
  children,
}: Pick<FieldProps, "id" | "label" | "error" | "labelAction"> & { children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-mist-200">
          {label}
        </label>
        {labelAction}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-[0.8rem] text-danger">
          <Icon name="warning" className="size-3.5" weight="bold" />
          {error}
        </p>
      )}
    </div>
  );
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { id, label, error, labelAction, className, ...props },
  ref,
) {
  return (
    <FieldFrame id={id} label={label} error={error} labelAction={labelAction}>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inputClasses, className)}
        {...props}
      />
    </FieldFrame>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, "type">>(
  function PasswordField({ id, label, error, labelAction, className, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <FieldFrame id={id} label={label} error={error} labelAction={labelAction}>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(inputClasses, "pr-12", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-xl text-mist-400 transition-colors hover:bg-white/6 hover:text-mist-50"
          >
            <Icon name={visible ? "eyeSlash" : "eye"} className="size-[1.1rem]" />
          </button>
        </div>
      </FieldFrame>
    );
  },
);

export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }
>(function Checkbox({ label, className, ...props }, ref) {
  return (
    <label className={cn("group relative inline-flex cursor-pointer select-none items-center gap-3 text-sm text-mist-300", className)}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span className="grid size-5 place-items-center rounded-md text-ink-950 ring-1 ring-inset ring-white/20 transition-colors group-hover:ring-white/35 peer-checked:bg-lavender-400 peer-checked:ring-lavender-400 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lavender-400 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
        <Icon name="check" className="size-3.5" weight="bold" />
      </span>
      {label}
    </label>
  );
});

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  error?: string;
  labelAction?: ReactNode;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { id, label, error, labelAction, className, maxLength, value, ...props },
  ref,
) {
  const length = typeof value === "string" ? value.length : 0;
  return (
    <FieldFrame
      id={id}
      label={label}
      error={error}
      labelAction={
        labelAction ??
        (maxLength ? (
          <span className="text-xs tabular-nums text-mist-500">
            {length} / {maxLength}
          </span>
        ) : undefined)
      }
    >
      <textarea
        ref={ref}
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inputClasses, "h-auto min-h-28 resize-y py-3 leading-relaxed", className)}
        {...props}
      />
    </FieldFrame>
  );
});
