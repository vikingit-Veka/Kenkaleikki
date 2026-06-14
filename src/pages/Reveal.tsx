import { useEffect, useState } from "react";
import {
  useCoupleAnswers,
  useGuestVotes,
  useQuestions,
} from "../lib/hooks";
import type { Answer } from "../lib/types";

const STEP_MS = 5000;
const FADE_MS = 900;

/**
 * Reveal view. Cycles through questions automatically every 5 s with a fade
 * transition, showing bride answer, groom answer and audience percentages.
 * Authenticated only (couple_answers is host-readable).
 */
export default function Reveal() {
  const questions = useQuestions();
  const answers = useCoupleAnswers(true);
  const votes = useGuestVotes(true);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (questions.length === 0) return;
    const id = setInterval(() => {
      // Fade out, advance, fade back in.
      setVisible(false);
      const t = setTimeout(() => {
        setIndex((i) => (i + 1) % questions.length);
        setVisible(true);
      }, FADE_MS);
      return () => clearTimeout(t);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [questions.length]);

  if (questions.length === 0) {
    return <div className="screen center muted">Ladataan…</div>;
  }

  const question = questions[index];
  const answer = answers.find((a) => a.question_id === question.id);
  const qVotes = votes.filter((v) => v.question_id === question.id);
  const total = qVotes.length;
  const bridePct = total
    ? Math.round((qVotes.filter((v) => v.answer === "bride").length / total) * 100)
    : 0;
  const groomPct = total ? 100 - bridePct : 0;

  return (
    <div className="screen center stage">
      <div
        className="reveal-card"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      >
        <h1 className="question big">{question.text}</h1>

        <div className="reveal-rows">
          <RevealRow label="Morsian vastasi" value={answer?.bride_answer ?? null} />
          <RevealRow label="Sulhanen vastasi" value={answer?.groom_answer ?? null} />
        </div>

        <div className="audience">
          <div className="muted">Yleisö</div>
          <Bar label="Morsian" pct={bridePct} />
          <Bar label="Sulhanen" pct={groomPct} />
        </div>
      </div>
    </div>
  );
}

function answerLabel(value: Answer | null): string {
  if (value === "bride") return "Morsian";
  if (value === "groom") return "Sulhanen";
  return "—";
}

function RevealRow({ label, value }: { label: string; value: Answer | null }) {
  return (
    <div className="reveal-row">
      <span className="muted">{label}:</span>
      <span className="reveal-value">{answerLabel(value)}</span>
    </div>
  );
}

function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className="bar-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="bar-pct">{pct} %</span>
    </div>
  );
}
