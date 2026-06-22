// Schedule.tsx — a month calendar of what's due, plus date-pickers to schedule
// anything that came in without a date. Tasks and commitment deadlines are
// often extracted dateless; the calendar shows the dated ones at a glance and
// the lists below let you assign/change dates. Custom add-on beyond the plan.
import { useCallback, useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
} from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { CAPTURES_CHANGED } from "../lib/processor";
import { listOpenTasks, setTaskDueDate, setTaskStatus, type TaskRow } from "../lib/tasks";
import { listCommitments, setCommitmentDeadline, type Commitment } from "../lib/commitments";

// A YYYY-MM-DD usable by <input type="date">, or "" if the stored value is
// free text ("next Friday") or absent.
function isoOrEmpty(v: string | null): string {
  if (!v) return "";
  const head = v.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(head) ? head : "";
}

function timeAgo(ts: string): string {
  const d = new Date(ts.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return ts;
  return formatDistanceToNow(d, { addSuffix: true });
}

interface DayItem {
  id: string;
  label: string;
  kind: "task" | "commitment";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Schedule() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([listOpenTasks(), listCommitments()]);
    setTasks(t);
    setCommitments(c.filter((x) => x.status === "open"));
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    const unlisten = listen(CAPTURES_CHANGED, () => void load());
    return () => void unlisten.then((f) => f());
  }, [load]);

  const undatedTasks = tasks.filter((t) => !t.due_date);
  const datedTasks = tasks.filter((t) => !!t.due_date);
  const undatedCommitments = commitments.filter((c) => !c.implied_deadline);

  // Map ISO day → items due that day, for the calendar grid.
  const itemsByDay = useMemo(() => {
    const m = new Map<string, DayItem[]>();
    const add = (iso: string, item: DayItem) => {
      const arr = m.get(iso) ?? [];
      arr.push(item);
      m.set(iso, arr);
    };
    for (const t of tasks) {
      const iso = isoOrEmpty(t.due_date);
      if (iso) add(iso, { id: t.id, label: t.title, kind: "task" });
    }
    for (const c of commitments) {
      const iso = isoOrEmpty(c.implied_deadline);
      if (iso) add(iso, { id: c.id, label: c.description, kind: "commitment" });
    }
    return m;
  }, [tasks, commitments]);

  async function onTaskDate(id: string, v: string) {
    await setTaskDueDate(id, v || null);
    await load();
  }
  async function onTaskDone(id: string) {
    await setTaskStatus(id, "done");
    await load();
  }
  async function onCommitmentDate(id: string, v: string) {
    await setCommitmentDeadline(id, v || null);
    await load();
  }

  const needCount = undatedTasks.length + undatedCommitments.length;

  return (
    <div className="schedule">
      <header className="sched-header">
        <h1>Schedule</h1>
        <span className="sched-sub">
          {loaded
            ? needCount === 0
              ? "everything has a date ✨"
              : `${needCount} item${needCount === 1 ? "" : "s"} need a date`
            : "loading…"}
        </span>
      </header>

      <CalendarMonth itemsByDay={itemsByDay} />

      {undatedTasks.length > 0 && (
        <section className="sched-section">
          <h2 className="sched-section-title sched-section-title--attention">Tasks needing a date</h2>
          <ul className="sched-list">
            {undatedTasks.map((t) => (
              <TaskItem key={t.id} t={t} onDate={onTaskDate} onDone={onTaskDone} />
            ))}
          </ul>
        </section>
      )}

      {undatedCommitments.length > 0 && (
        <section className="sched-section">
          <h2 className="sched-section-title sched-section-title--attention">Commitments needing a deadline</h2>
          <ul className="sched-list">
            {undatedCommitments.map((c) => (
              <li key={c.id} className="sched-item">
                <div className="sched-item-main">
                  <span className="sched-title">{c.description}</span>
                  <span className="sched-meta">
                    {c.person_name ? `to ${c.person_name} · ` : ""}open {timeAgo(c.created_at)}
                  </span>
                </div>
                <input
                  type="date"
                  className="sched-date"
                  value=""
                  onChange={(e) => void onCommitmentDate(c.id, e.target.value)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {datedTasks.length > 0 && (
        <section className="sched-section">
          <h2 className="sched-section-title">Scheduled tasks</h2>
          <ul className="sched-list">
            {datedTasks.map((t) => (
              <TaskItem key={t.id} t={t} onDate={onTaskDate} onDone={onTaskDone} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ── Month calendar grid ─────────────────────────────────────────────────────
function CalendarMonth({ itemsByDay }: { itemsByDay: Map<string, DayItem[]> }) {
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));

  const monthStart = startOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(cursor) });
  const leadBlanks = getDay(monthStart); // 0 = Sunday

  return (
    <section className="cal">
      <div className="cal-head">
        <span className="cal-title">{format(cursor, "MMMM yyyy")}</span>
        <div className="cal-nav">
          <button className="btn btn--tiny" onClick={() => setCursor(addMonths(cursor, -1))}>
            ‹
          </button>
          <button className="btn btn--tiny" onClick={() => setCursor(startOfMonth(new Date()))}>
            Today
          </button>
          <button className="btn btn--tiny" onClick={() => setCursor(addMonths(cursor, 1))}>
            ›
          </button>
        </div>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
        {Array.from({ length: leadBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className="cal-blank" />
        ))}
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const items = itemsByDay.get(iso) ?? [];
          const shown = items.slice(0, 3);
          const extra = items.length - shown.length;
          return (
            <div key={iso} className={"cal-day" + (isToday(day) ? " cal-day--today" : "")}>
              <span className="cal-daynum">{format(day, "d")}</span>
              {shown.map((it) => (
                <span
                  key={it.id}
                  className={`cal-chip cal-chip--${it.kind}`}
                  title={it.label}
                >
                  {it.label}
                </span>
              ))}
              {extra > 0 && <span className="cal-more">+{extra} more</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TaskItem({
  t,
  onDate,
  onDone,
}: {
  t: TaskRow;
  onDate: (id: string, v: string) => void | Promise<void>;
  onDone: (id: string) => void | Promise<void>;
}) {
  const iso = isoOrEmpty(t.due_date);
  // Free-text date Gemini couldn't normalize (e.g. "next Friday") — show it so
  // the user knows what to replace with a real date.
  const rawHint = t.due_date && !iso ? t.due_date : null;
  return (
    <li className="sched-item">
      <div className="sched-item-main">
        <span className="sched-title">{t.title}</span>
        <span className="sched-meta">
          {t.project_name ? `${t.project_name} · ` : ""}
          {rawHint ? `said "${rawHint}" · ` : ""}
          {t.inferred_due && iso ? "inferred" : null}
        </span>
      </div>
      <input
        type="date"
        className="sched-date"
        value={iso}
        onChange={(e) => void onDate(t.id, e.target.value)}
      />
      <button className="btn btn--ghost btn--tiny" onClick={() => void onDone(t.id)}>
        Done
      </button>
    </li>
  );
}
