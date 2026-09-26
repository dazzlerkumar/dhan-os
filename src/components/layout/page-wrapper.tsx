import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={cn("animate-fade-in min-w-0 space-y-6 max-w-7xl mx-auto", className)}>
      {children}
    </div>
  );
}
