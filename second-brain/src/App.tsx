import { useEffect } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import Today from "./views/Today";
import Inbox from "./views/Inbox";
import Commitments from "./views/Commitments";
import Search from "./views/Search";
import { processBacklog, processCapture } from "./lib/processor";
import { backfillEmbeddings } from "./lib/embeddings";
import "./App.css";

const NAV = [
  { to: "/",            icon: "☀️",  label: "Today" },
  { to: "/inbox",       icon: "📥", label: "Inbox" },
  { to: "/commitments", icon: "✓",  label: "Commitments" },
  { to: "/search",      icon: "🔍", label: "Search" },
];

export default function App() {
  // The main window is always alive, so it owns background processing: clear
  // any backlog on launch, then process each new capture as it's saved. This
  // runs regardless of which view is open.
  useEffect(() => {
    // Clear the processing backlog, then embed any captures from before Phase 4
    // existed (new captures get embedded inline by the processor).
    void processBacklog().then(() => backfillEmbeddings());
    const unlisten = listen<string>("capture:saved", (e) => {
      void processCapture(e.payload);
    });
    return () => {
      void unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────────── */}
      <nav className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <span className="brand-icon">🧠</span>
          <span className="brand-name">Second Brain</span>
        </div>
        <ul className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  "nav-item" + (isActive ? " nav-item--active" : "")
                }
              >
                <span className="nav-icon" aria-hidden="true">{icon}</span>
                <span className="nav-label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <span className="build-tag">Step 5 — loop-closer</span>
        </div>
      </nav>

      {/* ── Main content ────────────────────────────── */}
      <main className="content-area">
        <Routes>
          <Route path="/"            element={<Today />} />
          <Route path="/inbox"       element={<Inbox />} />
          <Route path="/commitments" element={<Commitments />} />
          <Route path="/search"      element={<Search />} />
        </Routes>
      </main>
    </div>
  );
}
