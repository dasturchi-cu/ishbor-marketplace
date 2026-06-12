import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Send,
  Paperclip,
  Phone,
  Video,
  Search,
  ChevronRight,
  Lock,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Smile,
  DollarSign,
  X,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { messages } from "@/lib/mock-data";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Ishbor" }] }),
  component: MessagesPage,
});

type Message = {
  from: "me" | "them";
  body?: string;
  time: string;
  type: "text" | "offer" | "escrow" | "file";
  offer?: { title: string; amount: number; duration: string };
  escrow?: { event: string; amount: number; project: string };
  file?: { name: string; size: string; kind: "pdf" | "image" };
};

const thread: Message[] = [
  { from: "them", type: "text", body: "I've prepared three direction explorations for the dashboard. Want me to walk through them on a call?", time: "10:12" },
  { from: "me", type: "text", body: "Yes please — Thursday 3pm Tashkent time work?", time: "10:14" },
  { from: "them", type: "text", body: "Perfect. I'll send a calendar invite with the Figma link.", time: "10:15" },
  {
    from: "them",
    type: "file",
    body: "Here are the direction explorations:",
    time: "10:16",
    file: { name: "Dashboard_Explorations_v3.pdf", size: "4.2 MB", kind: "pdf" },
  },
  {
    from: "them",
    type: "offer",
    time: "10:18",
    offer: { title: "Fintech App Redesign — Phase 2", amount: 4000, duration: "3 weeks" },
  },
  {
    from: "them",
    type: "escrow",
    time: "10:22",
    escrow: { event: "Milestone funded", amount: 4000, project: "Fintech App Redesign" },
  },
  { from: "me", type: "text", body: "Looks great. Accepting the offer now.", time: "10:24" },
];

function TextBubble({ m }: { m: Message }) {
  const isMe = m.from === "me";
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm ${
          isMe
            ? "rounded-br-sm bg-primary text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.25)]"
            : "rounded-bl-sm border border-border bg-background"
        }`}
      >
        <p className="leading-relaxed">{m.body}</p>
        <div className={`mt-1 text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {m.time}
        </div>
      </div>
    </div>
  );
}

function FileBubble({ m }: { m: Message }) {
  if (!m.file) return null;
  const isMe = m.from === "me";
  const FileIcon = m.file.kind === "image" ? ImageIcon : FileText;
  return (
    <div className={`flex flex-col gap-1.5 ${isMe ? "items-end" : "items-start"}`}>
      {m.body && (
        <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-background"}`}>
          <p>{m.body}</p>
        </div>
      )}
      <div className="flex max-w-[72%] items-center gap-3 rounded-xl border border-border bg-background p-3">
        <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{m.file.name}</div>
          <div className="font-mono text-[11px] text-muted-foreground">{m.file.size}</div>
        </div>
        <button className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-default hover:border-primary/20 focus-ring">
          Open
        </button>
      </div>
      <div className="font-mono text-[10px] text-muted-foreground">{m.time}</div>
    </div>
  );
}

function OfferCard({ m }: { m: Message }) {
  if (!m.offer) return null;
  const [state, setState] = useState<"pending" | "accepted" | "declined">("pending");
  return (
    <div className="flex justify-start">
      <div className="w-72 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="border-b border-border bg-primary/5 px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Custom Offer</div>
          <div className="mt-1 text-sm font-semibold">{m.offer.title}</div>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount</div>
              <div className="font-display mt-0.5 text-xl font-bold">${m.offer.amount.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Duration</div>
              <div className="mt-0.5 font-semibold">{m.offer.duration}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3" />
            Funds released via escrow milestones
          </div>
        </div>
        {state === "pending" ? (
          <div className="flex gap-2 border-t border-border px-4 py-3">
            <button
              onClick={() => setState("declined")}
              className="flex-1 rounded-lg border border-border py-2 text-xs font-medium transition-default hover:border-primary/20 focus-ring"
            >
              Decline
            </button>
            <button
              onClick={() => setState("accepted")}
              className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.2)] transition-default hover:opacity-90 focus-ring"
            >
              Accept
            </button>
          </div>
        ) : (
          <div className={`flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-medium ${state === "accepted" ? "text-success" : "text-muted-foreground"}`}>
            <CheckCircle2 className="size-4" />
            {state === "accepted" ? "Offer accepted" : "Offer declined"}
          </div>
        )}
      </div>
    </div>
  );
}

