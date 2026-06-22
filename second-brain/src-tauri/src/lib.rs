// Second Brain OS — Tauri v2 entry point
// Step 2: Quick Capture Bar — global shortcut + always-on-top capture window.

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Force `win` to the foreground and give it keyboard focus on Windows.
///
/// A window summoned from a global shortcut doesn't own the foreground, so a
/// bare `SetForegroundWindow`/`set_focus` is usually demoted to a taskbar
/// flash — the window appears but keystrokes go to the app underneath. The
/// reliable workaround is to briefly attach our input queue to the thread that
/// currently owns the foreground; while attached, Windows lets us take it.
#[cfg(windows)]
fn force_foreground(win: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
    use windows::Win32::UI::Input::KeyboardAndMouse::SetFocus;
    use windows::Win32::UI::WindowsAndMessaging::{
        BringWindowToTop, GetForegroundWindow, GetWindowThreadProcessId, SetForegroundWindow,
    };

    let Ok(hwnd) = win.hwnd() else { return };
    let hwnd = HWND(hwnd.0);

    unsafe {
        let foreground = GetForegroundWindow();
        let fg_thread = GetWindowThreadProcessId(foreground, None);
        let this_thread = GetCurrentThreadId();

        let attached = AttachThreadInput(fg_thread, this_thread, true).as_bool();
        let _ = BringWindowToTop(hwnd);
        let _ = SetForegroundWindow(hwnd);
        let _ = SetFocus(Some(hwnd));
        if attached {
            let _ = AttachThreadInput(fg_thread, this_thread, false);
        }
    }
}

/// Reveal the capture window. Driven from the global shortcut.
///
/// Always shows + focuses (no toggle): a missed keypress that hid the bar mid-
/// dump would be worse than a redundant show. The `capture:shown` event tells
/// the webview to reset to a clean, focused, empty bar.
fn show_capture(app: &AppHandle) {
    let Some(win) = app.get_webview_window("capture") else {
        return;
    };

    let _ = win.set_always_on_top(true);
    let _ = win.center();
    let _ = win.show();
    let _ = win.set_focus();
    #[cfg(windows)]
    force_foreground(&win);
    let _ = win.emit("capture:shown", ());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Ctrl+Shift+Space — the one binding that makes capture effortless.
    let capture_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);

    tauri::Builder::default()
        // Opens URLs / file paths in the OS default handler
        .plugin(tauri_plugin_opener::init())
        // SQLite — migrations run automatically on first launch, creating all tables
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:second-brain.db",
                    vec![tauri_plugin_sql::Migration {
                        version: 1,
                        description: "initial schema",
                        sql: include_str!("../migrations/0001_initial.sql"),
                        kind: tauri_plugin_sql::MigrationKind::Up,
                    }],
                )
                .build(),
        )
        // Global shortcut — only one shortcut is ever registered, so any
        // Pressed event is the capture binding.
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        show_capture(app);
                    }
                })
                .build(),
        )
        // Filesystem access
        .plugin(tauri_plugin_fs::init())
        // Windows native toast notifications
        .plugin(tauri_plugin_notification::init())
        // Clipboard — Tier-2 AppSync bridge (wired in Step 5)
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(move |app| {
            app.global_shortcut().register(capture_shortcut)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
