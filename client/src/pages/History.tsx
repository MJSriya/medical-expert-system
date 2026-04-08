import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronLeft, ChevronRight, FileX2, Search } from "lucide-react";

import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import CaseCard from "@/components/CaseCard";
import { useCases } from "@/hooks/use-cases";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [limit, setLimit] = useState<number>(12);
  const [q, setQ] = useState("");

  const { data, isLoading, error } = useCases({ cursor, limit });

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((c) => (c.symptomsText ?? "").toLowerCase().includes(query));
  }, [data?.items, q]);

  return (
    <AppShell>
      <Seo
        title="LumenClinic — History"
        description="Browse recent symptom cases and open past results."
      />

      <div className="animate-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Case history</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your recent entries (device/browser session). Open a case to view results.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              data-testid="new-case-link"
              className="
                inline-flex items-center gap-2
                text-sm font-semibold text-primary
                hover:underline
              "
            >
              Start new check <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <Card className="mt-6 glass shadow-soft rounded-3xl border-card-border/70">
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search symptoms text…"
                data-testid="history-search"
                className="
                  pl-9 rounded-2xl bg-background/60
                  border-2 border-border/70
                  focus:border-primary focus:ring-4 focus:ring-primary/10
                  transition-all
                "
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLimit((v) => (v === 12 ? 24 : 12))}
                data-testid="toggle-limit"
                className="rounded-2xl"
              >
                Show {limit === 12 ? "more" : "less"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setCursor(undefined)}
                data-testid="reset-pagination"
                className="rounded-2xl"
              >
                Reset
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-6">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-3xl border-card-border/70 glass shadow-soft p-6">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="mt-4 h-6 w-full rounded-xl" />
                  <Skeleton className="mt-2 h-4 w-2/3 rounded-xl" />
                  <Skeleton className="mt-6 h-10 w-full rounded-2xl" />
                </Card>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <Card className="glass shadow-soft rounded-3xl border-card-border/70">
              <div className="p-8">
                <div className="text-lg font-bold">Couldn’t load history</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {(error as any)?.message ?? "Unknown error"}
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={() => window.location.reload()}
                    data-testid="history-reload"
                    className="
                      rounded-2xl
                      bg-gradient-to-r from-primary to-accent text-primary-foreground
                      shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5
                      transition-all duration-200
                    "
                  >
                    Reload
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <Card className="glass shadow-soft rounded-3xl border-card-border/70">
              <div className="p-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <FileX2 className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-4 text-lg font-bold" data-testid="history-empty-title">
                  No cases yet
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start with a symptom check to generate your first assessment.
                </p>
                <div className="mt-5">
                  <Link
                    href="/"
                    data-testid="history-empty-cta"
                    className="
                      inline-flex items-center justify-center
                      rounded-2xl px-6 py-3
                      bg-gradient-to-r from-primary to-accent
                      text-primary-foreground font-bold
                      shadow-lg shadow-primary/20
                      hover:shadow-xl hover:-translate-y-0.5
                      transition-all duration-200
                    "
                  >
                    Start symptom check
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" data-testid="history-grid">
                {filtered.map((c) => (
                  <CaseCard key={c.id} item={c} />
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCursor((cur) => (cur && cur > 1 ? Math.max(1, cur - limit) : undefined))}
                  disabled={!cursor}
                  data-testid="prev-page"
                  className="rounded-2xl w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="text-xs text-muted-foreground">
                  Showing <span className="text-foreground font-semibold">{filtered.length}</span>{" "}
                  {q.trim() ? "filtered result(s)" : "case(s)"}
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    const next = data?.nextCursor;
                    if (next) setCursor(next);
                  }}
                  disabled={!data?.nextCursor}
                  data-testid="next-page"
                  className="
                    rounded-2xl w-full sm:w-auto
                    bg-gradient-to-r from-primary to-accent
                    text-primary-foreground
                    shadow-lg shadow-primary/20
                    hover:shadow-xl hover:-translate-y-0.5
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                    transition-all duration-200
                  "
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
