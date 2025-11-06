import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

export type LabelProps = ComponentPropsWithoutRef<"label"> & {
  variant?: "default" | "muted";
};

export function Label({ className, variant = "default", ...props }: LabelProps) {
  return (
    <label
      className={cn(
        labelVariants(),
        variant === "muted" ? "text-muted-foreground" : undefined,
        className,
      )}
      {...props}
    />
  );
}

