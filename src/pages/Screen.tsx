import { useEventState, useQuestions } from "../lib/hooks";
import { COUPLE } from "../lib/couple";
import Reveal from "./Reveal";

/**
 * Single projector view for the whole event. Realtime keeps it in sync with the
 * master control:
 *   - live_questions → big active question (no answers shown)
 *   - reveal         → the auto-cycling reveal of answers + audience results
 *   - otherwise      → a neutral title card
 */
export default function Screen() {
  const state = useEventState(true);
  const questions = useQuestions();

  if (!state) return <div className="screen center muted">Ladataan…</div>;

  if (state.phase === "reveal") {
    return <Reveal />;
  }

  const stageClass = `screen center stage${
    state.screen_theme === "paper" ? " light" : ""
  }`;

  if (state.phase !== "live_questions") {
    return (
      <div className={stageClass}>
        <p className="stage-couple">
          {COUPLE.bride} &amp; {COUPLE.groom}
        </p>
        <div className="kl-ornament">
          <span className="kl-ornament__mark">◆</span>
        </div>
        <h1 className="message big">Kenkäleikki</h1>
        <span className="kl-eyebrow stage-eyebrow">Hääjuhla</span>
      </div>
    );
  }

  const question = questions[state.current_question_index];

  return (
    <div className={stageClass}>
      <div className="counter muted">
        Kysymys {state.current_question_index + 1} / {questions.length}
      </div>
      <h1 className="question big">{question?.text ?? "—"}</h1>
    </div>
  );
}
