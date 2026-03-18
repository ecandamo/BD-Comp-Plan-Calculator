import { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/utils";
import { Button } from "./button";

type ToggleIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  expanded: boolean;
};

export function ToggleIconButton({ expanded, className, ...props }: ToggleIconButtonProps) {
  return (
    <Button variant="secondary" size="sm" className={cn("h-10 w-10 rounded-full p-0", className)} {...props}>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")}
      >
        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Button>
  );
}
