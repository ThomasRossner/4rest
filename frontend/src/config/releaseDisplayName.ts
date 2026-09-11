/** Öffentliche Release-Bezeichnung (Vite, zur Build-Zeit aus Docker-ARG gesetzt). */
export const RELEASE_DISPLAY_NAME = (import.meta.env.VITE_RELEASE_NAME as string | undefined)?.trim() ?? '';
