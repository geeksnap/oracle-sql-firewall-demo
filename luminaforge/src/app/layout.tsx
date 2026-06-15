import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { LuminaAssistant } from "@/components/LuminaAssistant";

export const metadata: Metadata = {
  title: "LuminaForge | Premium AI Wealth & Exclusive Marketplace",
  description: "Luxury fintech — portfolio intelligence, exclusive assets, AI-powered wealth management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning />
      <body suppressHydrationWarning className="min-h-screen" style={{ background: "var(--navy)" }}>
        <NavBar />
        <main suppressHydrationWarning className="min-h-[calc(100vh-92px)]">{children}</main>
        <LuminaAssistant />
      </body>
    </html>
  );
}
