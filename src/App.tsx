import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import Guest from "./pages/Guest";
import Screen from "./pages/Screen";
import Reveal from "./pages/Reveal";
import Login from "./pages/Login";
import ControlMaster from "./pages/ControlMaster";
import ControlCouple from "./pages/ControlCouple";

// HashRouter is used so GitHub Pages (no SPA fallback) serves every route
// from the single index.html without 404s.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/guest" replace />} />
        <Route path="/guest" element={<Guest />} />
        <Route path="/screen" element={<Screen />} />
        <Route path="/reveal" element={<Reveal />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/control/master"
          element={
            <RequireAuth>
              <ControlMaster />
            </RequireAuth>
          }
        />
        <Route
          path="/control/bride"
          element={
            <RequireAuth>
              <ControlCouple role="bride" />
            </RequireAuth>
          }
        />
        <Route
          path="/control/groom"
          element={
            <RequireAuth>
              <ControlCouple role="groom" />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/guest" replace />} />
      </Routes>
    </HashRouter>
  );
}
