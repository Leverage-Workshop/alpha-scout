import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alpha Scout",
  description: "Research trade setups against historical market data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
