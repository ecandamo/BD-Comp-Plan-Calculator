import { ComponentPropsWithoutRef, forwardRef } from "react";

import { cn } from "../../lib/utils";

type InputProps = ComponentPropsWithoutRef<"input">;
type SelectProps = ComponentPropsWithoutRef<"select">;
type TextAreaProps = ComponentPropsWithoutRef<"textarea">;
type NumberProps = ComponentPropsWithoutRef<"input">;
type FieldGroupProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function FieldGroup({ label, children, className }: FieldGroupProps) {
  return (
    <label className={cn("block", className)}>
      <div className="mb-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
      {children}
    </label>
  );
}

export function InputField({ className, ...props }: InputProps) {
  return <input className={cn("brand-input w-full rounded-[1.15rem] px-4 py-3 text-sm", className)} {...props} />;
}

export function NumberField({ className, ...props }: NumberProps) {
  return <InputField className={cn("control-input", className)} type="number" {...props} />;
}

export function SelectField({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn("field-shell w-full rounded-[1.15rem] px-4 py-3 text-sm text-slate-900 dark:text-slate-100", className)} {...props}>
      {children}
    </select>
  );
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextAreaField({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn("brand-input w-full rounded-[1.15rem] px-4 py-3 text-sm", className)} {...props} />;
});
