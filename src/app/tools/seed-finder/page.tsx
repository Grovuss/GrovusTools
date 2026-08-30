import type { Metadata } from "next";
import SeedFinderClient from "@/components/SeedFinderClient";

export const metadata: Metadata = {
  title: "Minecraft World Seed Finder | Grovus Tools",
  description:
    "Recover a Minecraft Java Edition world seed from known structure locations using real structure-placement math, verified against every observation you provide.",
};

export default function Page() {
  return <SeedFinderClient />;
}
