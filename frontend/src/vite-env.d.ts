/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RELEASE_NAME?: string;
}

// Build-Version-Token (package version + Build-Zeitpunkt), via Vite `define` injiziert.
declare const __BUILD_ID__: string;
