import { Link } from "wouter";
import { CalendarClock, ChevronRight, FileText, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Case } from "@shared/schema";

export default function CaseCard({
  item,
  className,
}: {
  item: Case;
  className?: string;
}) {
  const created = item.createdAt ? new Date(item.createdAt as unknown as string) : null;
  const when = created ? formatDistanceToNow(created, { addSuffix: true }) : "—";

  return (
    <Link
      href={`/cases/${item.id}`}
      data-testid={`case-card-${item.id}`}
      className={cn(
        "group ring-focus block",
        "rounded-2xl glass shadow-soft overflow-hidden",
        "transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-34px_rgba(2,8,23,0.55)]",
        className,
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                {when}
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Case #{item.id}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-2">
              <div
                className="
                  mt-0.5 h-9 w-9 rounded-xl
                  bg-gradient-to-br from-primary/20 via-accent/10 to-transparent
                  border border-card-border/70
                  flex items-center justify-center
                "
                aria-hidden="true"
              >
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold leading-snug line-clamp-1">
                  {item.symptomsText}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {item.age != null ? `${item.age}y` : "Age —"}{" "}
                  {item.sexAtBirth ? `• ${item.sexAtBirth}` : ""}{" "}
                  {item.pregnant ? "• pregnant" : ""}
                </div>
              </div>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>

      <div
        className="
          h-px w-full
          bg-gradient-to-r from-transparent via-border/80 to-transparent
        "
      />
      <div className="px-5 sm:px-6 py-3 text-xs text-muted-foreground flex items-center justify-between">
        <span>Open results</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
      </div>
    </Link>
  );
}
