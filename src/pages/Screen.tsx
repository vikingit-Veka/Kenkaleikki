import { useEventState, useQuestions } from "../lib/hooks";

/**
 * Projector view. During live_questions it shows the big active question.
 * Realtime keeps it in sync with the master control. No results are shown.
 */
export default function Screen() {
  const state = useEventState(true);
  const questions = useQuestions();

  if (!state) return <div className="screen center muted">Ladataan…</div>;

  if (state.phase !== "live_questions") {
    return (
      <div className="screen center">
        <h1 className="message big">Kenkäleikki</h1>
      </div>
    );
  }

  const question = questions[state.current_question_index];

  return (
    <div className="screen center stage">
      <div className="counter muted">
        Kysymys {state.current_question_index + 1} / {questions.length}
      </div>
      <h1 className="question big">{question?.text ?? "—"}</h1>
    </div>
  );
}
