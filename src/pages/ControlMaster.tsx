import { supabase } from "../lib/supabase";
import { useEventState, useQuestions } from "../lib/hooks";
import type { Phase } from "../lib/types";

const PHASE_LABELS: Record<Phase, string> = {
  draft: "Luonnos",
  scheduled: "Ajastettu",
  voting_open: "Äänestys auki",
  voting_closed: "Äänestys suljettu",
  live_questions: "Live-osuus",
  reveal: "Reveal",
  closed: "Päättynyt",
};

export default function ControlMaster() {
  const state = useEventState(true);
  const questions = useQuestions();

  if (!state) return <div className="screen center muted">Ladataan…</div>;

  async function setPhase(phase: Phase, extra: Record<string, unknown> = {}) {
    await supabase
      .from("event_state")
      .update({ phase, ...extra })
      .eq("id", 1);
  }

  async function moveQuestion(delta: number) {
    if (!state) return;
    const next = Math.min(
      Math.max(state.current_question_index + delta, 0),
      Math.max(questions.length - 1, 0),
    );
    await supabase
      .from("event_state")
      .update({ current_question_index: next })
      .eq("id", 1);
  }

  async function resetEvent() {
    const ok = window.confirm(
      "Nollataanko tilanne? Tämä POISTAA kaikki vieras­äänet ja parin vastaukset " +
        "ja palauttaa vieraat odotusnäkymään. Toimintoa ei voi perua.",
    );
    if (!ok) return;
    const { error } = await supabase.rpc("reset_event");
    if (error) window.alert("Nollaus epäonnistui: " + error.message);
  }

  const current = questions[state.current_question_index];

  return (
    <div className="screen control">
      <h1>Master-ohjaus</h1>
      <div className="status">
        <div>
          Vaihe: <strong>{PHASE_LABELS[state.phase]}</strong>
        </div>
        <div>
          Kysymys: <strong>{state.current_question_index + 1}</strong> /{" "}
          {questions.length}
        </div>
        <div className="muted current-q">{current?.text ?? "—"}</div>
      </div>

      <div className="button-grid">
        <button onClick={() => setPhase("voting_open")}>Avaa äänestys</button>
        <button
          onClick={() => setPhase("live_questions", { current_question_index: 0 })}
        >
          Aloita live-osuus
        </button>
        <button onClick={() => moveQuestion(-1)}>Edellinen kysymys</button>
        <button onClick={() => moveQuestion(1)}>Seuraava kysymys</button>
        <button
          className="full-width"
          onClick={() =>
            setPhase("reveal", {
              reveal_started_at: new Date().toISOString(),
              current_question_index: 0,
            })
          }
        >
          Aloita reveal
        </button>
        <button className="warning" onClick={resetEvent}>
          Nollaa tilanne
        </button>
        <button className="danger" onClick={() => setPhase("closed")}>
          Sulje tapahtuma
        </button>
      </div>
    </div>
  );
}
