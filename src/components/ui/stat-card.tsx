import { ReactNode } from "react";

import { cn } from "../../lib/utils";
import { InfoCard } from "./info-card";

type StatCardProps = {
  title: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  preserveBreaks?: boolean;
  className?: string;
};

export function StatCard({ title, value, detail, preserveBreaks = false, className }: StatCardProps) {
  return (
    <InfoCard title={title} className={cn("rounded-[1.6rem] px-4 py-4", className)}>
      <div className="ui-stat">{value}</div>
      {detail ? <div className={cn("ui-text-xs ui-text-muted mt-2", preserveBreaks && "whitespace-pre-line")}>{detail}</div> : null}
    </InfoCard>
  );
}
