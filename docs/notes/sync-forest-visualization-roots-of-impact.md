# Sync Wald-Visualisierung: ThomasRossner/Roots_of_Impact → lokales 4rest

Stand: 2026-11-11

## Remotes (lokal)

| Name | URL |
|------|-----|
| `origin` | `git@github.com:WernerFeil/roots-of-impact.git` |
| `thomas-4rest` | `git@github.com:ThomasRossner/4rest.git` |
| `roots-of-impact` | `git@github.com:ThomasRossner/Roots_of_Impact.git` |

Default-Branch auf `roots-of-impact`: **dev** (`roots-of-impact/HEAD`).

## Vergleich (lokal `dev` vs. `roots-of-impact/dev`)

- Kein gemeinsamer Merge-Base (getrennte Histories).
- **Roots_of_Impact** enthält **keine** Hybrid-Wald-3D-Artefakte:
  - kein `frontend/src/components/3d/tree-system/**`
  - kein `frontend/public/models/*.glb`
  - kein `ForestHybridScene`, `HybridSceneController`, `Mapel`, Kiefern-Utils usw.
- Auf ROI existieren nur ältere Varianten von `ForestScene.tsx` und `Tree.tsx` (Stand Nov 2025).
- Lokales Repo ist für alle Wald-Viz-Pfade **neuer** (u. a. Hybrid-Wald, Kamera, Mapel02, ForestPage mit Hybrid-Canvas).

Ein `git checkout roots-of-impact/dev -- <wald-pfade>` würde die produktive Hybrid-Visualisierung **zurücksetzen** — daher **kein** Checkout aus ROI.

## Dateien nur auf ROI (nicht Wald-Viz)

- `e2e/auth.spec.ts`
- `e2e/tasks.spec.ts`

## ThomasRossner/4rest (`thomas-4rest/main`)

Enthält Hybrid-Wald wie WernerFeil/`dev`, aber **ohne** lokale Mapel-Integration (`Mapel02.glb`, `Mapel.jsx`, angepasster `SceneController.jsx`).

## Tests (lokal nach Sync-Entscheid)

`vitest run` für `forestCameraFraming`, `forestCategoryMorphology`, `forestGroundLayout`, `forestTreeMapper`: **35/35 grün**.

## Manuell prüfen

1. Wald in der App mit `demo@example.com` (Hybrid-Scene, Kiefern-Mix, Mapel).
2. Falls ROI als **Ziel** für die Viz dienen soll: Hybrid-Wald **von hier nach** `ThomasRossner/Roots_of_Impact` pushen (umgekehrte Richtung), nicht aus ROI pullen.
3. Optional: i18n-Strings aus ROI-`ForestPage` selektiv nachziehen, ohne Hybrid-UI zu ersetzen.
