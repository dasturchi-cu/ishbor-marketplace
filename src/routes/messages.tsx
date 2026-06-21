import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Send,
  Paperclip,
  Phone,
  Video,
  Search,
  ChevronRight,
  ChevronLeft,
  Lock,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  DollarSign,
  Archive,
  Inbox,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { StandardEmptyState } from "@/components/ux/standard-empty-state";
import { PrimaryLink } from "@/components/ux/action-buttons";
import { confirmDestructive } from "@/components/site/feedback";
import { useActiveRole } from "@/hooks/use-active-role";
import { GradientAvatar } from "@/components/site/avatar";
import { FileAttachModal, SendOfferModal, EscrowActionModal } from "@/components/site/modals";
import { MessageEmojiPicker } from "@/components/messages/emoji-picker";
import { MessageTrustChip } from "@/components/trust/trust-summary";
import { CallModal } from "@/components/messages/call-modal";
import { freelancers, escrowWorkflows } from "@/lib/mock-data";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { downloadTextFile } from "@/lib/export-utils";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { ensureClientRoleForCheckout, buildCheckoutRedirectPath } from "@/lib/client-checkout";
import { createOrder } from "@/lib/orders-store";
import { createEscrowFromOrder } from "@/lib/escrow-store";
import { addNotification } from "@/lib/notifications-store";
import {
  subscribeMessages,
  getMessagesState,
  getThread,
  searchConversations,
  sendMessage,
  attachFile,
  sendOffer,
  fundEscrowMessage,
  updateOfferState,
  markConversationRead,
  archiveConversation,
  pinConversation,
  setTyping,
  isTyping,
  formatLastSeen,
  getActiveConversationId,
  getConversationsByInbox,
  type ThreadMessage,
  type Conversation,
  type ConversationInbox,
} from "@/lib/messages-store";

export const Route = createFileRoute("/messages")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Xabarlar — Ishbor" }] }),
  component: () => (
    <ProtectedGate>
      <MessagesPage />
    </ProtectedGate>
  ),
});

function getParticipantDisplay(conversation: Conversation) {
  if (conversation.participantUsername) {
    const freelancer = freelancers.find((f) => f.username === conversation.participantUsername);
    if (freelancer) {
      return { name: freelancer.name, hue: freelancer.hue, username: freelancer.username };
    }
  }
  return {
    name: conversation.name,
    hue: conversation.hue,
    username: conversation.participantUsername,
  };
}

function TextBubble({ m }: { m: ThreadMessage }) {
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
        <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          <span>{m.time}</span>
          {isMe && m.read && <span title="O'qildi">✓✓</span>}
        </div>
      </div>
    </div>
  );
}

function FileBubble({ m }: { m: ThreadMessage }) {
  const file = m.file;
  if (!file) return null;
  const isMe = m.from === "me";
  const FileIcon = file.kind === "image" ? ImageIcon : FileText;
  return (
    <div className={`flex flex-col gap-1.5 ${isMe ? "items-end" : "items-start"}`}>
      {m.body && (
        <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-background"}`}>
          <p>{m.body}</p>
        </div>
      )}
      <div className="flex max-w-[72%] flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center">
        <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{file.name}</div>
          <div className="font-mono text-[11px] text-muted-foreground">{file.size}</div>
        </div>
        <button
          onClick={() => {
            downloadTextFile(
              file.name,
              `${file.name}\nHajm: ${file.size}\n\nIshbor xabarlar ilovasidan yuklab olindi.`,
            );
          }}
          className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-default hover:border-primary/20 focus-ring"
        >
          Ochish
        </button>
      </div>
      <div className="font-mono text-[10px] text-muted-foreground">{m.time}</div>
    </div>
  );
}

