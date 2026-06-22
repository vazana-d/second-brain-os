/**
 * brief.ts — the Daily Surface generator (BUILD_PLAN Phase 6).
 *
 * Gathers open commitments, open/overdue tasks, and recent captures, asks
 * Gemini Flash for a single "one thing" + the open loops, and stores the result
 * as an `insights` row. Tone is diagnostic and gentle by design (§11): never a
 * guilt list or a bare scoreboard. Runs two ways — the in-app "Run now" button,
 * and the unattended `--run-brief` launch fired by Windows Task Scheduler.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { emit } from "@tauri-apps/api/event";
import { formatDistanceToNow } from "date-fns";
import { getDb } from "./db";
import { GEMINI_MODEL, getApiKey, withRateLimitRetry } from "./ai";

/** Emitted after a new brief is written, so the Today view refreshes. */
export const BRIEF_CHANGED = "brief:changed";

export interface DailyBrief {
  one_thing: string;
  reasoning: string;
  open_loops: string[];
  note: string;
  generated_at: string;
}

interface BriefInput {
  commitments: { description: string; person: string | null; age: string }[];
  tasks: { title: string; due_date: string | null }[];
  captures: string[];
}

function timeAgo(ts: string): string {
  const d = new Date(ts.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return ts;
  return formatDistanceToNow(d, { addSuffix: true });
}

async function gatherBriefData(): Promise<BriefInput> {
  const db = await getDb();
  const commitments = await db.select<
    { description: string; person: string | null; created_at: string }[]
  >(
    `SELECT c.description, p.name AS person, c.created_at
     FROM commitments c LEFT JOIN people p ON p.id = c.person_id
     WHERE c.status = 'open' ORDER BY c.created_at ASC LIMIT 30`,
  );
  const tasks = await db.select<{ title: string; due_date: string | null }[]>(
    `SELECT title, due_date FROM tasks WHERE status = 'todo'
     ORDER BY (due_date IS NULL), due_date ASC LIMIT 30`,
  );
  const captures = await db.select<{ raw_content: string }[]>(
    "SELECT raw_content FROM captures ORDER BY created_at DESC LIMIT 12",
  );
  return {
    commitments: commitments.map((c) => ({
      description: c.description,
      person: c.person,
      age: timeAgo(c.created_at),
    })),
    tasks,
    captures: captures.map((c) => c.raw_content),
  };
}

function buildBriefPrompt(input: BriefInput): string {
  const loops = input.commitments.length
    ? input.commitments
        .map((c) => `- ${c.description}${c.person ? ` (to ${c.person})` : ""} — open ${c.age}`)
        .join("\n")
    : "(none)";
  const tasks = input.tasks.length
    ? input.tasks.map((t) => `- ${t.title}${t.due_date ? ` (due ${t.due_date})` : ""}`).join("\n")
    : "(none)";
  const captures = input.captures.length ? input.captures.map((c) => `- ${c}`).join("\n") : "(none)";

  return `You are the morning brief generator for a personal "second brain".
Tone: calm, diagnostic, supportive. NEVER a guilt list, NEVER a bare scoreboard.
When you notice a pattern, frame it as gentle interpretation + a question, not a
verdict. The goal is one clear, humane place to start the day.

OPEN COMMITMENTS (oldest first):
${loops}

OPEN TASKS:
${tasks}

RECENT CAPTURES:
${captures}

Choose the single most important "one thing" to focus on today and give one
sentence of plain reasoning. List the open loops worth attention as short
phrases. Add one brief interpretive note or gentle question if something stands
out; otherwise a short, genuine encouragement.

Return ONLY valid JSON in exactly this shape:
{
  "one_thing": string,
  "reasoning": string,
  "open_loops": [ string ],
  "note": string
}`;
}

function parseBrief(text: string): Omit<DailyBrief, "generated_at"> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in brief output");
  const o = JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>;
  return {
    one_thing: typeof o.one_thing === "string" ? o.one_thing : "",
    reasoning: typeof o.reasoning === "string" ? o.reasoning : "",
    open_loops: Array.isArray(o.open_loops) ? (o.open_loops as unknown[]).map(String) : [],
    note: typeof o.note === "string" ? o.note : "",
  };
}

/** Generate a fresh brief and persist it. Returns null if there's no API key. */
export async function generateBrief(): Promise<DailyBrief | null> {
  const key = getApiKey();
  if (!key) return null;

  const input = await gatherBriefData();
  const model = new GoogleGenerativeAI(key).getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
  });
  const res = await withRateLimitRetry(
    () => model.generateContent(buildBriefPrompt(input)),
    "brief",
  );
  const brief = parseBrief(res.response.text());

  const db = await getDb();
  await db.execute("INSERT INTO insights (id, type, content) VALUES (?, 'daily_brief', ?)", [
    crypto.randomUUID(),
    JSON.stringify(brief),
  ]);
  await emit(BRIEF_CHANGED);
  return { ...brief, generated_at: new Date().toISOString() };
}

/** The most recent stored brief, or null if none yet. */
export async function getLatestBrief(): Promise<DailyBrief | null> {
  const db = await getDb();
  const rows = await db.select<{ content: string; created_at: string }[]>(
    "SELECT content, created_at FROM insights WHERE type = 'daily_brief' ORDER BY created_at DESC LIMIT 1",
  );
  if (!rows.length) return null;
  try {
    const p = JSON.parse(rows[0].content) as Partial<DailyBrief>;
    return {
      one_thing: p.one_thing ?? "",
      reasoning: p.reasoning ?? "",
      open_loops: Array.isArray(p.open_loops) ? p.open_loops : [],
      note: p.note ?? "",
      generated_at: rows[0].created_at,
    };
  } catch {
    return null;
  }
}

/** True if a brief was already generated today (UTC date) — used to avoid
 *  regenerating on every app launch when the scheduled run already ran. */
export async function hasBriefToday(): Promise<boolean> {
  const latest = await getLatestBrief();
  if (!latest) return false;
  const day = latest.generated_at.slice(0, 10); // "YYYY-MM-DD"
  const today = new Date().toISOString().slice(0, 10);
  return day === today;
}
