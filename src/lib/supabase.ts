import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Surfaced loudly during development so a missing .env is obvious.
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.",
  );
}

// Fall back to a harmless placeholder URL so a missing .env shows the UI with
// failing network calls instead of a blank screen (createClient throws on "").
export const supabase = createClient(
  url || "http://localhost:54321",
  anonKey || "public-anon-key",
);
