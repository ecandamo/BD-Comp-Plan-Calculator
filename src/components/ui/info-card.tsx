import { ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Surface } from "./surface";

type InfoCardProps = {
  title?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function InfoCard({ title, meta, children, className }: InfoCardProps) {
  return (
    <Surface variant="panel" className={cn("rounded-[1.5rem] px-4 py-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {title ? <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{title}</p> : null}
          {children ? <div className={cn(title ? "mt-2" : "", "text-sm text-[var(--brand-ink)]")}>{children}</div> : null}
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
    </Surface>
  );
}
