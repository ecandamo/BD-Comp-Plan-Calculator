import { ComponentPropsWithoutRef, forwardRef } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InputProps = ComponentPropsWithoutRef<"input">;
type TextAreaProps = ComponentPropsWithoutRef<"textarea">;
type NumberProps = ComponentPropsWithoutRef<"input">;
type FieldGroupProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function FieldGroup({ label, children, className }: FieldGroupProps) {
  return (
    <label className={cn("block space-y-2", className)}>
      <Label className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      {children}
    </label>
  );
}

export function InputField({ className, ...props }: InputProps) {
  return <Input className={cn("h-11 rounded-lg bg-card", className)} {...props} />;
}

export function NumberField({ className, ...props }: NumberProps) {
  return <InputField className={cn("control-input", className)} type="number" {...props} />;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextAreaField({ className, ...props }, ref) {
  return <Textarea ref={ref} className={cn("rounded-lg bg-card", className)} {...props} />;
});
