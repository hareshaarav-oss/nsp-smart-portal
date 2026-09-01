import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "navy",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "navy" | "forest" | "saffron" | "muted" | "danger";
}) {
  const tones = {
    navy: "bg-primary text-primary-foreground",
    forest: "bg-forest text-forest-foreground",
    saffron: "bg-saffron text-saffron-foreground",
    muted: "bg-muted text-muted-foreground",
    danger: "bg-danger/12 text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
