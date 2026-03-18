import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "../../lib/utils";

type SurfaceVariant = "panel";

type SurfaceProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  variant?: SurfaceVariant;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const variantClassNames: Record<SurfaceVariant, string> = {
  panel: "panel"
};

export function Surface<T extends ElementType = "div">({ as, children, className, variant = "panel", ...props }: SurfaceProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={cn(variantClassNames[variant], className)} {...props}>
      {children}
    </Component>
  );
}
