import { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  children: ReactNode;
};

const variantClassNames = {
  primary: "brand-btn-primary",
  secondary: "brand-btn-secondary text-[var(--brand-blue)] dark:text-[var(--brand-highlight)]"
} as const;

const sizeClassNames = {
  sm: "px-3 py-2 text-sm font-medium",
  md: "px-4 py-2.5 text-sm font-semibold"
} as const;

export function Button({ className, variant = "primary", size = "md", type = "button", children, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClassNames[variant],
        sizeClassNames[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
