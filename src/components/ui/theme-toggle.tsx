import { cn } from "../../lib/utils";

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("h-[14px] w-[14px]", active ? "text-[#78bc43]" : "text-slate-400 dark:text-slate-500")}
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="1.8">
        <path d="M12 2.75v2.5" />
        <path d="M12 18.75v2.5" />
        <path d="M21.25 12h-2.5" />
        <path d="M5.25 12h-2.5" />
        <path d="M18.54 5.46l-1.77 1.77" />
        <path d="M7.23 16.77l-1.77 1.77" />
        <path d="M18.54 18.54l-1.77-1.77" />
        <path d="M7.23 7.23L5.46 5.46" />
      </g>
    </svg>
  );
}

function MoonIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("h-[14px] w-[14px]", active ? "text-[#f3f7fb]" : "text-slate-400 dark:text-slate-500")}
    >
      <path
        fill="currentColor"
        d="M14.9 2.8a1 1 0 0 0-1.21 1.27 8.2 8.2 0 0 1-10.2 10.2 1 1 0 0 0-1.27 1.21A10.25 10.25 0 1 0 14.9 2.8Z"
      />
    </svg>
  );
}

type ThemeToggleProps = {
  theme: "light" | "dark";
  onToggle: () => void;
  className?: string;
};

export function ThemeToggle({ theme, onToggle, className }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-[6px] rounded-full border px-[10px] py-[6px] transition-colors duration-200",
        "bg-[rgba(255,255,255,0.74)] text-[#273b6e] border-[rgba(39,59,110,0.14)] hover:bg-[rgba(255,255,255,0.92)]",
        "shadow-[0_8px_20px_rgba(39,59,110,0.08)] backdrop-blur-[14px]",
        "dark:bg-[rgba(212,217,225,0.08)] dark:text-[#f3f7fb] dark:border-[rgba(212,217,225,0.12)] dark:hover:bg-[rgba(212,217,225,0.14)]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--brand-accent)_18%,transparent)]",
        className
      )}
    >
      <span className="flex items-center gap-[6px]">
        <SunIcon active={!isDark} />
        <span
          aria-hidden="true"
          className={cn(
            "relative flex h-[22px] w-[40px] items-center rounded-full p-[2px] transition-colors duration-200",
            isDark ? "bg-[#8ecf5f]" : "bg-[color-mix(in_srgb,var(--brand-accent)_72%,white)]"
          )}
        >
          <span
            className={cn(
              "h-[18px] w-[18px] rounded-full transition-transform duration-200",
              "bg-[rgba(255,255,255,0.96)] shadow-[0_1px_3px_rgba(15,23,42,0.18)] dark:bg-[rgba(243,247,251,0.96)]",
              isDark ? "translate-x-[18px]" : "translate-x-0"
            )}
          />
        </span>
        <MoonIcon active={isDark} />
      </span>
      <span className="sr-only">{isDark ? "Dark Mode Enabled" : "Light Mode Enabled"}</span>
    </button>
  );
}