function EscrowNotification({ m }: { m: Message }) {
  if (!m.escrow) return null;
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/8 px-4 py-2 text-xs font-medium text-success shadow-sm">
        <Lock className="size-3.5" />
        <span className="font-semibold">{m.escrow.event}:</span>
        <span>${m.escrow.amount.toLocaleString()} funded · {m.escrow.project}</span>
      </div>
    </div>
  );
}

function MessagesPage() {
  const [input, setInput] = useState("");

  return (
    <WorkspaceShell eyebrow="Inbox" title="Messages">
      <div className="grid h-[calc(100vh-200px)] min-h-[560px] overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="flex flex-col border-r border-border">
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                placeholder="Search conversations..."
                className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {messages.map((m, i) => (
              <button
                key={m.id}
                className={`flex w-full items-center gap-3 border-b border-border p-3 text-left transition-default hover:bg-secondary/30 ${
                  i === 0 ? "bg-primary/5" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <GradientAvatar name={m.name} hue={m.hue} size={40} />
                  {m.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-success ring-2 ring-card" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${m.unread > 0 ? "font-semibold" : "font-medium"}`}>
                      {m.name}
                    </span>
                    <span className="font-mono shrink-0 text-[10px] text-muted-foreground">{m.time}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.snippet}</div>
                </div>
                {m.unread > 0 && (
                  <span className="font-mono inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {m.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex min-h-0 flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              <GradientAvatar name="Nargiza Akhmedova" hue={250} size={36} />
              <div>
                <div className="text-sm font-semibold">Nargiza Akhmedova</div>
                <div className="font-mono flex items-center gap-1.5 text-[10px] text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  Online · typing...
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-default hover:border-primary/20 focus-ring">
                <Lock className="size-3.5 text-primary" /> Escrow
              </button>
              <button className="inline-flex size-8 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring">
                <Phone className="size-4" />
              </button>
              <button className="inline-flex size-8 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring">
                <Video className="size-4" />
              </button>
              <button className="inline-flex size-8 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </header>

          {/* Context banner */}
          <div className="flex items-center justify-between border-b border-border bg-primary/5 px-5 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <Lock className="size-3.5 text-primary" />
              <span className="font-medium">Fintech App Redesign</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">$12,000 escrow funded</span>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-default hover:opacity-80">
              View contract <ChevronRight className="size-3" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {thread.map((m, i) => {
              if (m.type === "escrow") return <EscrowNotification key={i} m={m} />;
              if (m.type === "offer") return <OfferCard key={i} m={m} />;
              if (m.type === "file") return <FileBubble key={i} m={m} />;
              return <TextBubble key={i} m={m} />;
            })}
            {/* Typing indicator */}
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-background px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full bg-muted-foreground/40"
                    style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-border p-3">
            <div className="rounded-xl border border-border bg-background focus-within:border-primary/30 transition-default">
              <div className="flex items-center gap-2 px-3 pt-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="flex items-center justify-between px-3 pb-2 pt-2">
                <div className="flex items-center gap-0.5">
                  <button className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-secondary hover:text-foreground focus-ring">
                    <Paperclip className="size-4" />
                  </button>
                  <button className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-secondary hover:text-foreground focus-ring">
                    <ImageIcon className="size-4" />
                  </button>
                  <button className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-secondary hover:text-foreground focus-ring">
                    <Smile className="size-4" />
                  </button>
                  <div className="mx-1 h-4 w-px bg-border" />
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-default hover:border-primary/30 hover:text-primary focus-ring">
                    <DollarSign className="size-3" /> Send offer
                  </button>
                </div>
                <button
                  disabled={!input.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.2)] transition-default hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
                >
                  Send <Send className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
