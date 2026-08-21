"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={`flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-ink-400)] transition-colors hover:border-[var(--color-border-bright)] hover:text-[var(--color-ink-50)] ${className}`}
    >
      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
