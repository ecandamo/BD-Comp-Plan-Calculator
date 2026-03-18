import { ReactNode } from "react";

import { cn } from "../../lib/utils";

type SectionHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function SectionHeader({ eyebrow, title, description, meta, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
        <h3 className={cn(eyebrow ? "mt-2" : "", "text-lg font-semibold text-slate-950 dark:text-white")}>{title}</h3>
        {description ? <p className="muted-copy mt-2 text-sm">{description}</p> : null}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  );
}
