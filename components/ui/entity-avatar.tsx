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

export function EntityAvatar({ src, name, size = 32, className }: EntityAvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={cn("shrink-0 rounded-full object-cover bg-muted", className)}
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
