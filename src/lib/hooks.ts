import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { CoupleAnswer, EventState, GuestVote, Question } from "./types";

/**
 * Current event_state row (there is always exactly one, id = 1).
 * When `realtime` is true, subscribes to Postgres changes; otherwise a one-shot fetch.
 */
export function useEventState(realtime: boolean): EventState | null {
  const [state, setState] = useState<EventState | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("event_state")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (active && data) setState(data as EventState);
      });

    if (!realtime) return () => {
      active = false;
    };

    const channel = supabase
      .channel("event_state_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_state" },
        (payload) => setState(payload.new as EventState),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [realtime]);

  return state;
}

/** Enabled questions ordered by order_index. Fetched once. */
export function useQuestions(): Question[] {
  const [questions, setQuestions] = useState<Question[]>([]);
  useEffect(() => {
    let active = true;
    supabase
      .from("questions")
      .select("*")
      .eq("enabled", true)
      .order("order_index")
      .then(({ data }) => {
        if (active && data) setQuestions(data as Question[]);
      });
    return () => {
      active = false;
    };
  }, []);
  return questions;
}

/** All couple answers, kept live over realtime. Requires an authenticated session. */
export function useCoupleAnswers(realtime: boolean): CoupleAnswer[] {
  const [rows, setRows] = useState<CoupleAnswer[]>([]);

  useEffect(() => {
    let active = true;
    const load = () =>
      supabase
        .from("couple_answers")
        .select("*")
        .then(({ data }) => {
          if (active && data) setRows(data as CoupleAnswer[]);
        });
    load();

    if (!realtime) return () => {
      active = false;
    };

    const channel = supabase
      .channel("couple_answers_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "couple_answers" },
        () => load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [realtime]);

  return rows;
}

/** All guest votes, kept live over realtime. Used for reveal aggregation. */
export function useGuestVotes(realtime: boolean): GuestVote[] {
  const [rows, setRows] = useState<GuestVote[]>([]);

  useEffect(() => {
    let active = true;
    const load = () =>
      supabase
        .from("guest_votes")
        .select("*")
        .then(({ data }) => {
          if (active && data) setRows(data as GuestVote[]);
        });
    load();

    if (!realtime) return () => {
      active = false;
    };

    const channel = supabase
      .channel("guest_votes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guest_votes" },
        () => load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [realtime]);

  return rows;
}

/** Supabase auth session. `undefined` while loading, `null` when signed out. */
export function useAuth(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}
