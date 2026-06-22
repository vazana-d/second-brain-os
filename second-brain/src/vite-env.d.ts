/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google AI Studio (Gemini) key — set in second-brain/.env. Tier-1 processing. */
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
