"use client";

import { type CSSProperties, type ReactNode } from "react";
import { clsx } from "clsx";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  gold?: boolean;
  cyan?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  style,
  gold,
  cyan,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={clsx(
        "rounded-xl p-4",
        gold ? "glass-panel" : cyan ? "glass-panel-cyan" : "glass-panel",
        onClick && "cursor-pointer transition-all hover:scale-[1.01]",
        className,
      )}
    >
      {children}
    </div>
  );
}
