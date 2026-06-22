import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import Today from "./views/Today";
import Inbox from "./views/Inbox";
import Commitments from "./views/Commitments";
import Schedule from "./views/Schedule";
import Search from "./views/Search";
import { processBacklog, processCapture } from "./lib/processor";
import { backfillEmbeddings } from "./lib/embeddings";
import { generateBrief } from "./lib/brief";
import "./App.css";

const NAV = [
  { to: "/",            icon: "☀️",  label: "Today" },
  { to: "/inbox",       icon: "📥", label: "Inbox" },
  { to: "/commitments", icon: "✓",  label: "Commitments" },
  { to: "/schedule",    icon: "📅", label: "Schedule" },
  { to: "/search",      icon: "🔍", label: "Search" },
];

export default function App() {
  // null = still deciding; true = headless overnight run (no UI); false = normal.
  const [headless, setHeadless] = useState<boolean | null>(null);

  // The main window is always alive, so it owns background processing: clear
  // any backlog on launch, then process each new capture as it's saved. This
  // runs regardless of which view is open.
  useEffect(() => {
    let unlisten: Promise<() => void> | null = null;
    void (async () => {
      // Unattended overnight run (Task Scheduler → `--run-brief`): generate the
      // brief and quit. Render nothing — no UI, no backlog, no per-view effects.
      if (await invoke<boolean>("is_brief_run")) {
        setHeadless(true);
        try {
          await generateBrief();
        } catch (err) {
          console.error("scheduled brief failed", err);
        }
        await invoke("quit_app");
        return;
      }
      setHeadless(false);

      // Normal launch: clear the processing backlog, then embed any captures
      // from before Phase 4 existed (new captures get embedded inline).
      void processBacklog().then(() => backfillEmbeddings());
      // Make sure the morning brief is scheduled, pointed at this exe (idempotent).
      void invoke("register_daily_brief").catch((err) =>
        console.error("brief schedule registration failed", err),
      );
      unlisten = listen<string>("capture:saved", (e) => {
        void processCapture(e.payload);
      });
    })();
    return () => {
      void unlisten?.then((f) => f());
    };
  }, []);

  // Don't mount the UI (and its per-view effects) until we know this isn't a
  // headless brief run — otherwise Today would kick off a second generation.
  if (headless !== false) return null;

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
          <span className="build-tag">Step 6 — daily surface</span>
        </div>
      </nav>

      {/* ── Main content ────────────────────────────── */}
      <main className="content-area">
        <Routes>
          <Route path="/"            element={<Today />} />
          <Route path="/inbox"       element={<Inbox />} />
          <Route path="/commitments" element={<Commitments />} />
          <Route path="/schedule"    element={<Schedule />} />
          <Route path="/search"      element={<Search />} />
        </Routes>
      </main>
    </div>
  );
}
