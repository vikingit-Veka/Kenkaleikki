import type { Answer } from "./types";

/**
 * The wedding couple — single source of truth for the names shown across the
 * guest, host and projector views. Bride = Essi (fuchsia / ❀),
 * groom = Samuli (green / ❦).
 */
export const COUPLE = {
  bride: "Essi",
  groom: "Samuli",
} as const;

/** Display name for a team / answer value (`null` → em dash). */
export function teamName(answer: Answer | null): string {
  if (answer === "bride") return COUPLE.bride;
  if (answer === "groom") return COUPLE.groom;
  return "—";
}
