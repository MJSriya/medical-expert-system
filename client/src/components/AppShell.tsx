import { PropsWithChildren, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Activity, CircleHelp, History, Stethoscope } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
};

export default function AppShell({ children }: PropsWithChildren) {
  const [loc] = useLocation();

  const nav: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Symptom Checker", icon: Stethoscope, testId: "nav-checker" },
      { href: "/history", label: "History", icon: History, testId: "nav-history" },
      { href: "/about", label: "About & Safety", icon: CircleHelp, testId: "nav-about" },
    ],
    [],
  );

  return (
    <div className="min-h-dvh bg-atmosphere grain-overlay">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <header className="animate-in-up">
          <div
            className="
              glass shadow-soft rounded-2xl
              px-4 sm:px-6 py-4
              flex items-center justify-between gap-4
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  h-10 w-10 rounded-2xl
                  bg-gradient-to-br from-primary/20 via-accent/15 to-transparent
                  border border-card-border/70
                  flex items-center justify-center
                  shadow-sm
                "
                aria-hidden="true"
              >
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="leading-tight">
                <div className="text-lg sm:text-xl font-bold tracking-tight">
                  LumenClinic
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Symptom triage assistant (not medical advice)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>

          <nav
            className="
              mt-4
              glass shadow-soft rounded-2xl
              px-2 py-2
              overflow-x-auto
            "
            aria-label="Primary"
          >
            <div className="flex items-center gap-2 min-w-max">
              {nav.map((item) => {
                const active = item.href === "/"
                  ? loc === "/"
                  : loc.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={item.testId}
                    className={cn(
                      "group ring-focus",
                      "inline-flex items-center gap-2",
                      "px-4 py-2.5 rounded-xl",
                      "text-sm font-semibold",
                      "transition-all duration-300",
                      active
                        ? "bg-gradient-to-r from-primary/18 to-accent/12 text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/40",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-transform duration-300",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                        "group-hover:scale-110",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </header>

        <main className="mt-6 sm:mt-8">{children}</main>

        <footer className="mt-10 pb-10 text-center text-xs text-muted-foreground animate-in-fade">
          <p>
            If you think you’re having a medical emergency, call your local emergency
            number immediately.
          </p>
        </footer>
      </div>
    </div>
  );
}
