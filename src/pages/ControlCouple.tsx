import { supabase } from "../lib/supabase";
import { useCoupleAnswers, useEventState, useQuestions } from "../lib/hooks";
import type { Answer } from "../lib/types";

/**
 * Bride/groom host view. Shows the master's active question and lets the host
 * record their partner's-guess answer into couple_answers. The `role` prop
 * decides which column (bride_answer / groom_answer) is written.
 */
export default function ControlCouple({ role }: { role: "bride" | "groom" }) {
  const state = useEventState(true);
  const questions = useQuestions();
  const answers = useCoupleAnswers(true);

  if (!state) return <div className="screen center muted">Ladataan…</div>;

  const question = questions[state.current_question_index];
  const title = role === "bride" ? "Morsian" : "Sulhanen";
  const column = role === "bride" ? "bride_answer" : "groom_answer";
  const saved = question
    ? answers.find((a) => a.question_id === question.id)?.[column]
    : null;

  async function save(answer: Answer) {
    if (!question) return;
    await supabase
      .from("couple_answers")
      .update({ [column]: answer, answered_at: new Date().toISOString() })
      .eq("question_id", question.id);
  }

  const live = state.phase === "live_questions";

  return (
    <div className="screen control">
      <h1>{title}</h1>
      {!live && (
        <p className="muted">
          Vastaaminen on mahdollista vasta live-osuuden aikana.
        </p>
      )}
      <div className="progress muted">
        Kysymys {state.current_question_index + 1} / {questions.length}
      </div>
      <h2 className="question">{question?.text ?? "—"}</h2>
      <div className="choices">
        <button
          className={saved === "bride" ? "choice selected" : "choice"}
          disabled={!live}
          onClick={() => save("bride")}
        >
          Morsian
        </button>
        <button
          className={saved === "groom" ? "choice selected" : "choice"}
          disabled={!live}
          onClick={() => save("groom")}
        >
          Sulhanen
        </button>
      </div>
      {saved && (
        <p className="muted">
          Tallennettu: {saved === "bride" ? "Morsian" : "Sulhanen"}
        </p>
      )}
    </div>
  );
}
