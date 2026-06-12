import { createFileRoute } from "@tanstack/react-router";
import { Send, Paperclip, Phone, Video, Search } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { messages } from "@/lib/mock-data";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Ishbor" }] }),
  component: MessagesPage,
});

const thread = [
  { from: "them", body: "I've prepared three direction explorations for the dashboard. Want me to walk through them on a call?", time: "10:12" },
  { from: "me", body: "Yes please — Thursday 3pm Tashkent time work?", time: "10:14" },
  { from: "them", body: "Perfect. I'll send a calendar invite with the Figma link.", time: "10:15" },
  { from: "them", body: "Also — the escrow milestone went through. Thank you 🚙", time: "10:16" },
];

function MessagesPage() {
  return (
    <WorkspaceShell eyebrow="Inbox" title="Messages">
      <div className="grid h-[calc(100vh-220px)] min-h-[520px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[300px_1fr]">
        <aside className="border-r border-border">
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs transition-default focus-ring">
              <Search className="size-3.5 text-muted-foreground"/>
              <input placeholder="Search conversations" className="w-full bg-transparent outline-none"/>
            </div>
          </div>
          <div className="overflow-y-auto">
            {messages.map((m, i) => (
              <button
                key={m.id}
                className={`flex w-full items-center gap-3 border-b border-border p-3 text-left transition-default hover:bg-secondary/30 ${
                  i === 0 ? "bg-secondary/50" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <GradientAvatar name={m.name} hue={m.hue} size={40}/>
                  {m.online && <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-success ring-2 ring-card"/>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold">{m.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{m.time}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{m.snippet}</div>
                </div>
                {m.unread > 0 && (
                  <span className="font-mono inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {m.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <header className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <GradientAvatar name="Nargiza Akhmedova" hue={22} size={36}/>
              <div>
                <div className="text-sm font-semibold">Nargiza Akhmedova</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-success">Online · typing</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring"><Phone className="size-4"/></button>
              <button className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring"><Video className="size-4"/></button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {thread.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm transition-default ${
                    m.from === "me"
                      ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)]"
                      : "border border-border bg-background"
                  }`}
                >
                  <div>{m.body}</div>
                  <div className={`font-mono mt-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {m.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2 transition-default focus-ring">
              <button className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-secondary focus-ring"><Paperclip className="size-4"/></button>
              <input placeholder="Write a message…" className="w-full bg-transparent text-sm outline-none"/>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring">
                Send <Send className="size-3.5"/>
              </button>
            </div>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}