// capture.tsx — entry point for the Quick Capture Bar window (Step 2)
// Deliberately NOT wrapped in StrictMode: the bar registers native Tauri
// event listeners, and StrictMode's double-mount would fire them twice in dev.
import ReactDOM from "react-dom/client";
import CaptureBar from "./capture/CaptureBar";
import "./capture/capture.css";

ReactDOM.createRoot(
  document.getElementById("capture-root") as HTMLElement,
).render(<CaptureBar />);
