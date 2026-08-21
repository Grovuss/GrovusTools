import { Hammer, Compass, MapPin, FlaskConical, Radio, DoorOpen, Users, Shirt, Terminal, Boxes, Skull, Sparkles, MapPinned } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { PixelIcon } from "@/components/PixelIcon";

const FUTURE_TOOLS = [
  { title: "Potion Calculator", icon: FlaskConical },
  { title: "Beacon Calculator", icon: Radio },
  { title: "Nether Portal Calculator", icon: DoorOpen },
  { title: "Villager Trade Calculator", icon: Users },
  { title: "Armor Trimming Calculator", icon: Shirt },
  { title: "/give Generator", icon: Terminal },
  { title: "Loot / Drop Calculator", icon: Skull },
  { title: "XP Calculator", icon: Sparkles },
  { title: "Block Palette Generator", icon: Boxes },
  { title: "Mob Spawn Calculator", icon: MapPinned },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <section className="flex flex-col items-start gap-6 py-20 sm:py-28">
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-raised)] px-3 py-1 font-mono text-xs text-[var(--color-green-400)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-green-400)]" />
          Java Edition 26.2 rules
        </div>

        <div className="flex items-center gap-4">
          <PixelIcon
            src="/textures/item/enchanted_book.png"
            alt=""
            size={56}
            className="grovus-glow-purple"
          />
          <h1 className="font-mono text-4xl font-bold tracking-tight text-[var(--color-ink-50)] sm:text-6xl">
            GROVUS TOOLS
          </h1>
        </div>

        <p className="max-w-xl text-lg text-[var(--color-ink-200)]">
          Minecraft utilities without the bullshit.
        </p>
        <p className="max-w-2xl leading-relaxed text-[var(--color-ink-400)]">
          Useful calculators for Minecraft players — starting with an anvil
          calculator that actually models Java Edition&apos;s enchantment-cost
          mechanics, and a coordinate converter that handles negative
          numbers correctly. No ads, no sign-up, everything runs in your
          browser.
        </p>
      </section>

      <section aria-labelledby="tools-heading" className="pb-16">
        <h2 id="tools-heading" className="mb-5 font-mono text-sm uppercase tracking-wider text-[var(--color-ink-400)]">
          Available now
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      <section aria-labelledby="future-heading">
        <h2 id="future-heading" className="mb-5 font-mono text-sm uppercase tracking-wider text-[var(--color-ink-400)]">
          Planned tools
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FUTURE_TOOLS.map((tool) => (
            <ToolCard key={tool.title} title={tool.title} description="" icon={tool.icon} comingSoon />
          ))}
        </div>
      </section>
    </div>
  );
}
