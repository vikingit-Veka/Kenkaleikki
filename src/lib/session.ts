const STORAGE_KEY = "kenkaleikki_session_id";

/**
 * Stable anonymous identifier for a guest, persisted in localStorage.
 * Used as guest_votes.session_id so a guest can vote once per question.
 */
export function getSessionId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
