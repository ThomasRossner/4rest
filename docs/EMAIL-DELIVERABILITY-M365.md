# Aktivierungsmail-Flow und Zustellbarkeit (Outlook / Exchange / Microsoft 365)

## Ist-Flow (Backend)

1. Registrierung erzeugt User und triggert `sendEmailVerificationEmail(...)`.
2. Versand läuft über `email.service.ts` (SMTP via Nodemailer).
3. Verifikation erfolgt über `/api/auth/verify-email` mit Token.
4. Erneutes Senden ist möglich über:
   - `/api/auth/resend-verification` (eingeloggt)
   - `/api/auth/resend-verification-request` (öffentlich, login-seitig, generische Antwort)

## Neu implementiert

- **Retry-Mechanismus** bei transienten SMTP-Fehlern (`EMAIL_MAX_RETRIES`, `EMAIL_RETRY_BASE_MS`).
- **Delivery-Logging** in `email_delivery_log` (Status, Attempts, SMTP-Response, Error).
- **Suppression List** in `email_suppressions` (Hard-Bounces/Complaints werden unterdrückt).
- **Webhook-Endpoint** `/api/auth/email-events` (Bounce/Complaint/Delivery Events).
- **Rate-Limit fürs Resend** (60s) über Delivery-Logs.

## DNS/Provider-Prüfung (M365/Exchange-Fokus)

Für stabile Zustellung an Outlook/M365 müssen SPF, DKIM, DMARC konsistent auf **dieselbe From-Domain** zeigen:

### SPF

- TXT-Record auf Root-Domain:
  - `v=spf1 include:<smtp-provider> -all`
- Nur ein SPF-Record aktiv.
- Wenn M365 selbst sendet: `include:spf.protection.outlook.com`.

### DKIM

- DKIM-Signatur muss auf **From-Domain Alignment** laufen (nicht nur Return-Path-Domain).
- Für M365:
  - Zwei CNAME-Selectoren (z. B. `selector1._domainkey`, `selector2._domainkey`) gemäß Tenant.
  - DKIM in Defender/M365 Admin für die Domain aktivieren.

### DMARC

- `_dmarc.<domain>`:
  - Start: `v=DMARC1; p=quarantine; rua=mailto:dmarc@<domain>; fo=1; adkim=s; aspf=s`
  - Nach Stabilisierung: `p=reject`.
- Alignment strikt (`adkim=s`, `aspf=s`) für Outlook/M365 besonders wichtig.

## Empfohlene Betriebswerte

- `EMAIL_ENABLED=true`
- `EMAIL_MOCK_MODE=false` (Prod)
- `EMAIL_MAX_RETRIES=3`
- `EMAIL_RETRY_BASE_MS=800`
- `EMAIL_FROM` auf produktive Domain mit SPF/DKIM/DMARC Alignment
- `EMAIL_EVENTS_SECRET=<starkes secret>`

## Bounce/Suppression-Betrieb

- Provider-Webhooks (SES/Sendgrid/Postmark/Brevo/Resend) auf `/api/auth/email-events` mappen.
- Bei `bounce`/`complaint`: automatisch Suppression-Eintrag.
- Bei legitimem Re-Opt-In: Suppression manuell entfernen (SQL/Admin-Tool).

## Kurzer Smoke-Test

1. Neue Registrierung mit Testadresse bei Outlook.com.
2. Prüfen:
   - Aktivierungsmail kommt an (Inbox, nicht Spam).
   - Header enthalten SPF=pass, DKIM=pass, DMARC=pass.
3. Login mit unbestätigter Mail -> Resend-Button sichtbar.
4. Resend klicken -> generische Erfolgsmeldung + neuer Logeintrag.
5. Simulierter Bounce via `/api/auth/email-events` -> Suppression aktiv, kein weiterer Versand.
