import type { Metadata } from "next";
import BannerMakerClient from "@/components/BannerMakerClient";

export const metadata: Metadata = {
  title: "Minecraft Banner Maker | Grovus Tools",
  description:
    "Design a Minecraft Java Edition banner with real loom patterns and dye colors, then download it as a PNG or share the design.",
};

export default function Page() {
  return <BannerMakerClient />;
}
