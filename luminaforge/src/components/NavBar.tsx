"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { UniversalSearchBar } from "./UniversalSearchBar";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/market", label: "Market" },
  { href: "/transactions", label: "Transactions" },
  { href: "/statement", label: "Statement" },
  { href: "/bulk", label: "Portfolio" },
];

const FALLBACK_USERNAME = "demo_user";
const FALLBACK_ROLE = "premium";

export function NavBar() {
  const pathname = usePathname();
  const [username, setUsername] = useState(FALLBACK_USERNAME);
  const [role, setRole] = useState(FALLBACK_ROLE);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/session");
      const data = (await res.json()) as {
        username?: string;
        role?: string;
      };
      if (data.username) setUsername(data.username);
      if (data.role) setRole(data.role);
    } catch {
      setUsername(FALLBACK_USERNAME);
      setRole(FALLBACK_ROLE);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession, pathname]);

  useEffect(() => {
    const onFocus = () => void loadSession();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadSession]);

  const roleUpper = role.toUpperCase();
  const isAdmin = role.toLowerCase() === "admin";
  const initial = (username[0] ?? "D").toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(244, 201, 93, 0.14)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Top row: logo + search + actions */}
      <div className="flex h-14 items-center gap-4 px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span
            className="text-xl font-black tracking-tight gold-gradient"
            style={{ letterSpacing: "-0.02em" }}
          >
            ✦ LuminaForge
          </span>
        </Link>

        {/* Universal Search Bar — Attack Point 1 is embedded here */}
        <div className="mx-auto w-full max-w-xl">
          <UniversalSearchBar />
        </div>

        {/* Right actions — live session from users table */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="glass-panel rounded-full px-3 py-1 text-xs font-medium text-[#22d3ee]">
            {username}
          </div>
          <div
            className={clsx(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              isAdmin
                ? "text-[#f43f5e] bg-[rgba(244,63,94,0.12)] border border-[rgba(244,63,94,0.35)]"
                : "text-slate-400 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.15)]",
            )}
          >
            {roleUpper}
          </div>
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: isAdmin
                ? "linear-gradient(135deg, #f43f5e, #be123c)"
                : "linear-gradient(135deg, #f4c95d, #c9a43a)",
              color: "#0f172a",
            }}
          >
            {initial}
          </div>
        </div>
      </div>

      {/* Bottom row: nav links */}
      <nav className="flex h-9 items-center gap-1 px-6">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              pathname === href
                ? "gold-text bg-[rgba(244,201,93,0.1)]"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
