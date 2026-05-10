"use client";

import { BadgeCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const TOOLTIP = "Verified by Cursor Directory";

export function VerifiedBadge({
  size = "sm",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  if (size === "md") {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 text-xs font-medium text-blue-600 dark:text-blue-400",
                className,
              )}
            >
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              <span>Verified</span>
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>{TOOLTIP}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={TOOLTIP}
            className={cn(
              "inline-flex size-4 shrink-0 items-center justify-center text-blue-500 dark:text-blue-400",
              className,
            )}
          >
            <BadgeCheck className="size-4" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
