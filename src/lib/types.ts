export type Phase =
  | "draft"
  | "scheduled"
  | "voting_open"
  | "voting_closed"
  | "live_questions"
  | "reveal"
  | "closed";

export type Answer = "bride" | "groom";

/**
 * Projector surface theme. `stage` = the dark plum stage (default);
 * `paper` = the light cream surface, for bright rooms where the dark stage
 * washes out. Toggled from the master control, applied on the screen view.
 */
export type ScreenTheme = "stage" | "paper";

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
  screen_theme: ScreenTheme;
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
