# TICKET-077: iOS – Video-Aufgaben (z. B. Bienenhotel Luise) spielen nicht ab

**Status:** umgesetzt

**Verifikation:** 2026-07-12: Prod-Video `task-video-1768771186503-399671967.mp4` — H.264 (`avc1`) + AAC (`mp4a`), ~9,4 MB, `Content-Type: video/mp4`, Range-Requests (206). Ursache Frontend: `VideoTask`/`TaskDetailView` ohne `playsInline`/`webkit-playsinline` (iOS Safari erzwingt sonst Vollbild-Player). Fix: Inline-Attribute + `<source type="video/mp4">` + `aspect-ratio` gegen 0-Höhe vor Metadata.

## Symptom

Aufgabe „Bienenhotel Luise“ auf iPhone: Video startet nicht / schwarzer Bereich. Auf Mac/Desktop funktioniert die Wiedergabe.

## Ursache

- Server/Codec/Headers waren iOS-kompatibel (H.264+AAC, Byte-Range).
- `VideoTask.tsx` und `TaskDetailView.tsx` hatten im Gegensatz zu QR-Scanner & Co. kein `playsInline` bzw. `webkit-playsinline`.
- Ohne diese Attribute öffnet iOS Safari den nativen Vollbild-Player — in der eingebetteten Aufgaben-UI wirkt das wie „kaputt“.

## Fix

- `frontend/src/utils/iosVideoPlayback.ts` — `applyIosInlineVideoAttributes()`
- `VideoTask.tsx`, `TaskDetailView.tsx`: `playsInline`, `preload="metadata"`, `<source type="video/mp4">`
- CSS: `aspect-ratio: 16/9` für sichtbare Player-Höhe vor `loadedmetadata`

## Test

```bash
cd frontend && npm test -- iosVideoPlayback
```

Manuell auf iPhone: Aufgabe „Bienenhotel Luise“ öffnen, Play-Tap, Inline-Wiedergabe mit Controls.
