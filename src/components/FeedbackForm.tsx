import { useState } from "react";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  FeedbackInput,
  FeedbackTarget,
  useSubmitFeedback,
} from "@/hooks/useFeedback";

interface Props {
  target: FeedbackTarget;
  processInstanceId?: string;
  sectorId?: string;
  announcementId?: string;
  /** Mostra/oculta cada critério. Default: true para todos. */
  showClarity?: boolean;
  showAlignment?: boolean;
  showSatisfaction?: boolean;
  onSubmitted?: () => void;
}

const labels = {
  clarity: "Clareza da comunicação",
  alignment: "Alinhamento entre setores",
  satisfaction: "Satisfação geral",
};

function StarInput({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} de 5`}
            className={cn(
              "rounded-md p-1 transition-smooth hover:scale-110",
              value !== null && n <= value
                ? "text-amber-500"
                : "text-muted-foreground/40 hover:text-amber-400",
            )}
          >
            <Star className={cn("h-5 w-5", value !== null && n <= value && "fill-current")} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function FeedbackForm({
  target,
  processInstanceId,
  sectorId,
  announcementId,
  showClarity = true,
  showAlignment = true,
  showSatisfaction = true,
  onSubmitted,
}: Props) {
  const [clarity, setClarity] = useState<number | null>(null);
  const [alignment, setAlignment] = useState<number | null>(null);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const submit = useSubmitFeedback();

  const hasAnyScore = clarity !== null || alignment !== null || satisfaction !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyScore) return;

    const referencePeriod =
      target === "sector"
        ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
        : null;

    const input: FeedbackInput = {
      target_kind: target,
      process_instance_id: target === "process" ? processInstanceId ?? null : null,
      sector_id: target === "sector" ? sectorId ?? null : null,
      announcement_id: target === "announcement" ? announcementId ?? null : null,
      reference_period: referencePeriod,
      clarity_score: showClarity ? clarity : null,
      alignment_score: showAlignment ? alignment : null,
      satisfaction_score: showSatisfaction ? satisfaction : null,
      comment: comment.trim() || null,
    };

    submit.mutate(input, {
      onSuccess: () => {
        setClarity(null);
        setAlignment(null);
        setSatisfaction(null);
        setComment("");
        onSubmitted?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {showClarity && <StarInput value={clarity} onChange={setClarity} label={labels.clarity} />}
        {showAlignment && (
          <StarInput value={alignment} onChange={setAlignment} label={labels.alignment} />
        )}
        {showSatisfaction && (
          <StarInput value={satisfaction} onChange={setSatisfaction} label={labels.satisfaction} />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fb-comment" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Comentário (opcional, máx. 1000 caracteres)
        </Label>
        <Textarea
          id="fb-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 1000))}
          placeholder="Compartilhe pontos de atenção, sugestões ou elogios…"
          rows={3}
        />
        <p className="text-right text-[11px] text-muted-foreground">{comment.length}/1000</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          A análise de sentimento é gerada automaticamente após o envio.
        </p>
        <Button type="submit" size="sm" disabled={!hasAnyScore || submit.isPending}>
          <Send className="h-4 w-4" />
          {submit.isPending ? "Enviando…" : "Enviar feedback"}
        </Button>
      </div>
    </form>
  );
}
