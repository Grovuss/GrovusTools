import { Hammer, Compass, MapPin } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";

export const metadata = { title: "All Tools — Grovus Tools" };

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="font-mono text-2xl font-bold text-[var(--color-ink-50)]">All Tools</h1>
      <p className="mt-2 max-w-xl text-[var(--color-ink-400)]">
        Every Grovus Tools calculator in one place.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard
          href="/tools/enchantments"
          title="Enchantment Calculator"
          description="Find the cheapest order to combine enchanted books and gear in a Minecraft anvil."
          icon={Hammer}
          accent="purple"
        />
        <ToolCard
          href="/tools/coordinates"
          title="Coordinate Calculator"
          description="Convert coordinates between the Overworld and Nether using Minecraft's 8:1 horizontal coordinate ratio."
          icon={Compass}
          accent="green"
        />
        <ToolCard
          href="/tools/locator-color"
          title="Locator Bar Color Finder"
          description="Find your Minecraft Locator Bar color and see who else shares it."
          icon={MapPin}
          accent="purple"
        />
      </div>
    </div>
  );
}
