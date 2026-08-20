import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Grovus Tools — Minecraft utilities",
  description:
    "Minecraft utility calculators: an anvil-accurate enchantment order optimizer and an Overworld/Nether coordinate converter.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="fixed inset-0 -z-10 grovus-field" aria-hidden="true" />
        <Header />
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
