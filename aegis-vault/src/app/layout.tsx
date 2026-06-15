import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aegis Vault | SQL Firewall SOC",
  description: "Oracle SQL Firewall Defense Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Migaku and similar extensions mutate <head> before hydration */}
      <head suppressHydrationWarning />
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
