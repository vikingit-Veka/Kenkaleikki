export type Phase =
  | "draft"
  | "scheduled"
  | "voting_open"
  | "voting_closed"
  | "live_questions"
  | "reveal"
  | "closed";

export type Answer = "bride" | "groom";

export interface Question {
  id: string;
  order_index: number;
  text: string;
  enabled: boolean;
}

export interface EventState {
  id: number;
  phase: Phase;
  current_question_index: number;
  reveal_started_at: string | null;
  voting_opens_at: string | null;
  voting_closes_at: string | null;
}

export interface CoupleAnswer {
  question_id: string;
  bride_answer: Answer | null;
  groom_answer: Answer | null;
  answered_at: string | null;
}

export interface GuestVote {
  id: string;
  question_id: string;
  answer: Answer;
  session_id: string;
  created_at: string;
}
