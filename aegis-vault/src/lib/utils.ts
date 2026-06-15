import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TIME_FMT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

/** Stable en-US formatting so SSR and client hydration match. */
export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", TIME_FMT);
  } catch {
    return iso;
  }
}
