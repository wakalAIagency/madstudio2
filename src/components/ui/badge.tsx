import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "outline";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-accent text-accent-foreground",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  outline: "border border-accent/40 text-accent",
};

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
