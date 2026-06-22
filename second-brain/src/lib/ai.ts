/**
 * ai.ts — Tier-1 extraction via Gemini Flash (BUILD_PLAN §6 + §7).
 *
 * One hardcoded model, no router (that's deferred until a rate limit actually
 * bites). Conservative by design: the prompt is told to extract only what's
 * genuinely there and never invent. Output is forced to JSON.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Pinned model — change in one place if Google deprecates it.
 * gemini-2.5-flash is the current Flash tier and (unlike 2.0-flash, which is
 * billing-only on a fresh key) has free-tier quota. Fallbacks that also work
 * free if needed: gemini-flash-latest, gemini-2.5-flash-lite.
 */
export const GEMINI_MODEL = "gemini-2.5-flash";

export interface ExtractedTask {
  title: string;
  due_date?: string | null;
  inferred_due?: boolean;
  project_hint?: string | null;
}
export interface ExtractedCommitment {
  description: string;
  person?: string | null;
  implied_deadline?: string | null;
  detected_phrase?: string | null;
}
export interface ExtractedIdea {
  content: string;
  topic?: string | null;
}
export interface ExtractedPerson {
  name: string;
  context?: string | null;
}
export interface Extraction {
  tasks: ExtractedTask[];
  commitments: ExtractedCommitment[];
  ideas: ExtractedIdea[];
  people: ExtractedPerson[];
  suggested_new_project: { name: string } | null;
}

/** The key from second-brain/.env, or null if it hasn't been filled in. */
export function getApiKey(): string | null {
  const k = import.meta.env.VITE_GEMINI_API_KEY;
  return k && k.trim() && k !== "your_key_here" ? k.trim() : null;
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

function buildPrompt(
  rawContent: string,
  projects: { id: string; name: string }[],
  context: string[],
): string {
  const projectList = projects.length
    ? projects.map((p) => `- ${p.name} (${p.id})`).join("\n")
    : "(none yet)";
  const pastContext = context.length ? context.join("\n") : "(none)";

  // Adapted from BUILD_PLAN §7. RELEVANT PAST CONTEXT stays empty until the
  // Phase 4 sqlite-vec retrieval is wired in.
  return `You are the processing engine of a personal "second brain". The user dumps raw,
unstructured thoughts; you extract structured meaning. Be precise and conservative
— only extract what's actually there. Never invent.

ACTIVE PROJECTS:
${projectList}

RELEVANT PAST CONTEXT:
${pastContext}

RAW INPUT:
"""${rawContent}"""

Return ONLY valid JSON in exactly this shape (use [] or null when something is absent):
{
  "tasks":       [{ "title": string, "due_date": string|null, "inferred_due": boolean, "project_hint": string|null }],
  "commitments": [{ "description": string, "person": string|null, "implied_deadline": string|null, "detected_phrase": string|null }],
  "ideas":       [{ "content": string, "topic": string|null }],
  "people":      [{ "name": string, "context": string|null }],
  "suggested_new_project": { "name": string } | null
}

COMMITMENT DETECTION — catch implicit promises:
"I'll send / share / get back to / follow up / circle back", "let me check and tell you",
"I should reach out to…", "I need to get X to Y by Z". These are dropped threads. Catch every one.`;
}

/** Defensive parse: tolerate stray prose or ```json fences around the object. */
function parseJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in model output");
  return JSON.parse(body.slice(start, end + 1));
}

/** Coerce the parsed object into a fully-populated Extraction (never undefined arrays). */
function normalize(raw: unknown): Extraction {
  const o = (raw ?? {}) as Record<string, unknown>;
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const snp = o.suggested_new_project as { name?: unknown } | null | undefined;
  return {
    tasks: arr<ExtractedTask>(o.tasks),
    commitments: arr<ExtractedCommitment>(o.commitments),
    ideas: arr<ExtractedIdea>(o.ideas),
    people: arr<ExtractedPerson>(o.people),
    suggested_new_project:
      snp && typeof snp.name === "string" && snp.name.trim()
        ? { name: snp.name.trim() }
        : null,
  };
}

export async function extractEntities(
  rawContent: string,
  projects: { id: string; name: string }[],
  context: string[] = [],
): Promise<Extraction> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "VITE_GEMINI_API_KEY not set — add it to second-brain/.env and restart the dev server.",
    );
  }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });

  const result = await model.generateContent(buildPrompt(rawContent, projects, context));
  return normalize(parseJson(result.response.text()));
}
