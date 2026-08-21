import type { Metadata } from "next";
import LocatorColorFinder from "@/components/LocatorColorFinder";

export const metadata: Metadata = {
  title: "Minecraft Locator Bar Color Finder | Grovus Tools",
  description:
    "Find a Minecraft Java player's Locator Bar color from their username or UUID and discover known players who share the same color.",
};

export default function Page() {
  return <LocatorColorFinder />;
}
