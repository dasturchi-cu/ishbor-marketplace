import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { submitReview, type ReviewInput } from "@/lib/reviews-store";
import { measureReviewImpact } from "@/lib/ecosystem-progress";

type Props = {
  orderId: string;
  project: string;
  direction: ReviewInput["direction"];
  from: string;
  fromHue: number;
  fromUsername?: string;
  freelancerUsername?: string;
  toCompany?: string;
  onSubmitted?: () => void;
};

export function ReviewForm({
  orderId,
  project,
  direction,
  from,
  fromHue,
  fromUsername,
  freelancerUsername,
  toCompany,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Iltimos, sharh matnini yozing");
      return;
    }
    setLoading(true);
    const result = submitReview({
      orderId,
      project,
      direction,
      from,
      fromHue,
      fromUsername,
      freelancerUsername,
      toCompany,
      rating,
      body: body.trim(),
    });
    if ("error" in result) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    if (direction === "client_to_freelancer" && freelancerUsername) {
      const impact = measureReviewImpact(freelancerUsername, rating);
      toast.success("Sharh yuborildi — rahmat!", {
        description: `Reyting ta'siri: muvaffaqiyat ~${impact.newSuccessScore}, qidiruv ~${impact.newRankingScore} (+${impact.rankingDelta}).`,
      });
    } else {
      toast.success("Sharh yuborildi — rahmat!");
    }
    onSubmitted?.();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="font-display font-semibold">Sharh qoldirish</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="touch-target p-1"
            aria-label={`${n} yulduz`}
          >
            <Star className={`size-6 ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Bu loyihada ishlash tajribangizni baham ko'ring..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        Sharhni yuborish
      </button>
    </form>
  );
}
