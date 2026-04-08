import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Wand2 } from "lucide-react";

import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import BadgeSeverity from "@/components/BadgeSeverity";
import { useAssessCase, useCreateCase } from "@/hooks/use-cases";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

type Severity = "mild" | "moderate" | "severe";

const symptomRowSchema = z.object({
  name: z.string().min(1, "Symptom name is required").max(80),
  severity: z.enum(["mild", "moderate", "severe"]),
  durationDays: z.coerce.number().int().min(0).max(3650).optional().or(z.nan().transform(() => undefined)),
});

const formSchema = z
  .object({
    age: z.coerce.number().int().min(0).max(120).optional().or(z.nan().transform(() => undefined)),
    sexAtBirth: z.string().optional(),
    pregnant: z.boolean().optional(),
    symptomsText: z.string().min(8, "Please describe symptoms in at least 8 characters").max(2000),
    symptoms: z.array(symptomRowSchema).min(1, "Add at least one symptom").max(20),
  })
  .refine(
    (v) => {
      if (v.pregnant === true && v.sexAtBirth && v.sexAtBirth !== "female") return false;
      return true;
    },
    { message: "Pregnancy is only applicable when sex at birth is female", path: ["pregnant"] },
  );

type FormValues = z.infer<typeof formSchema>;

const severityOrder: Severity[] = ["mild", "moderate", "severe"];

