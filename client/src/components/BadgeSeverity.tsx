import { cn } from "@/lib/utils";
import { Flame, Minus, Waves } from "lucide-react";

type Severity = "mild" | "moderate" | "severe";

const meta: Record<Severity, { label: string; className: string; icon: any }> = {
  mild: {
    label: "Mild",
    className:
      "bg-[hsl(160_68%_42%)/0.12] text-[hsl(160_68%_30%)] border-[hsl(160_68%_42%)/0.20] dark:text-[hsl(160_68%_62%)]",
    icon: Minus,
  },
  moderate: {
    label: "Moderate",
    className:
      "bg-[hsl(32_94%_56%)/0.12] text-[hsl(32_94%_42%)] border-[hsl(32_94%_56%)/0.20] dark:text-[hsl(32_94%_62%)]",
    icon: Waves,
  },
  severe: {
    label: "Severe",
    className:
      "bg-destructive/12 text-destructive border-destructive/22",
    icon: Flame,
  },
};

export default function BadgeSeverity({ severity, className }: { severity: Severity; className?: string }) {
  const m = meta[severity];
  const Icon = m.icon;
  return (
    <span
      data-testid={`severity-${severity}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        m.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}
