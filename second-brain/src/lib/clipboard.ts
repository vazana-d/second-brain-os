/**
 * clipboard.ts — Tier-2 "Send to Claude" bridge (BUILD_PLAN §9, Phase 5).
 *
 * The app's heavy, occasional reasoning is offloaded to Claude by hand: we
 * package context into one Markdown payload on the clipboard, the user pastes
 * it into Claude, and Claude's reply (wrapped in <AppSync> tags) is pasted back
 * and parsed here. Two manual actions keep a human in the loop — and, per the
 * §9 guardrails, mean nothing reads the clipboard in the background.
 *
 * It is unsupported by design: a Claude UI change can break the format, so the
 * parser is deliberately defensive and this path is never load-bearing.
 */
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

/** Everything Claude needs to draft a follow-up for one open commitment. */
export interface FollowUpPayload {
  person: string | null;
  description: string;
  detectedPhrase: string | null;
  impliedDeadline: string | null;
  ageLabel: string;
  rawContext: string;
}

/** What we expect back inside the <AppSync> tags for a follow-up draft. */
export interface AppSyncFollowUp {
  draft: string;
}

/**
 * Build the Markdown payload pasted into Claude. The output contract is spelled
 * out verbatim so Claude wraps its answer in tags we can find reliably.
 */
export function packageFollowUp(p: FollowUpPayload): string {
  return `# Second Brain — Draft a follow-up

I made a commitment I haven't closed yet. Write a short, warm, natural follow-up
message I can send. Match a casual professional tone. No preamble, just the message.

## The commitment
- To: ${p.person ?? "(unspecified)"}
- Promise: ${p.description}
- Triggered by phrase: ${p.detectedPhrase ? `"${p.detectedPhrase}"` : "(n/a)"}
- Made: ${p.ageLabel}
- Implied deadline: ${p.impliedDeadline ?? "(none stated)"}

## Original note this came from
"""
${p.rawContext}
"""

## Output contract (important)
Output the final result inside <AppSync>...</AppSync> tags as JSON. Put nothing
else inside those tags. Use exactly this shape:

<AppSync>
{ "draft": "the message text here" }
</AppSync>`;
}

/** Copy the packaged payload to the clipboard. Throws if the write fails. */
export async function copyToClipboard(text: string): Promise<void> {
  await writeText(text);
}

/**
 * Defensive parse of Claude's pasted reply. Tolerates stray prose around the
 * tags and minor JSON noise; throws a friendly error if no usable draft is
 * found rather than ingesting garbage.
 */
export function parseAppSyncFollowUp(text: string): AppSyncFollowUp {
  const tagged = text.match(/<AppSync>([\s\S]*?)<\/AppSync>/i);
  // Fall back to a bare {...} block if the tags got stripped on copy.
  const body = tagged ? tagged[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No <AppSync> result found in the pasted text.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body.slice(start, end + 1));
  } catch {
    throw new Error("The <AppSync> block wasn't valid JSON.");
  }
  const draft = (parsed as { draft?: unknown }).draft;
  if (typeof draft !== "string" || !draft.trim()) {
    throw new Error('The reply had no "draft" text.');
  }
  return { draft: draft.trim() };
}
