import { NavLink, Route, Routes } from "react-router-dom";
import Today from "./views/Today";
import Inbox from "./views/Inbox";
import Commitments from "./views/Commitments";
import Search from "./views/Search";
import "./App.css";

const NAV = [
  { to: "/",            icon: "☀️",  label: "Today" },
  { to: "/inbox",       icon: "📥", label: "Inbox" },
  { to: "/commitments", icon: "✓",  label: "Commitments" },
  { to: "/search",      icon: "🔍", label: "Search" },
];

export default function App() {
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
          <span className="build-tag">Step 2 — capture bar</span>
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
