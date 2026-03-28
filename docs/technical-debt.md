# Technische Schulden (Überblick)

Aktualisiert bei App-Review. Bei Änderungen an Migrationen: `scripts/deploy-ionos.sh` → `ALL_MIGRATIONS` **immer** mit `backend/src/database/migrate.ts` abgleichen.

## Routing & Navigation

- **`App.tsx`:** Routen `points-bonus` und `employee-contests` unter dem Layout-Branch sind für Rollen `rezeption` / `administrator` bedingt – diese Rollen nutzen aber vorher schon andere `Routes` (kein gemeinsames Layout). Die Routen werden dort praktisch nie registriert; Bonus-QR-Generierung steckt in **AdminPage** / **RezeptionPage**.
- **`Navigation.tsx`:** `employeeTopItems` (Links zu `/points-bonus`, `/employee-contests`) zielt auf Rezeption/Admin – die **Navigation** wird im Layout aber nicht für diese Rollen gerendert. Block ist faktisch unsichtbar; entweder entfernen oder fachlich neu verdrahten (z. B. andere Rolle im Haupt-Layout).

## Produkt / Client-State (Wald-Punkte)

- **`ProfilePage`:** zeigt keine `forestPoints`; Nav kann Wald-Summe anzeigen – Darstellung angleichen oder bewusst nur in Nav/Timeline lassen.
- **`authStore.incrementPoints`:** aktualisiert nur `points`, nicht `forestPoints` – kurz inkonsistent bis `refreshMe`.

## Redaktion

- **`RedaktionPage.tsx`:** Task-/Reward-Bearbeitung nur Platzhalter (TODO, Toast „wird implementiert“).

## Tooling & Build

- **ESLint:** `frontend/package.json` hat `npm run lint`, es fehlt aber eine ESLint-Konfiguration im Projekt – Script schlägt fehl.
- **Frontend-Build:** große Bundles, PWA-Precache-Warnungen; optional Chunking / Limits anpassen.
- **Dependencies:** u. a. `three-mesh-bvh` / Three-Warnung (`BatchedMesh`); bei Bedarf Versionen prüfen.

## Sonstiges

- Viele **`console.log` / `console.debug`** in Task-/Scanner-Komponenten – für Produktion reduzieren oder hinter `import.meta.env.DEV` legen.
- **`migrate.ts`:** kein `032_*` in der Liste (Sprung 031 → 033) – historisch, nur zur Einordnung.
