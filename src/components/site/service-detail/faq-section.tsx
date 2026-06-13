import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ServiceFaq } from "@/lib/mock-data";

export function FaqSection({ faqs }: { faqs: ServiceFaq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div key={faq.question} className="overflow-hidden rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-default hover:bg-elevated/30 focus-ring"
          >
            <span className="text-sm font-semibold">{faq.question}</span>
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-foreground/85">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
