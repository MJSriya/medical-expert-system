import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { AlertCircle, ArrowLeft, BadgeCheck, ClipboardList, Loader2, RefreshCcw, Siren } from "lucide-react";
import { format } from "date-fns";

import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import BadgeTriage from "@/components/BadgeTriage";
import BadgeSeverity from "@/components/BadgeSeverity";
import { useAssessCase, useCase } from "@/hooks/use-cases";
import { useToast } from "@/hooks/use-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

function pctColor(pct: number) {
  if (pct >= 75) return "bg-gradient-to-r from-primary to-accent";
  if (pct >= 45) return "bg-gradient-to-r from-accent to-[hsl(160_68%_42%)]";
  return "bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/30";
}

export default function CaseResults() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const { toast } = useToast();

  const { data, isLoading, error } = useCase(id);
  const assess = useAssessCase();

  const [additionalInfo, setAdditionalInfo] = useState("");

  const createdAtText = useMemo(() => {
    const dt = data?.case?.createdAt ? new Date(data.case.createdAt as unknown as string) : null;
    return dt ? format(dt, "PPpp") : "—";
  }, [data?.case?.createdAt]);

  const triage = data?.assessment?.triageLevel as
    | "emergency"
    | "urgent"
    | "routine"
    | "self_care"
    | undefined;

  const primaryCta = useMemo(() => {
    if (!triage) return null;
    if (triage === "emergency") {
      return {
        tone: "destructive" as const,
        title: "Seek emergency care now",
        subtitle: "If you feel unsafe, call your local emergency number immediately.",
        icon: Siren,
      };
    }
    if (triage === "urgent") {
      return {
        tone: "default" as const,
        title: "Get urgent medical care",
        subtitle: "Consider same-day care or urgent care, especially if worsening.",
        icon: AlertCircle,
      };
    }
    if (triage === "routine") {
      return {
        tone: "default" as const,
        title: "Schedule a clinician visit",
        subtitle: "Book an appointment soon and monitor for red flags.",
        icon: BadgeCheck,
      };
    }
    return {
      tone: "default" as const,
      title: "Self-care may be reasonable",
      subtitle: "Try low-risk home care and seek help if things worsen.",
      icon: ClipboardList,
    };
  }, [triage]);

  const handleReassess = async () => {
    try {
      await assess.mutateAsync({ id, additionalInfo: additionalInfo.trim() || undefined });
      toast({
        title: "Assessment updated",
        description: "We regenerated results using your additional information.",
      });
      setAdditionalInfo("");
    } catch (e: any) {
      toast({
        title: "Re-assessment failed",
        description: e?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell>
      <Seo
        title={data?.assessment ? `Case #${id} — Results` : `Case #${id} — Loading`}
        description="Review triage level, red flags, and suggested next steps. Not medical advice."
      />

      <div className="animate-in-up">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/history"
            data-testid="back-to-history"
            className="
              inline-flex items-center gap-2
              text-sm font-semibold text-muted-foreground
              hover:text-foreground transition-colors
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Back to history
          </Link>

          <div className="text-xs text-muted-foreground">
            Created: <span data-testid="case-created-at" className="text-foreground/90">{createdAtText}</span>
          </div>
        </div>

        {isLoading && (
          <Card className="mt-5 glass shadow-soft rounded-3xl border-card-border/70">
            <div className="p-8 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <div className="font-bold">Loading results…</div>
                <div className="text-sm text-muted-foreground">Fetching case details.</div>
              </div>
            </div>
          </Card>
        )}

        {!isLoading && error && (
          <Card className="mt-5 glass shadow-soft rounded-3xl border-card-border/70">
            <div className="p-8">
              <div className="text-lg font-bold">Couldn’t load this case</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {(error as any)?.message ?? "Unknown error"}
              </p>
              <div className="mt-5 flex gap-3">
                <Button
                  type="button"
                  onClick={() => window.location.reload()}
                  data-testid="reload-case"
                  className="
                    rounded-xl
                    bg-gradient-to-r from-primary to-accent
                    text-primary-foreground
                    shadow-lg shadow-primary/20
                    hover:shadow-xl hover:-translate-y-0.5
                    transition-all duration-200
                  "
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reload
                </Button>
                <Button type="button" variant="outline" onClick={() => (window.location.href = "/")} data-testid="go-home">
                  Go home
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!isLoading && data === null && (
          <Card className="mt-5 glass shadow-soft rounded-3xl border-card-border/70">
            <div className="p-8">
              <div className="text-lg font-bold">Case not found</div>
              <p className="mt-2 text-sm text-muted-foreground">
                This case may have been deleted or never existed.
              </p>
              <div className="mt-5">
                <Link
                  href="/history"
                  className="text-sm font-semibold text-primary hover:underline"
                  data-testid="history-link"
                >
                  View history
                </Link>
              </div>
            </div>
          </Card>
        )}

        {!isLoading && data && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <section className="lg:col-span-7 space-y-6">
              <Card className="glass shadow-soft rounded-3xl border-card-border/70 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Case #{data.case.id}</div>
                      <h1 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight" data-testid="case-title">
                        Results
                      </h1>
                      <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                        Read carefully. If anything feels severe or rapidly worsening, seek care.
                      </p>
                    </div>

                    {triage && <BadgeTriage level={triage} />}
                  </div>

                  <Separator className="my-6" />

                  {primaryCta && (
                    <div
                      className={
                        triage === "emergency"
                          ? "rounded-2xl border border-destructive/30 bg-destructive/10 p-5"
                          : "rounded-2xl border border-border/60 bg-background/35 p-5"
                      }
                      data-testid="primary-cta"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={
                            triage === "emergency"
                              ? "h-10 w-10 rounded-2xl bg-destructive/15 border border-destructive/25 flex items-center justify-center"
                              : "h-10 w-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center"
                          }
                          aria-hidden="true"
                        >
                          <primaryCta.icon className={triage === "emergency" ? "h-5 w-5 text-destructive" : "h-5 w-5 text-primary"} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-lg font-bold">{primaryCta.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{primaryCta.subtitle}</div>

                          {triage === "emergency" && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                type="button"
                                onClick={() => window.open("https://www.who.int/health-topics/emergencies", "_blank")}
                                data-testid="emergency-guidance"
                                className="
                                  rounded-xl
                                  bg-destructive text-destructive-foreground
                                  hover:bg-destructive/90
                                  shadow-lg shadow-destructive/20
                                  transition-all duration-200
                                "
                              >
                                Emergency guidance
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const el = document.getElementById("red-flags");
                                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                data-testid="scroll-red-flags"
                                className="rounded-xl border-destructive/25 hover:bg-destructive/10 hover:text-destructive"
                              >
                                View red flags
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <div className="text-sm font-bold">Summary</div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90" data-testid="assessment-summary">
                      {data.assessment?.summary ?? "Assessment has not been generated yet."}
                    </p>
                  </div>

                  <Separator className="my-6" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border/60 bg-background/35 p-5" id="red-flags">
                      <div className="text-sm font-bold">Red flags</div>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground" data-testid="red-flags">
                        {(data.assessment?.redFlags ?? []).length ? (
                          data.assessment!.redFlags.map((x, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive/80" />
                              <span>{x}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground/80">No red flags listed.</li>
                        )}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/35 p-5">
                      <div className="text-sm font-bold">Follow-up questions</div>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground" data-testid="follow-up-questions">
                        {(data.assessment?.followUpQuestions ?? []).length ? (
                          data.assessment!.followUpQuestions.map((x, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/80" />
                              <span>{x}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground/80">No follow-up questions listed.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border/60 bg-background/35 p-5">
                      <div className="text-sm font-bold">Home care</div>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground" data-testid="home-care">
                        {(data.assessment?.homeCare ?? []).length ? (
                          data.assessment!.homeCare.map((x, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[hsl(160_68%_42%)]" />
                              <span>{x}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground/80">No home care items listed.</li>
                        )}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/35 p-5">
                      <div className="text-sm font-bold">What to tell a doctor</div>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground" data-testid="what-to-tell-doctor">
                        {(data.assessment?.whatToTellDoctor ?? []).length ? (
                          data.assessment!.whatToTellDoctor.map((x, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                              <span>{x}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground/80">No doctor notes listed.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="px-6 sm:px-8 pb-7">
                  <div
                    className="
                      rounded-2xl border border-border/60 bg-background/35
                      p-5
                    "
                    data-testid="safety-disclaimer"
                  >
                    <div className="text-sm font-bold">Safety disclaimer</div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {data.assessment?.safetyDisclaimer ??
                        "This tool provides general information, not medical advice. If you feel unsafe, seek professional care."}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/90">Not medical advice.</span>{" "}
                      Don’t delay care based on this output.
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            <aside className="lg:col-span-5 space-y-6">
              <Card className="glass shadow-soft rounded-3xl border-card-border/70">
                <div className="p-6 sm:p-7">
                  <h2 className="text-xl font-bold">Possible conditions</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    These are suggestions, not a diagnosis.
                  </p>

                  <div className="mt-5 space-y-4" data-testid="condition-suggestions">
                    {data.suggestions.length ? (
                      data.suggestions
                        .slice()
                        .sort((a, b) => (b.likelihood ?? 0) - (a.likelihood ?? 0))
                        .map((s) => (
                          <div
                            key={s.id}
                            className="rounded-2xl border border-border/60 bg-background/35 p-5"
                            data-testid={`condition-${s.id}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-bold">{s.name}</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Likelihood estimate
                                </div>
                              </div>
                              <div className="text-sm font-bold tabular-nums text-foreground">
                                {Math.max(0, Math.min(100, Number(s.likelihood ?? 0)))}%
                              </div>
                            </div>

                            <div className="mt-3">
                              <Progress
                                value={Math.max(0, Math.min(100, Number(s.likelihood ?? 0)))}
                                className="h-2.5 rounded-full bg-muted"
                              />
                              <div
                                className={`h-2.5 rounded-full -mt-2.5 ${pctColor(
                                  Math.max(0, Math.min(100, Number(s.likelihood ?? 0))),
                                )}`}
                                style={{
                                  width: `${Math.max(0, Math.min(100, Number(s.likelihood ?? 0)))}%`,
                                }}
                                aria-hidden="true"
                              />
                            </div>

                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                              {s.rationale}
                            </p>
                          </div>
                        ))
                    ) : (
                      <div className="rounded-2xl border border-border/60 bg-background/35 p-5 text-sm text-muted-foreground">
                        No condition suggestions were returned.
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="glass shadow-soft rounded-3xl border-card-border/70">
                <div className="p-6 sm:p-7">
                  <h2 className="text-xl font-bold">Symptoms captured</h2>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Structured list used for reasoning.
                  </div>

                  <div className="mt-5 space-y-3" data-testid="symptoms-list">
                    {data.symptoms.length ? (
                      data.symptoms.map((s) => (
                        <div
                          key={s.id}
                          className="rounded-2xl border border-border/60 bg-background/35 p-4"
                          data-testid={`symptom-${s.id}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-bold">{s.name}</div>
                            <BadgeSeverity severity={s.severity as any} />
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Duration:{" "}
                            <span className="text-foreground/90 font-semibold tabular-nums">
                              {s.durationDays ?? "—"}
                            </span>{" "}
                            days
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-border/60 bg-background/35 p-5 text-sm text-muted-foreground">
                        No structured symptoms on record.
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-sm font-bold">Re-assess with more info</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add details like temperature readings, medication tried, or new symptoms.
                    </p>

                    <Label className="sr-only" htmlFor="additional-info">
                      Additional info
                    </Label>
                    <Textarea
                      id="additional-info"
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Optional additional information…"
                      data-testid="additional-info"
                      className="
                        mt-3 min-h-[110px] rounded-2xl
                        bg-background/60 border-2 border-border/70
                        focus:border-primary focus:ring-4 focus:ring-primary/10
                        transition-all
                      "
                    />

                    <div className="mt-3 flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        onClick={handleReassess}
                        disabled={assess.isPending || !Number.isFinite(id)}
                        data-testid="reassess-button"
                        className="
                          rounded-2xl
                          bg-gradient-to-r from-primary to-accent
                          text-primary-foreground
                          shadow-lg shadow-primary/20
                          hover:shadow-xl hover:-translate-y-0.5
                          disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                          transition-all duration-200
                        "
                      >
                        {assess.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Re-assessing…
                          </>
                        ) : (
                          <>
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Re-assess
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAdditionalInfo("")}
                        data-testid="clear-additional-info"
                        className="rounded-2xl"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}
