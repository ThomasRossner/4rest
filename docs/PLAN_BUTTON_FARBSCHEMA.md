# Plan: Farbschema Buttons – Grün (normal) / Rot (Abbrechen & Löschen)

## Ziel
- **Normale Buttons:** einheitlich grün (bereits in `:root` als `--color-primary: #2d5016`).
- **Abbrechen- und Lösch-Buttons:** einheitlich rot (`--color-error` / neue Klasse).

## Ausgangslage
- Es gibt **keine zentrale Button-Komponente**; Buttons sind über viele TSX-Dateien mit unterschiedlichen Klassen verteilt.
- In **index.css** sind bereits Design-Tokens definiert (`--color-primary` grün, `--color-error` rot).
- **Inkonsistenzen:**
  - Viele Stellen nutzen **blaue Fallbacks**: `var(--color-primary, #2563eb)` oder `#3b82f6` → wirken blau statt grün.
  - **Lila/Blau-Gradienten** (#667eea, #764ba2) in Hero-Bereichen, Karten, Navigation.
  - **„Danger“-Buttons** (z. B. `.admin-action-button.danger`) sind teils mit `--color-primary` (grün) statt rot gestylt.
  - Einige **inline styles** in TSX mit festem Blau/Grün.

## Strategie (3 Stufen)

### Stufe 1: Zentrale Button-Klassen und Tokens (index.css)
- **Neue globale Klassen** (damit jede Seite/ jeder Bereich sie nutzen kann):
  - **`.btn-primary`**: Hintergrund `var(--color-primary)`, Hover `var(--color-primary-dark)`, Text weiß → für alle normalen Aktionen.
  - **`.btn-danger`**: Hintergrund `var(--color-error)`, Hover etwas dunkler (z. B. `--color-error-dark` neu oder bestehend nutzen), Text weiß → für Abbrechen, Löschen, destruktive Aktionen.
- Optional: **`--color-error-dark`** in `:root` für Hover-Zustand von Danger-Buttons (falls noch nicht vorhanden).
- **Keine** Änderung an den bestehenden Token-Namen; nur Nutzung vereinheitlichen und Fallbacks entfernen.

### Stufe 2: Blaue Fallbacks und Lila/Blau-Gradienten ersetzen
- **Alle** Vorkommen von  
  `var(--color-primary, #2563eb)` / `#3b82f6` / `#2563eb` / `#1f3a8a`  
  → auf **`var(--color-primary)`** bzw. **`var(--color-primary-dark)`** umstellen (kein Fallback mehr), damit überall das grüne Schema aus `:root` gilt.
- **Gradienten** mit #667eea / #764ba2 (Lila/Blau) → durch **Grün-Varianten** ersetzen, z. B.  
  `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 50%, var(--color-accent) 100%)`  
  oder bestehende Grün-Gradienten (z. B. #10b981) durch `var(--color-primary)` / `var(--color-primary-light)` ersetzen, wo es thematisch „Primary“ ist.
- Betroffene Dateien (aus Grep):  
  AdminPage.css, UserManagement.css, RedemptionConfirmationModal.css, RewardRedemptionDisplay.css, RewardCard.css, PointsBonusPage.css, SwipeToRedeem.css, TasksPage.css, DebugTools.css, LanguageSwitcher.css, ContestRankingPage.css, Employee/PointsBonusPage.css, QrScannerPage.css, DashboardCard.css, TimelineChart.css, ggf. weitere.

### Stufe 3: Abbrechen- und Lösch-Buttons explizit rot
- **Identifikation:**
  - Texte: „Abbrechen“, „Cancel“, „Löschen“, „Delete“, „Entfernen“, „Remove“, „Zurücksetzen“ (wo destruktiv), Bestätigungs-Buttons in Lösch-Dialogen.
  - Bestehende Klassen: z. B. `.admin-action-button.danger`, `.admin-button-danger`, `.btn-danger`, `.danger`, oder Buttons in Modals mit `confirmTone === 'danger'`.
- **Umsetzung:**
  - In **CSS**: Alle Klassen, die „danger“ / „delete“ / „cancel“ bedeuten, auf **`background: var(--color-error)`** und Hover **`var(--color-error-dark)`** (oder dunkleres Rot) umstellen.  
    Konkret: In AdminPage.css `.admin-action-button.danger` von `--color-primary` auf `--color-error` umstellen.
  - In **TSX**: Buttons, die Abbrechen/Löschen sind, eine einheitliche Klasse bekommen (z. B. `btn-danger` oder `admin-action-button danger`), sodass sie über die zentrale Regel in index.css bzw. Seiten-CSS rot werden.
- **Suche** nach:  
  `danger`, `delete`, `cancel`, `Abbrechen`, `Löschen`, `Remove`, `Zurücksetzen` in Button-Kontext in allen relevanten TSX/CSS.

## Vorgehen (Reihenfolge)
1. **index.css**  
   - `.btn-primary` und `.btn-danger` anlegen, ggf. `--color-error-dark` ergänzen.
2. **Grep** nach allen Stellen mit blauem Fallback und Lila-Gradienten (bereits grob erfasst).
3. **CSS-Dateien** nacheinander:  
   - Blaue Fallbacks entfernen (grün aus Tokens).  
   - Lila/Blau-Gradienten auf Grün umstellen.  
   - Danger/Cancel/Delete-Klassen auf rot umstellen.
4. **TSX-Dateien**:  
   - Inline-Styles mit Blau/Grün durch `var(--color-primary)` oder Klassen ersetzen.  
   - Jeden Abbrechen-/Lösch-Button mit `className="btn-danger"` (oder bestehender Danger-Klasse) versehen und in CSS auf `--color-error` ziehen.
5. **Abschluss**:  
   - Visuell durchklicken (Login, Admin, Rezeption, Gäste-Seiten, Modals, Lösch-Dialoge), ob alle normalen Buttons grün und alle Abbrechen/Löschen-Buttons rot sind.

## Betroffene Bereiche (Übersicht)
- **Global:** index.css
- **Admin:** AdminPage.css/tsx, UserManagement, DebugTools, PhotoValidation, ContestManagement, TeamManagement, QrScannerPage
- **Rezeption/Redaktion:** RezeptionPage, RedaktionPage
- **Tasks/Rewards:** TaskComponents, TasksPage, RewardCard, RewardsPage, RedemptionConfirmationModal, RewardRedemptionDisplay, SwipeToRedeem, PointsBonusScanner, RewardScanner, QrVerificationSuccessModal
- **Sonstige:** LoginPage, Navigation, HomePage, StatisticsPage, ForestPage, ContestCreator, TeamCreator, FilterDropdown, Mailbox, GDPR ConsentManager, LanguageSwitcher, UserLocationMap (Popup-Buttons), Charts (TimelineChart, BarChart), ContestRankingPage, EmployeeContestsPage, ProfilePage

## Risiko / Aufwand
- **Niedrig:** Nur Farben und Klassen; keine Logik-Änderung.
- **Mittel:** Viele Dateien; systematisches Ersetzen und einmalige Prüfung nötig, damit wirklich **alle** Buttons erwischt werden.

Wenn du möchtest, setze ich den Plan als Nächstes Schritt für Schritt um (zuerst index.css + eine Beispielseite, dann Rest).
