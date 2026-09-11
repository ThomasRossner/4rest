# Öffentliche Aufgaben (Gast-Session, TICKET-015)

## Ablauf

1. `GET /api/tasks/public` liefert alle aktiven Aufgaben mit `allow_public_completion = true` (Titel/Beschreibung sprachabhängig); setzt bei Bedarf das Cookie `4rest_guest_session` (UUID, HttpOnly, SameSite=Lax, Secure in Production).
2. `GET /api/tasks/public/:id` lädt eine einzelne öffentliche Aufgabe (wie bisher).
3. `POST /api/tasks/public/:id/complete` speichert die Belohnung in `guest_task_completions` (keine Punkte auf `users` bis zum Merge).
4. Nach Login oder Registrierung: `POST /api/auth/merge-guest-session` (JWT + Cookie) oder serverseitiger Merge in den Auth-Flows bucht ausstehende Completions auf den Nutzer.

## Frontend

- Route `/public/guest`: Liste der öffentlichen Aufgaben (Daten aus `GET /api/tasks/public`), Link je Eintrag → `/public/task/:taskId`.
- Route `/public/task/:taskId` (öffentlich, ohne `ProtectedApp`).
- Login: Link **„Aufgaben als Gast lösen“** → `/public/guest`.
- Jeder Aufgabentyp kann mit `allow_public_completion` freigegeben werden; die öffentliche Seite unterstützt u. a. Artikel-Quiz, Umfrage, Video, Quiz, QR, Standort — Foto-Aufgaben erfordern für den Upload ein Konto.
- Axios nutzt `withCredentials: true`, damit das Gast-Cookie mitgeht.

## CORS

Wenn SPA und API **verschiedene Origins** haben, muss der API-Server `Access-Control-Allow-Credentials: true` und eine **konkrete** `Access-Control-Allow-Origin` (nicht `*`) setzen, sonst werden Cookies nicht gesendet.

## Umgebungsvariablen

Es sind keine zusätzlichen `PUBLIC_TASK_*`-Variablen zwingend nötig; Verhalten folgt `NODE_ENV` (z. B. `Secure`-Flag am Cookie in Production).

## Rate-Limiting

Öffentliche Task-Routen sind IP-basiert begrenzt (siehe `publicTaskRateLimit` im Backend).
