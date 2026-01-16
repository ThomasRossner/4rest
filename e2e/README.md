# E2E Tests für 4rest

Dieses Verzeichnis enthält die End-to-End-Tests für die 4rest-Anwendung.

## Struktur

```
e2e/
├── fixtures/              # Test-Dateien (Bilder, Videos, QR-Codes)
├── helpers/               # Test-Utilities
│   ├── auth.ts           # Login/Register-Helpers
│   ├── tasks.ts          # Task-Creation/Completion-Helpers
│   ├── api.ts            # API-Helpers für Backend-Setup
│   ├── test-users.ts     # Test-User-Definitionen
│   └── db.ts             # Datenbank-Helpers
├── page-objects/          # Page Object Model
│   ├── LoginPage.ts
│   ├── TasksPage.ts
│   ├── ForestPage.ts
│   ├── RewardsPage.ts
│   └── AdminPage.ts
├── specs/
│   ├── auth/             # Authentication-Tests
│   ├── tasks/             # Task-Tests
│   ├── gamification/      # Gamification-Tests
│   ├── rewards/           # Reward-Tests
│   ├── social/            # Social-Features
│   ├── admin/             # Admin-Tests
│   ├── user-journeys/     # Komplette User-Flows
│   └── cross-cutting/     # Cross-Cutting-Tests
└── setup/                 # Setup/Teardown
    ├── global-setup.ts
    └── global-teardown.ts
```

## Ausführung

### Lokal

```bash
# Alle Tests ausführen
npm run test:e2e

# Tests in einem bestimmten Browser
npx playwright test --project=chromium

# Tests in einem bestimmten Verzeichnis
npx playwright test e2e/specs/auth

# Tests im UI-Modus (für Debugging)
npx playwright test --ui

# Tests mit Trace-Viewer
npx playwright test --trace on
```

### CI/CD

Die Tests werden automatisch in GitHub Actions ausgeführt bei:
- Push auf `main` oder `develop`
- Pull Requests gegen `main` oder `develop`

## Test-Daten

### Test-User

Die folgenden Test-User sind vordefiniert:

- **guest**: `guest@test.com` / `Test123!`
- **employee**: `employee@test.com` / `Test123!`
- **admin**: `admin@test.com` / `Test123!`
- **stakeholder**: `stakeholder@test.com` / `Test123!`

### Test-Tasks

Tests erstellen automatisch Test-Tasks über die API. Diese werden nach den Tests wieder gelöscht.

## Best Practices

### Page Object Model

Verwende Page Objects für bessere Wartbarkeit:

```typescript
const loginPage = new LoginPage(page);
await loginPage.login(user);
```

### Test-Isolation

Jeder Test sollte unabhängig sein:
- Verwende `beforeEach` für Setup
- Verwende `afterEach` für Cleanup
- Erstelle eindeutige Test-Daten (z.B. mit Timestamps)

### Fehlerbehandlung

Tests sollten robust sein:

```typescript
try {
  await tasksPage.selectTask('Test Task');
} catch (error) {
  test.skip(); // Skip if task doesn't exist
}
```

### Wartezeiten

Verwende explizite Wartezeiten statt `waitForTimeout`:

```typescript
await page.waitForSelector('.task-card');
await expect(page.locator('.task-card')).toBeVisible();
```

## Debugging

### Trace-Viewer

```bash
npx playwright show-trace trace.zip
```

### Screenshots und Videos

Bei Fehlern werden automatisch Screenshots und Videos erstellt in `test-results/`.

### Console-Logs

```typescript
page.on('console', msg => console.log(msg.text()));
```

## Bekannte Probleme

- Einige Tests können flaky sein bei langsamen Netzwerkverbindungen
- OAuth-Tests erfordern konfigurierte OAuth-Provider
- Externe Dependencies (HotelKit) müssen gemockt werden

## Erweiterung

### Neuen Test hinzufügen

1. Erstelle Test-Datei in entsprechendem Verzeichnis
2. Verwende Page Objects und Helpers
3. Stelle Test-Isolation sicher
4. Dokumentiere spezielle Anforderungen

### Neue Page Object hinzufügen

1. Erstelle Datei in `page-objects/`
2. Implementiere Methoden für Interaktionen
3. Verwende explizite Selektoren
4. Dokumentiere Verwendung

## Metriken

- **Ziel-Coverage**: 80%+ aller User-Journeys
- **Test-Stabilität**: < 5% flaky Tests
- **Ausführungszeit**: < 30 Minuten für komplette Suite
