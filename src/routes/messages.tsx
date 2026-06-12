import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Paperclip, Phone, Video, Search, MoreHorizontal, ShieldCheck, Smile } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { messages } from "@/lib/mock-data";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Ishbor" }] }),
  component: MessagesPage,
});

const thread = [
  { from: "them", body: "I've prepared three direction explorations for the dashboard redesign. Each has a distinct personality — which vibe resonates with you before I build out the full screens?", time: "10:12" },
  { from: "me", body: "These look incredible. Direction B is closest to what I had in mind. Can we get on a call Thursday 3pm Tashkent time?", time: "10:14" },
  { from: "them", body: "Perfect! I'll send a calendar invite with the Figma prototype link. Also confirming — the second escrow milestone went through.", time: "10:15" },
  { from: "me", body: "Yes I approved it earlier. Great work so far.", time: "10:16" },
  { from: "offer", time: "10:20" },
  { from: "them", body: "Let me know once you've reviewed the offer. Happy to adjust the scope.", time: "10:32" },
];

type FilterType = "All" | "Unread" | "Clients" | "Flagged";

function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [showEscrowBanner, setShowEscrowBanner] = useState(true);
  const filters: FilterType[] = ["All", "Unread", "Clients", "Flagged"];

  return (
    <WorkspaceShell eyebrow="Inbox" title="Messages">
      <div className="grid h-[calc(100vh-220px)] min-h-[560px] overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[300px_1fr]">
        <aside className="hidden border-r border-border md:flex md:flex-col">
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 transition-default focus-ring">
              <Search className="size-3.5 text-muted-foreground" />
              <input placeholder="Search messages..." className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="flex gap-1 border-b border-border px-3 py-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition-default ${
                  activeFilter === filter ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {messages.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setActiveConversation(i)}
                className={`flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-default ${
                  activeConversation === i ? "border-l-2 border-l-primary bg-primary/5" : "hover:bg-secondary/30"
                }`}
              >
                <div className="relative shrink-0">
                  <GradientAvatar name={m.name} hue={m.hue} size={40} />
                  {m.online && <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-success ring-2 ring-card" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold">{m.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{m.time}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{m.snippet}</div>
                </div>
                {m.unread > 0 && (
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground">
                    {m.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <GradientAvatar name="Nargiza Akhmedova" hue={250} size={36} />
              <div>
                <div className="text-sm font-semibold">Nargiza Akhmedova</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-success">Online · designing</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 hover:bg-secondary/50 focus-ring"><Phone className="size-4" /></button>
              <button className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 hover:bg-secondary/50 focus-ring"><Video className="size-4" /></button>
              <button className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 hover:bg-secondary/50 focus-ring"><MoreHorizontal className="size-4" /></button>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {thread.map((m, i) => {
              if (m.from === "offer") {
                return (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[72%] space-y-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="mb-1 text-sm font-semibold">Milestone Proposal — Phase 2</div>
                        <div className="mb-4 text-sm text-muted-foreground">High-fidelity screens + prototype · $4,000 · 14 days</div>
                        <div className="flex gap-2">
                          <button className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-default focus-ring">Accept & fund escrow</button>
                          <button className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold transition-default hover:bg-secondary/30 focus-ring">Decline</button>
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">{m.time}</div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[72%] space-y-1">
                    <div className={`rounded-xl px-4 py-2.5 text-sm ${
                      m.from === "me"
                        ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)]"
                        : "border border-border bg-background"
                    }`}>
                      {m.body}
                    </div>
                    <div className={`font-mono text-[10px] ${
                      m.from === "me" ? "text-right text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {showEscrowBanner && (
            <div className="border-t border-border px-6 py-3">
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <span className="text-sm font-semibold">Milestone offer pending — $4,000</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-xs font-semibold text-primary transition-default hover:text-primary/80 focus-ring">Review offer</button>
                  <button onClick={() => setShowEscrowBanner(false)} className="text-xs text-muted-foreground transition-default hover:text-foreground focus-ring">Dismiss</button>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-border px-6 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2 transition-default">
              <button className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-secondary hover:text-foreground focus-ring"><Paperclip className="size-4" /></button>
              <button className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-secondary hover:text-foreground focus-ring"><Smile className="size-4" /></button>
              <input placeholder="Write a message…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring">
                Send <Send className="size-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
