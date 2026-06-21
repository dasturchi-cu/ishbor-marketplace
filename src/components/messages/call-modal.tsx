import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Clock,
  MonitorUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Modal } from "@/components/site/modals";
import { GradientAvatar } from "@/components/site/avatar";
import { cn } from "@/lib/utils";
import {
  subscribeCallHistory,
  getCallsForConversation,
  saveCallRecord,
  formatCallDuration,
  type CallType,
} from "@/lib/call-store";
import { useAuth } from "@/hooks/use-auth";

type CallPhase = "calling" | "connected" | "ended";

const EMPTY_CALL_HISTORY: ReturnType<typeof getCallsForConversation> = [];

export function CallModal({
  open,
  onClose,
  type,
  participantName,
  participantHue,
  conversationId,
}: {
  open: boolean;
  onClose: () => void;
  type: CallType;
  participantName: string;
  participantHue: number;
  conversationId: string;
}) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<CallPhase>("calling");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(EMPTY_CALL_HISTORY);

  const refreshHistory = useCallback(() => {
    setHistory(getCallsForConversation(conversationId, user?.id).slice(0, 5));
  }, [conversationId, user?.id]);

  const historyCount = useSyncExternalStore(
    subscribeCallHistory,
    () => getCallsForConversation(conversationId, user?.id).length,
    () => 0,
  );

  useEffect(() => {
    if (!open) return;
    refreshHistory();
    const unsub = subscribeCallHistory(refreshHistory);
    return () => {
      unsub();
    };
  }, [open, refreshHistory]);

  useEffect(() => {
    if (!open) return;
    setPhase("calling");
    setElapsed(0);
    setMuted(false);
    setVideoOff(false);
    setScreenShare(false);
    setShowHistory(false);
    const connectTimer = setTimeout(() => setPhase("connected"), 1800);
    return () => clearTimeout(connectTimer);
  }, [open, type, conversationId]);

  useEffect(() => {
    if (phase !== "connected") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const endCall = (status: "completed" | "missed" | "declined" = "completed") => {
    if (!user) return;
    const duration = phase === "connected" ? Math.max(elapsed, 1) : 0;
    if (phase === "connected" || status !== "completed") {
      saveCallRecord({
        userId: user.id,
        conversationId,
        participantName,
        type,
        startedAt: new Date().toISOString(),
        durationSec: duration,
        status: phase === "calling" ? "missed" : status,
      });
    }
    setPhase("ended");
    refreshHistory();
    setTimeout(onClose, 400);
  };

  const title = type === "video" ? "Video qo'ng'iroq" : "Ovozli qo'ng'iroq";
  const statusLabel =
    phase === "calling"
      ? "Bog'lanilmoqda…"
      : phase === "connected"
        ? formatDuration(elapsed)
        : "Yakunlandi";

  const connectionIcon = phase === "connected" ? Wifi : phase === "calling" ? WifiOff : Clock;

  return (
    <Modal
      open={open}
      onClose={() => endCall(phase === "calling" ? "declined" : "completed")}
      title={title}
      description={
        phase === "calling"
          ? `${participantName} bilan bog'lanilmoqda…`
          : phase === "connected"
            ? `Ulanish faol · ${formatDuration(elapsed)}`
            : "Qo'ng'iroq yakunlandi"
      }
      footer={
        <div className="flex w-full flex-col gap-3">
          {(phase === "connected" || phase === "calling") && (
            <div
              className={cn(
                "call-controls-enter flex justify-center gap-3",
                phase === "calling" && "opacity-80",
              )}
            >
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                disabled={phase === "calling"}
                className={cn(
                  "call-control-btn touch-target inline-flex size-12 items-center justify-center rounded-full border border-border bg-card shadow-sm",
                  muted && "call-control-btn-active",
                )}
                aria-label={muted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish"}
              >
                {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
              {type === "video" && (
                <>
                  <button
                    type="button"
                    onClick={() => setVideoOff((v) => !v)}
                    disabled={phase === "calling"}
                    className={cn(
                      "call-control-btn touch-target inline-flex size-12 items-center justify-center rounded-full border border-border bg-card shadow-sm",
                      videoOff && "call-control-btn-active",
                    )}
                    aria-label={videoOff ? "Videoni yoqish" : "Videoni o'chirish"}
                  >
                    {videoOff ? <VideoOff className="size-4" /> : <Video className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreenShare((s) => !s)}
                    disabled={phase === "calling"}
                    className={cn(
                      "call-control-btn touch-target inline-flex size-12 items-center justify-center rounded-full border border-border bg-card shadow-sm",
                      screenShare && "bg-primary/10 text-primary",
                    )}
                    aria-label={screenShare ? "Ekran ulashishni to'xtatish" : "Ekranni ulashish"}
                  >
                    <MonitorUp className="size-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => endCall(phase === "calling" ? "declined" : "completed")}
                className="call-control-btn touch-target inline-flex size-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-[0_8px_24px_-8px_oklch(0.577_0.19_27/0.5)]"
                aria-label="Qo'ng'iroqni tugatish"
              >
                <PhoneOff className="size-4" />
              </button>
            </div>
          )}
          {historyCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((s) => !s)}
              className="premium-press text-xs font-medium text-primary hover:underline"
            >
              {showHistory ? "Tarixni yashirish" : `Qo'ng'iroqlar tarixi (${historyCount})`}
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2">
        {type === "video" && phase === "connected" && !videoOff ? (
          <div
            className="gpu-layer relative aspect-video w-full overflow-hidden rounded-2xl shadow-[0_16px_48px_-16px_oklch(0_0_0/0.35)]"
            style={{
              background: `linear-gradient(145deg, oklch(0.58 0.15 ${participantHue}) 0%, oklch(0.32 0.11 ${participantHue + 40}) 100%)`,
            }}
          >
            {screenShare && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="rounded-xl border border-white/20 bg-black/50 px-4 py-2 text-xs text-white">
                  Ekran ulashilmoqda
                </div>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <GradientAvatar name={participantName} hue={participantHue} size={72} rounded="rounded-2xl" />
            </div>
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">
              {phase === "connected" ? (
                <Wifi className="size-3 text-success" />
              ) : (
                <WifiOff className="size-3 text-warning" />
              )}
              {phase === "connected" ? "Yaxshi aloqa" : "Ulanmoqda"}
            </div>
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
              {participantName}
            </div>
            <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 font-mono text-xs text-white backdrop-blur-sm">
              {formatDuration(elapsed)}
            </div>
            <div className="absolute bottom-3 right-24 size-20 overflow-hidden rounded-xl border-2 border-white/30 shadow-lg">
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, oklch(0.62 0.12 ${participantHue + 20}) 0%, oklch(0.45 0.1 ${participantHue}) 100%)`,
                }}
              >
                <span className="text-[10px] font-medium text-white/90">Siz</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative gpu-layer">
            <GradientAvatar name={participantName} hue={participantHue} size={88} rounded="rounded-2xl" />
            {phase === "calling" && (
              <>
                <span className="call-ring-pulse absolute -inset-3 rounded-2xl border-2 border-primary/30" />
                <span
                  className="call-ring-pulse absolute -inset-3 rounded-2xl border-2 border-primary/20"
                  style={{ animationDelay: "0.6s" }}
                />
              </>
            )}
          </div>
        )}

        <div className="text-center">
          <div className="font-display text-lg font-semibold">{participantName}</div>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            {type === "video" ? <Video className="size-3.5" /> : <Phone className="size-3.5" />}
            <span>{statusLabel}</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            {(() => {
              const Icon = connectionIcon;
              return <Icon className={cn("size-3", phase === "connected" && "text-success")} />;
            })()}
            {phase === "calling" && "Ulanish o'rnatilmoqda"}
            {phase === "connected" && "Shifrlangan qo'ng'iroq"}
            {phase === "ended" && "Qo'ng'iroq tugadi"}
          </div>
        </div>

        {showHistory && history.length > 0 && (
          <ul className="premium-dropdown w-full space-y-2 rounded-xl border border-border bg-surface/50 p-3">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 text-xs premium-list-row hover:bg-secondary/30 rounded-lg px-2 py-1.5">
                <span className="flex items-center gap-1.5">
                  {h.type === "video" ? <Video className="size-3" /> : <Phone className="size-3" />}
                  {new Date(h.startedAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3" />
                  {h.durationSec > 0 ? formatCallDuration(h.durationSec) : h.status === "missed" ? "Javobsiz" : "Bekor"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
