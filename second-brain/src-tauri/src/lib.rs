// Second Brain OS — Tauri v2 entry point
// Step 1: scaffold + SQLite setup (no auth, no PIN)

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
        // Global shortcut — Ctrl+Shift+Space (wired in Step 2)
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // Filesystem access
        .plugin(tauri_plugin_fs::init())
        // Windows native toast notifications
        .plugin(tauri_plugin_notification::init())
        // Clipboard — Tier-2 AppSync bridge (wired in Step 5)
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
