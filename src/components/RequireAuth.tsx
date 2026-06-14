import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/hooks";

/** Gates host-only routes behind a Supabase auth session. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const session = useAuth();

  if (session === undefined) {
    return <div className="screen center muted">Ladataan…</div>;
  }
  if (session === null) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