export default function SymptomChecker() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createCase = useCreateCase();
  const assessCase = useAssessCase();

  const [busyStep, setBusyStep] = useState<"idle" | "creating" | "assessing">("idle");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: undefined,
      sexAtBirth: undefined,
      pregnant: false,
      symptomsText: "",
      symptoms: [{ name: "", severity: "moderate", durationDays: undefined }],
    },
    mode: "onChange",
  });

  const symptoms = watch("symptoms");
  const sexAtBirth = watch("sexAtBirth");
  const pregnant = watch("pregnant");

  useEffect(() => {
    if (sexAtBirth && sexAtBirth !== "female" && pregnant) {
      setValue("pregnant", false, { shouldValidate: true });
    }
  }, [sexAtBirth, pregnant, setValue]);

  const canPregnant = !sexAtBirth || sexAtBirth === "female";

  const severityHint = useMemo(() => {
    const idx = symptoms?.length ? Math.max(...symptoms.map((s) => severityOrder.indexOf(s.severity as Severity))) : 0;
    const worst = severityOrder[Math.max(0, idx)] ?? "mild";
    return worst;
  }, [symptoms]);

  const onSubmit = async (values: FormValues) => {
    try {
      setBusyStep("creating");
      const created = await createCase.mutateAsync(values);
      setBusyStep("assessing");
      await assessCase.mutateAsync({ id: created.id, additionalInfo: undefined });
      toast({
        title: "Assessment ready",
        description: "We generated a triage summary. Review carefully and stay safe.",
      });
      setLocation(`/cases/${created.id}`);
    } catch (e: any) {
      toast({
        title: "Couldn’t complete assessment",
        description: e?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setBusyStep("idle");
    }
  };

  const addSymptom = () => {
    setValue(
      "symptoms",
      [...(symptoms ?? []), { name: "", severity: "mild", durationDays: undefined }],
      { shouldValidate: true },
    );
  };

  const removeSymptom = (idx: number) => {
    const next = (symptoms ?? []).filter((_, i) => i !== idx);
    setValue("symptoms", next.length ? next : [{ name: "", severity: "moderate", durationDays: undefined }], {
      shouldValidate: true,
    });
  };

  const setSymptom = (idx: number, patch: Partial<(typeof symptoms)[number]>) => {
    const next = [...(symptoms ?? [])];
    next[idx] = { ...next[idx], ...patch };
    setValue("symptoms", next, { shouldValidate: true });
  };

  return (
    <AppShell>
      <Seo
        title="LumenClinic — Symptom Checker"
        description="Enter symptoms and receive a cautious triage summary, red flags, and practical next steps. Not medical advice."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <section className="lg:col-span-7 animate-in-up stagger-1">
          <Card className="glass shadow-soft rounded-3xl border-card-border/70 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                    Symptom checker, built for clarity.
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Share what you’re feeling. We’ll generate a cautious triage level, red flags,
                    follow-up questions, and safe home-care ideas when appropriate.
                  </p>
                </div>

                <div className="hidden sm:flex flex-col items-end gap-2">
                  <div className="text-xs text-muted-foreground">Worst severity</div>
                  <BadgeSeverity severity={severityHint} />
                </div>
              </div>

              <Separator className="my-6" />

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="case-form">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="age" className="text-sm font-semibold">
                      Age (optional)
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g., 28"
                      data-testid="age-input"
                      className="mt-2 rounded-xl bg-background/60 border-2 border-border/70 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      {...register("age")}
                    />
                    {errors.age?.message && (
                      <p className="mt-2 text-xs text-destructive">{errors.age.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Sex at birth (optional)</Label>
                    <div className="mt-2">
                      <Select
                        value={watch("sexAtBirth") ?? ""}
                        onValueChange={(v) => setValue("sexAtBirth", v || undefined, { shouldValidate: true })}
                      >
                        <SelectTrigger
                          data-testid="sex-select"
                          className="rounded-xl bg-background/60 border-2 border-border/70 focus:ring-4 focus:ring-primary/10"
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="intersex">Intersex</SelectItem>
                          <SelectItem value="unknown">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:items-start gap-3 sm:gap-2">
                    <div>
                      <Label className="text-sm font-semibold">Pregnant (optional)</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only applies if sex at birth is female.
                      </p>
                    </div>
                    <Switch
                      checked={!!watch("pregnant")}
                      disabled={!canPregnant}
                      onCheckedChange={(v) => setValue("pregnant", v, { shouldValidate: true })}
                      data-testid="pregnant-switch"
                    />
                    {errors.pregnant?.message && (
                      <p className="text-xs text-destructive">{errors.pregnant.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="symptomsText" className="text-sm font-semibold">
                    Describe your symptoms (required)
                  </Label>
                  <Textarea
                    id="symptomsText"
                    placeholder="Example: Sore throat, fever for 2 days, fatigue, mild cough..."
                    data-testid="symptoms-textarea"
                    className="
                      mt-2 min-h-[130px] rounded-2xl
                      bg-background/60 border-2 border-border/70
                      focus:border-primary focus:ring-4 focus:ring-primary/10
                      transition-all
                    "
                    {...register("symptomsText")}
                  />
                  {errors.symptomsText?.message && (
                    <p className="mt-2 text-xs text-destructive">{errors.symptomsText.message}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-card-border/70 bg-card/40 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold">Structured symptom list</div>
                      <div className="text-xs text-muted-foreground">
                        Helps the model reason about severity + duration.
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={addSymptom}
                      data-testid="add-symptom"
                      className="
                        rounded-xl px-4
                        bg-gradient-to-r from-primary to-primary/85
                        text-primary-foreground shadow-lg shadow-primary/25
                        hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5
                        active:translate-y-0 active:shadow-md
                        transition-all duration-200
                      "
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {errors.symptoms?.message && (
                    <p className="mt-3 text-xs text-destructive">{String(errors.symptoms.message)}</p>
                  )}

                  <div className="mt-4 space-y-3">
                    {(symptoms ?? []).map((row, idx) => (
                      <div
                        key={idx}
                        className="
                          rounded-2xl border border-border/60 bg-background/40
                          p-3 sm:p-4
                          flex flex-col sm:flex-row sm:items-end gap-3
                        "
                        data-testid={`symptom-row-${idx}`}
                      >
                        <div className="flex-1">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Symptom
                          </Label>
                          <Input
                            value={row.name}
                            onChange={(e) => setSymptom(idx, { name: e.target.value })}
                            placeholder="e.g., chest pain"
                            data-testid={`symptom-name-${idx}`}
                            className="mt-2 rounded-xl bg-background/60 border-2 border-border/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                          />
                        </div>

                        <div className="sm:w-44">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Severity
                          </Label>
                          <div className="mt-2">
                            <Select
                              value={row.severity}
                              onValueChange={(v) => setSymptom(idx, { severity: v as Severity })}
                            >
                              <SelectTrigger
                                data-testid={`symptom-severity-${idx}`}
                                className="rounded-xl bg-background/60 border-2 border-border/70 focus:ring-4 focus:ring-primary/10"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                <SelectItem value="mild">Mild</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="severe">Severe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="sm:w-40">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Duration (days)
                          </Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={row.durationDays ?? ""}
                            onChange={(e) =>
                              setSymptom(idx, { durationDays: e.target.value === "" ? undefined : Number(e.target.value) })
                            }
                            placeholder="optional"
                            data-testid={`symptom-duration-${idx}`}
                            className="mt-2 rounded-xl bg-background/60 border-2 border-border/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeSymptom(idx)}
                          data-testid={`remove-symptom-${idx}`}
                          className="
                            rounded-xl
                            border-border/70 bg-background/40
                            hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30
                            transition-all
                          "
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    By continuing, you agree this tool is informational and not medical advice.
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || createCase.isPending || assessCase.isPending}
                    data-testid="submit-case"
                    className="
                      rounded-2xl px-6 py-6 sm:py-5
                      bg-gradient-to-r from-primary to-accent
                      text-primary-foreground font-bold
                      shadow-lg shadow-primary/25
                      hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5
                      active:translate-y-0 active:shadow-md
                      disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                      transition-all duration-200
                    "
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {busyStep === "creating"
                      ? "Creating case…"
                      : busyStep === "assessing"
                        ? "Assessing…"
                        : "Generate assessment"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </section>

        <aside className="lg:col-span-5 animate-in-up stagger-2">
          <div className="space-y-6">
            <Card className="glass shadow-soft rounded-3xl border-card-border/70">
              <div className="p-6 sm:p-7">
                <h2 className="text-xl font-bold">How to get the best result</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <li>
                    <span className="font-semibold text-foreground">Be specific:</span>{" "}
                    location, timing, triggers, and what you’ve tried.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Add red flags:</span>{" "}
                    fainting, severe shortness of breath, chest pain, confusion, severe bleeding.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Mention conditions:</span>{" "}
                    pregnancy, diabetes, immune issues, recent surgery, allergies.
                  </li>
                </ul>

                <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="text-xs font-bold text-foreground">Safety first</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    If symptoms are severe or rapidly worsening, seek urgent or emergency care.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass shadow-soft rounded-3xl border-card-border/70">
              <div className="p-6 sm:p-7">
                <h2 className="text-xl font-bold">What you’ll receive</h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: "Triage level", desc: "Emergency → self care guidance" },
                    { title: "Red flags", desc: "What needs urgent attention" },
                    { title: "Follow-ups", desc: "Questions to clarify the picture" },
                    { title: "Home care", desc: "Cautious, low-risk suggestions" },
                    { title: "Doctor brief", desc: "What to tell a clinician" },
                    { title: "Conditions", desc: "Possible causes + rationale" },
                  ].map((x, i) => (
                    <div
                      key={x.title}
                      className="
                        rounded-2xl border border-border/60 bg-background/40 p-4
                        transition-all duration-300
                        hover:-translate-y-0.5 hover:bg-background/55
                      "
                      data-testid={`feature-${i}`}
                    >
                      <div className="text-sm font-bold">{x.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{x.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
