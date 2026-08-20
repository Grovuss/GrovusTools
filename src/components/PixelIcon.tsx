interface PixelIconProps {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}

/** Renders a 16x16 Minecraft texture without blurring, at any display size. */
export function PixelIcon({ src, alt, size = 32, className = "" }: PixelIconProps) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pixel art must skip Next's optimizer to avoid blur
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`pixelated select-none ${className}`}
      draggable={false}
    />
  );
}
