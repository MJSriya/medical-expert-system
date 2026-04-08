import { AlertTriangle, Ambulance, ShieldCheck, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type TriageLevel = "emergency" | "urgent" | "routine" | "self_care";

const triageMeta: Record<TriageLevel, { label: string; classes: string; icon: any }> = {
  emergency: {
    label: "Emergency",
    classes:
      "bg-destructive/12 text-destructive border-destructive/25 shadow-[0_10px_30px_-18px_rgba(239,68,68,0.35)]",
    icon: Ambulance,
  },
  urgent: {
    label: "Urgent",
    classes:
      "bg-[hsl(32_94%_56%)/0.14] text-[hsl(32_94%_42%)] border-[hsl(32_94%_56%)/0.22] shadow-[0_10px_30px_-18px_rgba(249,115,22,0.35)] dark:text-[hsl(32_94%_62%)]",
    icon: AlertTriangle,
  },
  routine: {
    label: "Routine",
    classes:
      "bg-accent/12 text-accent border-accent/20 shadow-[0_10px_30px_-18px_rgba(59,130,246,0.35)]",
    icon: Timer,
  },
  self_care: {
    label: "Self care",
    classes:
      "bg-[hsl(160_68%_42%)/0.14] text-[hsl(160_68%_30%)] border-[hsl(160_68%_42%)/0.22] shadow-[0_10px_30px_-18px_rgba(16,185,129,0.30)] dark:text-[hsl(160_68%_62%)]",
    icon: ShieldCheck,
  },
};

export default function BadgeTriage({ level, className }: { level: TriageLevel; className?: string }) {
  const meta = triageMeta[level];
  const Icon = meta.icon;
  return (
    <span
      data-testid="triage-badge"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold",
        meta.classes,
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      {meta.label}
    </span>
  );
}
