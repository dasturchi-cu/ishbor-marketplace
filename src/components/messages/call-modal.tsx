import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Clock } from "lucide-react";
import { Modal } from "@/components/site/modals";
import { GradientAvatar } from "@/components/site/avatar";
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
  const Icon = type === "video" ? Video : Phone;

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
        <div className="flex w-full flex-col gap-2">
          {phase === "connected" && (
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="touch-target inline-flex size-11 items-center justify-center rounded-full border border-border bg-card"
                aria-label={muted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish"}
              >
                {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
              {type === "video" && (
                <button
                  type="button"
                  onClick={() => setVideoOff((v) => !v)}
                  className="touch-target inline-flex size-11 items-center justify-center rounded-full border border-border bg-card"
                  aria-label={videoOff ? "Videoni yoqish" : "Videoni o'chirish"}
                >
                  {videoOff ? <VideoOff className="size-4" /> : <Video className="size-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => endCall("completed")}
                className="touch-target inline-flex size-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                aria-label="Qo'ng'iroqni tugatish"
              >
                <PhoneOff className="size-4" />
              </button>
            </div>
          )}
          {phase === "calling" && (
            <button
              type="button"
              onClick={() => endCall("declined")}
              className="touch-target w-full rounded-lg border border-destructive/30 bg-destructive/10 py-2.5 text-sm font-medium text-destructive"
            >
              Bekor qilish
            </button>
          )}
          {historyCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((s) => !s)}
              className="text-xs font-medium text-primary hover:underline"
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
            className="relative aspect-video w-full overflow-hidden rounded-xl"
            style={{
              background: `linear-gradient(145deg, oklch(0.58 0.15 ${participantHue}) 0%, oklch(0.32 0.11 ${participantHue + 40}) 100%)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <GradientAvatar name={participantName} hue={participantHue} size={72} rounded="rounded-2xl" />
            </div>
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
              {participantName}
            </div>
            <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 font-mono text-xs text-white">
              {formatDuration(elapsed)}
            </div>
          </div>
        ) : (
          <div className="relative">
            <GradientAvatar name={participantName} hue={participantHue} size={80} rounded="rounded-2xl" />
            {phase === "calling" && (
              <span className="absolute -inset-2 animate-ping rounded-2xl border-2 border-primary/40" />
            )}
          </div>
        )}

        <div className="text-center">
          <div className="font-display text-lg font-semibold">{participantName}</div>
          <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Icon className="size-3.5" />
            {phase === "calling" && "Qo'ng'iroq qilinmoqda…"}
            {phase === "connected" && "Ulandi"}
            {phase === "ended" && "Yakunlandi"}
          </div>
        </div>

        {showHistory && history.length > 0 && (
          <ul className="w-full space-y-2 rounded-xl border border-border bg-surface/50 p-3">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 text-xs">
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
