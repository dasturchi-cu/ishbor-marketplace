import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ServiceFaq } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function FaqSection({ faqs }: { faqs: ServiceFaq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-secondary/15">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={faq.question} className="bg-card first:rounded-t-2xl last:rounded-b-2xl">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className={cn(
                "flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-default focus-ring sm:px-6 sm:py-5",
                isOpen ? "bg-primary/[0.03]" : "hover:bg-secondary/30",
              )}
            >
              <span className="font-display text-sm font-semibold sm:text-base">{faq.question}</span>
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-default",
                  isOpen && "border-primary/25 bg-primary/5 text-primary",
                )}
              >
                <ChevronDown
                  className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180 text-primary")}
                />
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-border/60 px-5 py-4 text-sm leading-relaxed text-foreground/85 sm:px-6 sm:pb-5">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
