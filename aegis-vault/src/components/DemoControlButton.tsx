"use client";

import { cn } from "@/lib/utils";

interface DemoControlButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "success" | "info";
  compact?: boolean;
}

export function DemoControlButton({
  label,
  onClick,
  disabled,
  variant = "default",
  compact = false,
}: DemoControlButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border text-left font-medium transition-all disabled:opacity-40",
        compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs",
        variant === "danger" &&
          "border-[#ff2d55]/40 bg-[#ff2d55]/10 text-[#ff2d55] hover:bg-[#ff2d55]/20",
        variant === "success" &&
          "border-[#00ff9f]/40 bg-[#00ff9f]/10 text-[#00ff9f] hover:bg-[#00ff9f]/20",
        variant === "info" &&
          "border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#60a5fa] hover:bg-[#3b82f6]/20",
        variant === "default" &&
          "border-[#00f9ff]/30 bg-[#00f9ff]/5 text-[#00f9ff] hover:border-[#00f9ff]/50",
      )}
    >
      {label}
    </button>
  );
}
