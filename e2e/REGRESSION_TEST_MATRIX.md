# Regressions-Testmatrix (vollständige App-Abdeckung)

Diese Matrix definiert die Zielabdeckung für eine robuste, langfristig wartbare Regressionssuite.

## Testebenen

- **E2E (UI + API-Flow):** Nutzerverhalten und Integrationspfade
- **API-Regression:** harte Validierung von Payloads, Datentypen und Statuscodes
- **DB/Integration:** Persistenz, Seiteneffekte, Konsistenz

## Abgedeckte Kernbereiche

| Bereich | Use Cases | Datentypen | Status |
|---|---|---|---|
| Auth | Login, Logout, Register, Passwort-Reset | email, password, role, userType | Bestehend + erweitert |
| Tasks | quiz, video, article_quiz, survey, qr, photo, visit_location | string, number, boolean, JSON arrays/objects | Neu: Matrix-Test |
| Quiz-Completion | erster Klick auf letzte Frage triggert `answer + complete` | answerId, quiz_answers[] | Neu: Single-Click Regression |
| Forest/Gamification | Punkte/Completion-Auswirkungen | points, user_tasks, forest_trees | Bestehend (weiter auszubauen) |
| Rewards | Browse, Redeem, QR-Flow | cost, QR token, status transitions | Bestehend (weiter auszubauen) |
| Teams/Contests | create/join/leave/ranking | ids, participant records | Bestehend (zu härten) |
| Public/Guest | Gast-Landing, Public-Tasks, Merge-Pfade | guest session, completion_data | Teilweise (auszubauen) |
| i18n | UI-Sprachfluss, Key-Leak-Vermeidung | i18n strings, lang fallbacks | Teilweise (auszubauen) |
| Offline/PWA | SW registriert, Offline-Szenarien | queued payloads | Teilweise (auszubauen) |

## Neue Regressionstests in diesem Schritt

- `e2e/specs/regression/core/task-type-matrix.e2e.spec.ts`
  - API-basierte Matrix über alle Task-Typen.
  - Prüft Completion mit korrekten Payloads.
  - Prüft Datentyp-/Pflichtfeld-Validierung (survey/quiz).

- `e2e/specs/regression/core/quiz-completion-single-click.e2e.spec.ts`
  - UI-basierter Regressionstest für `quiz`, `video`, `article_quiz`.
  - Verifiziert den kritischen One-Click-Pfad (`/quiz/answer` und `/complete` im selben Ablauf).

## Nächste Ausbaustufen (bereits strukturiert)

1. **P0**
   - Public-Guest-Ende-zu-Ende inkl. Merge in User-Account
   - RBAC-Negativtests (401/403) für Admin/Rollen-Routen
2. **P1**
   - Team/Contest-Lifecycle ohne `test.skip`-Fallbacks
   - i18n-Core-Flows in DE/EN mit harten Assertions
3. **P2**
   - Offline-Queue und Wieder-Sync mit deterministischer Verifikation
   - Realtime/WebSocket-Events gegen UI-Stores

## Ausführungsstrategie

- Lokal (schnell): nur neue Regression-Kernsuite
  - `npx playwright test e2e/specs/regression/core --project=chromium`
- Vollständig (vor Release):
  - `npm run test:e2e`
- Live-Target (luise.bio):
  - `npm run test:e2e:luise`

