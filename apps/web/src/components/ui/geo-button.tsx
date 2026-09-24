import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" | "danger"; size?: "sm" | "icon" };
export function Button({ className, variant = "outline", size = "sm", ...props }: Props) {
  return <button {...props} className={cn("inline-flex shrink-0 items-center justify-center gap-2 border font-medium transition-colors disabled:opacity-40", size === "icon" ? "size-9" : "h-9 px-3 text-xs", variant === "solid" && "border-primary bg-primary text-primary-foreground hover:bg-primary/90", variant === "outline" && "border-border bg-panel text-foreground hover:bg-accent", variant === "ghost" && "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground", variant === "danger" && "border-severe/40 bg-severe/10 text-severe", className)} />;
}
