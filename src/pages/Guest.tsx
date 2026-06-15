import { useState } from "react";
import { supabase } from "../lib/supabase";
import { getSessionId } from "../lib/session";
import { useEventState, useQuestions } from "../lib/hooks";
import { COUPLE } from "../lib/couple";
import type { Answer } from "../lib/types";

/**
 * Guest view behind the QR code. Per the spec it does NOT use realtime — it
 * reads the phase once on load. Guests answer every question one at a time.
 */
export default function Guest() {
  const state = useEventState(false);
  const questions = useQuestions();

  if (!state) {
    return <div className="screen center muted">Ladataan…</div>;
  }

  switch (state.phase) {
    case "voting_open":
      return <Voting />;
    case "scheduled":
      return <Message text="Odotetaan äänestyksen alkua" />;
    case "voting_closed":
      return <Message text="Vastaaminen on päättynyt" />;
    case "live_questions":
      return <Message text="Live-osuus on käynnissä" />;
    case "reveal":
      return <Message text="Tuloksia käsitellään" />;
    case "closed":
      return <Message text="Tapahtuma on päättynyt" />;
    case "draft":
    default:
      return <Message text="Tapahtuma ei ole vielä alkanut" />;
  }

  function Voting() {
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<Answer | null>(null);
    const [saving, setSaving] = useState(false);

    if (questions.length === 0) {
      return <div className="screen center muted">Ladataan kysymyksiä…</div>;
    }

    if (index >= questions.length) {
      return <Message text="Kiitos osallistumisesta" />;
    }

    const question = questions[index];

    async function next() {
      if (!selected || saving) return;
      setSaving(true);
      // ON CONFLICT DO NOTHING via the (question_id, session_id) unique index.
      await supabase.from("guest_votes").upsert(
        {
          question_id: question.id,
          answer: selected,
          session_id: getSessionId(),
        },
        { onConflict: "question_id,session_id", ignoreDuplicates: true },
      );
      setSaving(false);
      setSelected(null);
      setIndex((i) => i + 1);
    }

    return (
      <div className="screen">
        <div className="progress muted">
          Kysymys {index + 1} / {questions.length}
        </div>
        <h1 className="question">{question.text}</h1>
        <div className="choices">
          <button
            className={`choice bride${selected === "bride" ? " selected" : ""}`}
            onClick={() => setSelected("bride")}
          >
            <span className="choice-label">
              <span className="choice-name">{COUPLE.bride}</span>
              <span className="choice-role">Morsian</span>
            </span>
          </button>
          <button
            className={`choice groom${selected === "groom" ? " selected" : ""}`}
            onClick={() => setSelected("groom")}
          >
            <span className="choice-label">
              <span className="choice-name">{COUPLE.groom}</span>
              <span className="choice-role">Sulhanen</span>
            </span>
          </button>
        </div>
        <button className="next" disabled={!selected || saving} onClick={next}>
          {saving ? "Tallennetaan…" : "Seuraava"}
        </button>
      </div>
    );
  }
}

function Message({ text }: { text: string }) {
  return (
    <div className="screen center">
      <h1 className="message">{text}</h1>
    </div>
  );
}