function OfferCard({
  m,
  canRespond,
  onAccept,
  onDecline,
}: {
  m: ThreadMessage;
  canRespond?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  if (!m.offer) return null;
  const state = m.offer.state ?? "pending";
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-72 overflow-hidden rounded-2xl border border-border bg-background shadow-sm sm:w-72">
        <div className="border-b border-border bg-primary/5 px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Maxsus taklif</div>
          <div className="mt-1 text-sm font-semibold">{m.offer.title}</div>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Summa</div>
              <div className="font-display mt-0.5 text-xl font-bold">${m.offer.amount.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Muddat</div>
              <div className="mt-0.5 font-semibold">{m.offer.duration}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3" />
            Mablag' eskrou bosqichlari orqali chiqariladi
          </div>
        </div>
        {state === "pending" && canRespond ? (
          <div className="flex gap-2 border-t border-border px-4 py-3">
            <button
              onClick={onDecline}
              className="flex-1 rounded-lg border border-border py-2 text-xs font-medium transition-default hover:border-primary/20 focus-ring"
            >
              Rad etish
            </button>
            <button
              onClick={onAccept}
              className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.2)] transition-default hover:opacity-90 focus-ring"
            >
              Qabul qilish
            </button>
          </div>
        ) : state !== "pending" ? (
          <div
            className={`flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-medium ${
              state === "accepted" ? "text-success" : "text-muted-foreground"
            }`}
          >
            <CheckCircle2 className="size-4" />
            {state === "accepted"
              ? "Taklif qabul qilindi"
              : state === "expired"
                ? "Taklif muddati tugadi"
                : "Taklif rad etildi"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EscrowNotification({ m }: { m: ThreadMessage }) {
  if (!m.escrow) return null;
  return (
    <div className="flex justify-center">
      <div className="flex justify-center px-2">
        <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-success/20 bg-success/8 px-3 py-2 text-xs font-medium text-success shadow-sm sm:px-4">
          <Lock className="size-3.5" />
          <span className="font-semibold">{m.escrow.event}:</span>
          <span className="truncate">
            ${m.escrow.amount.toLocaleString()} moliyalashtirildi · {m.escrow.project}
          </span>
        </div>
      </div>
    </div>
  );
}

function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const [input, setInput] = useState("");
  const [showList, setShowList] = useState(true);
  const [activeId, setActiveId] = useState(getActiveConversationId);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileOchish, setFileOchish] = useState(false);
  const [offerOchish, setOfferOchish] = useState(false);
  const [escrowOchish, setEscrowOchish] = useState(false);
  const [menuOchish, setMenuOchish] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [inboxTab, setInboxTab] = useState<ConversationInbox>("active");
  const [listLimit, setListLimit] = useState(50);
  const [, setTypingTick] = useState(0);

  const messagesState = useSyncExternalStore(subscribeMessages, getMessagesState, getMessagesState);

  const archivedCount = useMemo(
    () => getConversationsByInbox("archived").length,
    [messagesState],
  );

  const filteredConversations = useMemo(
    () => searchConversations(searchQuery, inboxTab),
    [messagesState, searchQuery, inboxTab],
  );

  const visibleConversations = useMemo(
    () => filteredConversations.slice(0, listLimit),
    [filteredConversations, listLimit],
  );

  useEffect(() => {
    setListLimit(50);
  }, [searchQuery, inboxTab]);

  useEffect(() => {
    if (!activeId || !isTyping(activeId)) return;
    const timer = window.setInterval(() => setTypingTick((t) => t + 1), 400);
    return () => window.clearInterval(timer);
  }, [activeId, messagesState]);

  const thread = useMemo(() => getThread(activeId), [messagesState, activeId]);

  const activeConversation =
    filteredConversations.find((c) => c.id === activeId) ?? filteredConversations[0] ?? null;

  const participant = activeConversation ? getParticipantDisplay(activeConversation) : null;
  const isClient = activeRole === "client";
  const projectTitle = activeConversation?.projectContext ?? "Faol loyiha";
  const escrowTotal = activeConversation?.escrowAmount ?? 0;
  const matchedEscrow = activeConversation?.projectContext
    ? escrowWorkflows.find((ew) => ew.project === activeConversation.projectContext)
    : undefined;
  const hasAnyConversations = getMessagesState().conversations.length > 0;

  const startCall = (type: "voice" | "video") => {
    if (!activeConversation || !participant) return;
    setCallType(type);
    setCallOpen(true);
    setMenuOchish(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setShowList(false);
    markConversationRead(id);
  };

  const handleInboxTabChange = (tab: ConversationInbox) => {
    setInboxTab(tab);
    setSearchQuery("");
    const next = getConversationsByInbox(tab)[0];
    if (next) {
      setActiveId(next.id);
      markConversationRead(next.id);
    }
  };

  const handleArchiveConversation = () => {
    if (!activeId) return;
    if (!confirmDestructive("Suhbatni arxivlashni tasdiqlaysizmi?")) return;
    archiveConversation(activeId, true);
    setMenuOchish(false);
    toast.success("Suhbat arxivlandi", {
      description: "Arxivlangan suhbatlarni chap paneldagi «Arxivlangan» tabida topasiz.",
    });
    const remaining = getConversationsByInbox("active");
    if (remaining[0]) {
      setActiveId(remaining[0].id);
      markConversationRead(remaining[0].id);
    }
  };

  const handleUnarchiveConversation = () => {
    if (!activeId) return;
    archiveConversation(activeId, false);
    setMenuOchish(false);
    toast.success("Suhbat faol qutiga qaytarildi");
    setInboxTab("active");
    const active = getConversationsByInbox("active");
    if (active[0]) {
      setActiveId(active[0].id);
      markConversationRead(active[0].id);
    }
  };

  const handleAcceptOffer = (messageId: string, offer: NonNullable<ThreadMessage["offer"]>) => {
    if (!user || !isClient || !activeConversation) return;

    const freelancer = activeConversation.participantUsername
      ? freelancers.find((f) => f.username === activeConversation.participantUsername)
      : undefined;

    const order = createOrder({
      title: offer.title,
      client: user.company ?? user.fullName,
      clientHue: user.avatarHue,
      clientSlug: user.companySlug,
      freelancer: freelancer?.name ?? activeConversation.name,
      freelancerHue: freelancer?.hue ?? activeConversation.hue,
      freelancerUsername: freelancer?.username ?? activeConversation.participantUsername,
      amount: offer.amount,
      dueDate: offer.duration,
    });

    createEscrowFromOrder(order);
    updateOfferState(activeId, messageId, "accepted", order.id);

    addNotification({
      kind: "order",
      title: "Taklif qabul qilindi",
      body: `Siz "${offer.title}" qabul qildingiz. Eskrouni moliyalashtirish uchun to'lovni yakunlang.`,
      priority: "high",
      href: `/checkout?type=order&order=${order.id}`,
    });

    toast.success("Taklif qabul qilindi — to'lov sahifasiga yo'naltirilmoqda");
    ensureClientRoleForCheckout();
    navigate({ to: "/checkout", search: { type: "order", order: order.id } });
  };

  const handleDeclineOffer = (messageId: string) => {
    updateOfferState(activeId, messageId, "declined");
    toast.success("Taklif rad etildi");
  };

  if (!hasAnyConversations) {
    return (
      <WorkspaceShell eyebrow="Kirish qutisi" title="Xabarlar">
        <StandardEmptyState
          icon={Inbox}
          title="Hali suhbatlar yo'q"
          description="Buyurtma yoki loyiha bo'yicha frilanser/mijoz bilan bog'laning."
          action={
            activeRole === "client" ? (
              <PrimaryLink to="/freelancers">Frilanser topish</PrimaryLink>
            ) : (
              <PrimaryLink to="/projects">Loyihalarni ko'rish</PrimaryLink>
            )
          }
        />
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell eyebrow="Kirish qutisi" title="Xabarlar">
      <div className="grid h-[calc(100dvh-12rem)] min-h-0 overflow-hidden rounded-2xl border border-border bg-card md:h-[calc(100vh-200px)] md:min-h-[560px] md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className={`${showList ? "flex" : "hidden"} min-h-0 flex-col border-r border-border md:flex`}>
          <div className="space-y-2 border-b border-border p-3">
            <div className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suhbatlarni qidirish..."
                className="min-h-11 w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => handleInboxTabChange("active")}
                className={`touch-target inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-default ${
                  inboxTab === "active"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <Inbox className="size-3.5" />
                Faol
              </button>
              <button
                type="button"
                onClick={() => handleInboxTabChange("archived")}
                className={`touch-target inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-default ${
                  inboxTab === "archived"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <Archive className="size-3.5" />
                Arxivlangan
                {archivedCount > 0 && (
                  <span className="font-mono text-[10px] opacity-80">{archivedCount}</span>
                )}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="space-y-3 p-4 text-center text-xs text-muted-foreground">
                <p>
                  {inboxTab === "archived"
                    ? "Arxivlangan suhbatlar yo'q."
                    : searchQuery
                      ? "Qidiruvingizga mos suhbatlar topilmadi."
                      : archivedCount > 0
                        ? "Barcha suhbatlar arxivlangan."
                        : "Faol suhbatlar yo'q."}
                </p>
                {inboxTab === "active" && archivedCount > 0 && !searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleInboxTabChange("archived")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Arxivlangan suhbatlarni ko'rish ({archivedCount})
                  </button>
                )}
              </div>
            ) : (
              <>
              {visibleConversations.map((m) => {
                const display = getParticipantDisplay(m);
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectConversation(m.id)}
                    className={`touch-target flex w-full items-center gap-3 border-b border-border p-3 text-left transition-default hover:bg-secondary/30 ${
                      m.id === activeId ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <GradientAvatar name={display.name} hue={display.hue} size={40} />
                      {m.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-success ring-2 ring-card" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${m.unread > 0 ? "font-semibold" : "font-medium"}`}>
                          {display.name}
                          {m.pinned && <span className="ml-1 text-[10px] text-primary">📌</span>}
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
                );
              })}
              {filteredConversations.length > listLimit && (
                <button
                  type="button"
                  onClick={() => setListLimit((l) => l + 50)}
                  className="w-full border-b border-border px-3 py-3 text-center text-xs font-medium text-primary hover:bg-secondary/30"
                >
                  Yana {Math.min(50, filteredConversations.length - listLimit)} ta suhbat
                </button>
              )}
              </>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex min-h-0 flex-col md:flex">
          {showList && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center md:hidden">
              <Inbox className="size-10 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">Suhbatni tanlang</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Chapdagi ro'yxatdan suhbat tanlang yoki yangi taklif yuboring.
              </p>
            </div>
          )}
          <div className={`${showList ? "hidden md:flex" : "flex"} min-h-0 flex-1 flex-col`}>
            {!activeConversation || !participant ? (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {inboxTab === "archived"
                  ? "Arxivdan suhbat tanlang yoki faol qutiga qaytaring."
                  : "Chap paneldan suhbat tanlang."}
              </div>
            ) : (
              <>
            {/* Header */}
            <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowList(true)}
                  className="touch-target inline-flex shrink-0 items-center justify-center rounded-lg border border-border md:hidden"
                  aria-label="Suhbatlarga qaytish"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <GradientAvatar name={participant.name} hue={participant.hue} size={36} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{participant.name}</div>
                  <MessageTrustChip username={participant.username} />
                  <div className="font-mono flex items-center gap-1.5 text-[10px] text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    {activeConversation.online ? "Onlayn" : "Oflayn"}{" "}
                    {activeConversation.unread === 0 ? "· O'qilgan" : "· Yetkazilgan"}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setEscrowOchish(true)}
                  className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium transition-default hover:border-primary/20 focus-ring"
                >
                  <Lock className="size-3.5 text-primary" /> <span className="hidden sm:inline">Eskrou</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCall("voice")}
                  className="touch-target hidden items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring sm:inline-flex"
                  aria-label="Ovozli qo'ng'iroq"
                  title="Ovozli qo'ng'iroq"
                >
                  <Phone className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => startCall("video")}
                  className="touch-target hidden items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring sm:inline-flex"
                  aria-label="Video qo'ng'iroq"
                  title="Video qo'ng'iroq"
                >
                  <Video className="size-4" />
                </button>
                <button
                  onClick={() => setMenuOchish(!menuOchish)}
                  className="touch-target relative inline-flex items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring"
                  aria-label="Boshqa variantlar"
                >
                  <MoreHorizontal className="size-4" />
                  {menuOchish && (
                    <div className="liquid-glass-panel absolute right-0 top-full z-10 mt-1 w-40 rounded-lg py-1 shadow-lg">
                      {inboxTab === "archived" || activeConversation.archived ? (
                        <button
                          onClick={handleUnarchiveConversation}
                          className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary/50"
                        >
                          Arxivdan chiqarish
                        </button>
                      ) : (
                        <button
                          onClick={handleArchiveConversation}
                          className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary/50"
                        >
                          Arxivlash
                        </button>
                      )}
                      <button
                        onClick={() => {
                          pinConversation(activeId, !activeConversation.pinned);
                          toast.success(activeConversation.pinned ? "Suhbat qadadan olindi" : "Suhbat qadalandi");
                          setMenuOchish(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary/50"
                      >
                        {activeConversation.pinned ? "Qadadan olish" : "Qadalash"}
                      </button>
                    </div>
                  )}
                </button>
              </div>
            </header>

            {/* Context banner */}
            {activeConversation.projectContext && (
              <div className="flex flex-col gap-2 border-b border-border bg-primary/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                  <Lock className="size-3.5 shrink-0 text-primary" />
                  <span className="font-medium">{projectTitle}</span>
                  {escrowTotal > 0 && (
                    <>
                      <span className="hidden text-muted-foreground sm:inline">·</span>
                      <span className="text-muted-foreground">${escrowTotal.toLocaleString()} eskrou moliyalashtirilgan</span>
                    </>
                  )}
                </div>
                {matchedEscrow ? (
                  <Link
                    to="/escrow/$id"
                    params={{ id: matchedEscrow.id }}
                    className="touch-target inline-flex shrink-0 items-center gap-1 self-start text-xs font-medium text-primary transition-default hover:opacity-80 sm:self-auto"
                  >
                    Shartnomani ko'rish <ChevronRight className="size-3" />
                  </Link>
                ) : (
                  <Link
                    to="/escrow"
                    className="touch-target inline-flex shrink-0 items-center gap-1 self-start text-xs font-medium text-primary transition-default hover:opacity-80 sm:self-auto"
                  >
                    Eskrou ro'yxati <ChevronRight className="size-3" />
                  </Link>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
              {thread.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Hali xabarlar yo'q. Salom bering!
                </div>
              ) : (
                thread.map((m) => {
                  if (m.type === "escrow") return <EscrowNotification key={m.id} m={m} />;
                  if (m.type === "offer") {
                    return (
                      <OfferCard
                        key={m.id}
                        m={m}
                        canRespond={isClient && m.from === "them" && (m.offer?.state ?? "pending") === "pending"}
                        onAccept={() => m.offer && handleAcceptOffer(m.id, m.offer)}
                        onDecline={() => handleDeclineOffer(m.id)}
                      />
                    );
                  }
                  if (m.type === "file") return <FileBubble key={m.id} m={m} />;
                  return <TextBubble key={m.id} m={m} />;
                })
              )}
              {isTyping(activeId) && (
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
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-3">
              <div className="liquid-glass rounded-xl transition-default focus-within:border-primary/30">
                <div className="flex items-center gap-2 px-3 pt-2 sm:pt-3">
                  <input
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (activeId && e.target.value.trim()) setTyping(activeId, true);
                      else if (activeId) setTyping(activeId, false);
                    }}
                    onBlur={() => activeId && setTyping(activeId, false)}
                    placeholder="Xabar yozing..."
                    className="min-h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                        e.preventDefault();
                        sendMessage(activeId, input.trim());
                        setInput("");
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2 pt-2">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setFileOchish(true)}
                      className="touch-target liquid-glass-chip inline-flex items-center justify-center rounded-lg text-muted-foreground transition-default hover:text-foreground focus-ring"
                      aria-label="Fayl biriktirish"
                    >
                      <Paperclip className="size-4" />
                    </button>
                    <button
                      onClick={() => setFileOchish(true)}
                      className="touch-target liquid-glass-chip inline-flex items-center justify-center rounded-lg text-muted-foreground transition-default hover:text-foreground focus-ring"
                      aria-label="Rasm biriktirish"
                    >
                      <ImageIcon className="size-4" />
                    </button>
                    <MessageEmojiPicker onSelect={(e) => setInput((v) => v + e)} />
                    <button
                      onClick={() => setOfferOchish(true)}
                      className="touch-target liquid-glass-chip inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 text-xs font-medium text-muted-foreground transition-default hover:border-primary/30 hover:text-primary focus-ring"
                    >
                      <DollarSign className="size-3" />
                      <span className="hidden sm:inline">Taklif yuborish</span>
                      <span className="sm:hidden">Taklif</span>
                    </button>
                  </div>
                  <button
                    disabled={!input.trim()}
                    onClick={() => {
                      if (!input.trim()) return;
                      sendMessage(activeId, input.trim());
                      setInput("");
                    }}
                    className="touch-target inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.2)] transition-default hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
                  >
                    Yuborish <Send className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>

      <FileAttachModal
        open={fileOchish}
        onClose={() => setFileOchish(false)}
        onAttach={(file) => {
          attachFile(activeId, file);
          toast.success(`${file.name} biriktirildi`);
        }}
      />
      <SendOfferModal
        open={offerOchish}
        onClose={() => setOfferOchish(false)}
        onSend={(offer) => {
          sendOffer(activeId, offer);
          toast.success("Taklif yuborildi");
        }}
      />
      <EscrowActionModal
        open={escrowOchish}
        onClose={() => setEscrowOchish(false)}
        mode="fund"
        amount={escrowTotal || 6000}
        project={projectTitle}
        onConfirm={() => {
          fundEscrowMessage(activeId, escrowTotal || 6000, projectTitle);
          toast.success("Eskrou moliyalashtirildi");
        }}
      />
      {activeConversation && participant && (
        <CallModal
          open={callOpen}
          onClose={() => setCallOpen(false)}
          type={callType}
          participantName={participant.name}
          participantHue={participant.hue}
          conversationId={activeConversation.id}
        />
      )}
    </WorkspaceShell>
  );
}
