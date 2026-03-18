import { ReactNode } from "react";

import { SectionHeader } from "./section-header";
import { Surface } from "./surface";
import { ToggleIconButton } from "./toggle-icon-button";

type CollapsiblePanelProps = {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
};

export function CollapsiblePanel({ title, children, actions, collapsed = false, onToggle }: CollapsiblePanelProps) {
  return (
    <Surface variant="panel" className="panel-wash relative overflow-hidden rounded-[2rem] p-4 md:p-5">
      <div className="relative">
        <SectionHeader
          title={title}
          meta={
            <div className="flex items-center gap-2">
              {actions ?? null}
              {onToggle ? (
                <ToggleIconButton
                  onClick={onToggle}
                  aria-expanded={!collapsed}
                  aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
                  expanded={!collapsed}
                />
              ) : null}
            </div>
          }
        />
        <div className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${collapsed ? "mt-0 grid-rows-[0fr] opacity-0" : "mt-4 grid-rows-[1fr] opacity-100"}`}>
          <div className="min-h-0 overflow-hidden">{children}</div>
        </div>
      </div>
    </Surface>
  );
}
