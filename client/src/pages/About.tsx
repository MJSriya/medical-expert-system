import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Lock, Shield, Siren } from "lucide-react";

export default function About() {
  return (
    <AppShell>
      <Seo
        title="LumenClinic — About & Safety"
        description="Safety guidance, limitations, and privacy notes for the symptom checker."
      />

      <div className="animate-in-up">
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold">About & safety</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
            LumenClinic is a cautious triage assistant. It can help you think through next steps,
            but it cannot diagnose conditions and may be wrong.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <section className="lg:col-span-7 space-y-6">
            <Card className="glass shadow-soft rounded-3xl border-card-border/70">
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                    <Siren className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Emergency guidance</h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      If you have severe chest pain, trouble breathing, fainting, signs of stroke,
                      severe bleeding, confusion, or feel unsafe — seek emergency care now.
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="rounded-2xl border border-border/60 bg-background/35 p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[hsl(32_94%_56%)] mt-0.5" />
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      This tool may miss important diagnoses. Always use your judgment and seek
                      professional care when concerned.
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass shadow-soft rounded-3xl border-card-border/70">
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Limitations</h2>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground leading-relaxed">
                      <li>Not a diagnosis or treatment plan.</li>
                      <li>May be incomplete without physical exam, labs, or imaging.</li>
                      <li>Not tailored to your complete medical history.</li>
                      <li>Outputs may be biased or inaccurate.</li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-6" />

                <h3 className="text-sm font-bold">How to use it safely</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      title: "Start with red flags",
                      desc: "If present, seek care even if the triage seems low.",
                    },
                    {
                      title: "Monitor changes",
                      desc: "Worsening, new symptoms, or dehydration deserve attention.",
                    },
                    {
                      title: "Use for preparation",
                      desc: "Bring the ‘what to tell doctor’ list to appointments.",
                    },
                    {
                      title: "When in doubt",
                      desc: "Err toward professional help—especially for children and pregnancy.",
                    },
                  ].map((x) => (
                    <div
                      key={x.title}
                      className="rounded-2xl border border-border/60 bg-background/35 p-5"
                      data-testid={`about-tip-${x.title}`}
                    >
                      <div className="text-sm font-bold">{x.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{x.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          <aside className="lg:col-span-5 space-y-6">
            <Card className="glass shadow-soft rounded-3xl border-card-border/70">
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-accent/10 border border-accent/15 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Privacy notes</h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Avoid sharing identifying information. This app stores symptom cases for
                      your history view. Treat it like sensitive health data.
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="rounded-2xl border border-border/60 bg-background/35 p-5">
                  <div className="text-sm font-bold">Good practice</div>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground leading-relaxed">
                    <li>Use general descriptions instead of names or addresses.</li>
                    <li>Double-check outputs and bring concerns to a clinician.</li>
                    <li>Delete browser data if using a shared device.</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="glass shadow-soft rounded-3xl border-card-border/70">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-bold">Medical disclaimer</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed" data-testid="about-disclaimer">
                  LumenClinic provides general information only and is not a substitute for
                  professional medical advice, diagnosis, or treatment. If you think you may have a
                  medical emergency, call your local emergency number immediately.
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
