import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit } from "@tauri-apps/api/event";
import { getDb } from "../lib/db";

/**
 * CaptureBar — the sacred core (Step 2).
 *
 * One keystroke (Ctrl+Shift+Space, registered in Rust) shows this window.
 * Type → Enter writes the raw text straight to `captures` and the window
 * vanishes. NO AI, no extraction — just persist the canonical raw row.
 *
 * Everything here is tuned for one feeling: instant. The DB write is a local
 * SQLite insert (sub-millisecond), so we can await it and still hide well
 * under a second.
 */
export default function CaptureBar() {
  const [value, setValue] = useState("");
  // Mirror of `value` so the native event listeners (registered once, in the
  // effect below) always read the latest text instead of a stale closure.
  const valueRef = useRef("");
  valueRef.current = value;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Guards against an Enter double-firing a second save before we hide.
  const savingRef = useRef(false);
  const win = getCurrentWindow();

  // rAF defers the focus call until after the window has foreground focus and
  // the element is laid out — without it the textarea often misses focus on show.
  const focusInput = () =>
    requestAnimationFrame(() => inputRef.current?.focus());

  const clear = () => {
    setValue("");
    valueRef.current = "";
  };

  const hide = async () => {
    clear();
    await win.hide();
  };

  const save = async () => {
    if (savingRef.current) return;
    const text = valueRef.current.trim();
    if (!text) {
      // Nothing typed — just dismiss, no row written.
      await hide();
      return;
    }
    savingRef.current = true;
    try {
      const db = await getDb();
      const id = crypto.randomUUID();
      await db.execute(
        "INSERT INTO captures (id, raw_content, source, processed) VALUES (?, ?, ?, 0)",
        [id, text, "quick_bar"],
      );
      await hide(); // only dismiss once the row is safely written
      // Fire-and-forget: the main window picks this up and processes it in the
      // background. Never awaited — capture must stay instant.
      void emit("capture:saved", id);
    } catch (err) {
      // Never lose a capture silently: log it and keep the bar open with the
      // text intact so the dump can be retried.
      console.error("capture save failed:", err);
    } finally {
      savingRef.current = false;
    }
  };

  useEffect(() => {
    focusInput();

    // Tracks whether the window has actually held OS focus this show-cycle, so
    // we never react to the transient blur that fires during the Windows
    // show→focus race (the classic always-on-top focus-steal quirk).
    let focusedAt = 0;
    let hasFocused = false;

    // Rust emits this every time the shortcut reveals the window: reset to a
    // clean, focused, empty bar.
    const unlistenShown = win.listen("capture:shown", () => {
      hasFocused = false;
      clear();
      focusInput();
    });

    const unlistenFocus = win.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        hasFocused = true;
        focusedAt = Date.now();
        return;
      }
      // Clicked away — but ignore the transient blur in the 300ms settle window
      // where Windows may bounce focus during the show race. Otherwise commit
      // whatever was typed rather than dropping it (save() hides; if empty it
      // just dismisses).
      if (hasFocused && Date.now() - focusedAt > 300) {
        void save();
      }
    });

    return () => {
      void unlistenShown.then((f) => f());
      void unlistenFocus.then((f) => f());
    };
    // Empty deps: setValue/win are stable; listeners read live values via refs/closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Enter saves; Shift+Enter inserts a newline.
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      void hide();
    }
  };

  return (
    <div className="capture-shell">
      <div className="capture-bar">
        <span className="capture-caret" aria-hidden="true">
          ▌
        </span>
        <textarea
          ref={inputRef}
          className="capture-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Dump anything…"
          rows={1}
          autoFocus
          spellCheck={false}
        />
        <kbd className="capture-hint">⏎</kbd>
      </div>
    </div>
  );
}
