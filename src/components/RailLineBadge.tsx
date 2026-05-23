import type { TrainStatusLine } from "@/data/trainStatus";
import type { CSSProperties } from "react";

type RailLineBadgeSize = "sm" | "md" | "lg";

const sizeClasses: Record<RailLineBadgeSize, { outer: string; inner: string; text: string }> = {
  sm: {
    outer: "h-8 w-8",
    inner: "h-6 w-6",
    text: "text-[9px]",
  },
  md: {
    outer: "h-10 w-10",
    inner: "h-8 w-8",
    text: "text-[10px]",
  },
  lg: {
    outer: "h-12 w-12",
    inner: "h-10 w-10",
    text: "text-xs",
  },
};

type RailLineBadgeProps = {
  line: TrainStatusLine;
  size?: RailLineBadgeSize;
};

export function RailLineBadge({ line, size = "md" }: RailLineBadgeProps) {
  const classes = sizeClasses[size];

  return (
    <span className={`rail-line-mark flex ${classes.outer} shrink-0 items-center justify-center rounded-full bg-white`}>
      <span
        className={`rail-line-code flex ${classes.inner} items-center justify-center rounded-full ${classes.text} font-black shadow-sm`}
        style={{ "--rail-code-color": line.codeTextColor, backgroundColor: line.color, color: line.codeTextColor } as CSSProperties}
      >
        {line.code}
      </span>
    </span>
  );
}
