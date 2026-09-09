import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const widths = {
  narrow: "max-w-lg",
  default: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-6xl",
} as const;

interface PageShellProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  width?: keyof typeof widths;
  center?: boolean;
  flush?: boolean;
}

export function PageShell({
  children,
  className,
  innerClassName,
  width = "default",
  center = false,
  flush = false,
}: PageShellProps) {
  return (
    <div
      className={cn(
        flush ? "page-offset" : "page-shell",
        center && "flex items-center justify-center",
        className
      )}
    >
      <div className={cn("mx-auto w-full", widths[width], innerClassName)}>
        {children}
      </div>
    </div>
  );
}
