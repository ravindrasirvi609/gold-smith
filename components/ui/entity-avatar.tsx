import Image from "next/image";
import { cn } from "@/lib/utils";

type EntityAvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Render an entity photo (vendor logo, customer photo, karigar photo, user
 * avatar). Falls back to a two-letter initials chip when no src is given.
 *
 * Uses `next/image` with `unoptimized` because our R2 public URLs are
 * already CDN-served and don't need re-optimisation through the /_next/image
 * pipeline. This preserves lazy loading, layout stability, and priority
 * hints from next/image without adding an unnecessary optimisation hop.
 */
export function EntityAvatar({
  src,
  name,
  size = 32,
  className,
}: EntityAvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className={cn(
          "shrink-0 rounded-full object-cover bg-muted",
          className
        )}
      />
    );
  }
  return (
    <span
      aria-label={name}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
