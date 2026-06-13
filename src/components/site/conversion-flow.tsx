import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlowStep = {
  key: string;
  label: string;
  to?: string;
};

type ConversionFlowProps = {
  title: string;
  steps: FlowStep[];
  currentStep: string;
  nextHint: string;
  className?: string;
};

export function ConversionFlowBanner({
  title,
  steps,
  currentStep,
  nextHint,
  className,
}: ConversionFlowProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className={cn("rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
            {title}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{nextHint}</p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-1.5 text-xs font-medium text-primary">
          Next <ArrowRight className="size-3" />
          <span>{steps[Math.min(currentIndex + 1, steps.length - 1)]?.label ?? "Complete"}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 sm:gap-2">
        {steps.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = step.key === currentStep;
          const content = (
            <>
              <span
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  isCurrent && "bg-primary text-primary-foreground",
                  isDone && "bg-success text-success-foreground",
                  !isCurrent && !isDone && "bg-secondary text-muted-foreground",
                )}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCurrent && "text-foreground",
                  isDone && "text-foreground/80",
                  !isCurrent && !isDone && "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </>
          );

          return (
            <div key={step.key} className="flex items-center gap-1 sm:gap-2">
              {step.to && (isDone || isCurrent) ? (
                <Link
                  to={step.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-default hover:bg-primary/10",
                    isCurrent && "bg-primary/10",
                  )}
                >
                  {content}
                </Link>
              ) : (
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1",
                    isCurrent && "bg-primary/10",
                  )}
                >
                  {content}
                </div>
              )}
              {i < steps.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground/50" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const CLIENT_HIRE_FLOW: FlowStep[] = [
  { key: "service", label: "Service", to: "/services" },
  { key: "checkout", label: "Checkout", to: "/checkout" },
  { key: "escrow", label: "Escrow", to: "/escrow" },
  { key: "order", label: "Order", to: "/orders" },
];

export const FREELANCER_HIRE_FLOW: FlowStep[] = [
  { key: "project", label: "Project", to: "/projects" },
  { key: "proposal", label: "Proposal" },
  { key: "application", label: "Application", to: "/applications" },
  { key: "accepted", label: "Accepted" },
  { key: "order", label: "Order", to: "/orders" },
];
