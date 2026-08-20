import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

interface ToolCardProps {
  href?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: "green" | "purple";
  comingSoon?: boolean;
}

export function ToolCard({
  href,
  title,
  description,
  icon: Icon,
  accent = "green",
  comingSoon = false,
}: ToolCardProps) {
  const accentColor =
    accent === "purple" ? "var(--color-purple-400)" : "var(--color-green-400)";
  const accentBg = accent === "purple" ? "var(--color-purple-950)" : "var(--color-green-950)";

  const body = (
    <div
      className={`group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-5 transition-all ${
        comingSoon ? "opacity-60" : "hover:border-[var(--color-border-bright)] hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start justify-between">
        <span
          className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-border-bright)]"
          style={{ backgroundColor: accentBg, color: accentColor }}
        >
          <Icon size={20} strokeWidth={2} aria-hidden="true" />
        </span>
        {comingSoon ? (
          <span className="rounded-full border border-[var(--color-border-bright)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-400)]">
            Coming soon
          </span>
        ) : (
          <ArrowUpRight
            size={18}
            className="text-[var(--color-ink-600)] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-ink-50)]"
            aria-hidden="true"
          />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-[var(--color-ink-50)]">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-400)]">{description}</p>
        ) : null}
      </div>
    </div>
  );

  if (comingSoon || !href) {
    return <div aria-disabled="true">{body}</div>;
  }

  return (
    <Link href={href} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2">
      {body}
    </Link>
  );
}
