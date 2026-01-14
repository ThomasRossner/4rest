# Analyse: Thumbnail-Upload für Aufgaben und Belohnungen

## Übersicht
Diese Analyse identifiziert alle betroffenen Funktionen, Dialoge und Komponenten, die für die Implementierung von Thumbnail-Uploads für Aufgaben (Tasks) und Belohnungen (Rewards) angepasst werden müssen.

---

## 1. Aktuelle Icon-Verwendung

### 1.1 Task-Icons

**Aktuelle Größe:**
- CSS: `font-size: 3rem` (≈ 48px) in `TasksPage.css` (Zeile 179)
- QRCodeIcon: `size={48}` in `TasksPage.tsx` (Zeile 326)

**Aktuelle Icon-Quellen:**
- **TasksPage.tsx** (Zeilen 321-327): Direkte Emoji-Zuweisung basierend auf `task.type`
  - `video`: 🎥
  - `quiz`: ❓
  - `article_quiz`: 📄
  - `survey`: 📋
  - `qr`: `<QRCodeIcon size={48} />`
  - `visit_location`: 📍
  - `photo`: 📷 (default)
- **TaskCard.tsx** (Zeilen 20-34): Emoji-Mapping über `typeEmoji` Record
- **taskIcons.ts**: Konstanten-Datei mit `TASK_TYPE_ICONS` Record (wird in AdminPage importiert)

**Betroffene Komponenten:**
1. `frontend/src/pages/TasksPage/TasksPage.tsx` - Hauptansicht der Aufgabenliste
2. `frontend/src/components/Tasks/TaskCard.tsx` - Task-Karten-Komponente
3. `frontend/src/components/LocationMap/UserLocationMap.tsx` - Karten-Marker (Zeilen 28-48)

### 1.2 Reward-Icons

**Aktuelle Größe:**
- CSS: `font-size: 3rem` (≈ 48px) in `RewardCard.css` (Zeile 15)

**Aktuelle Icon-Quellen:**
- **RewardCard.tsx** (Zeile 342): Direkte Emoji-Zuweisung basierend auf `reward.rewardType`
  - `discount`: 🏷️
  - `benefit`: ✨
  - `team_event`: 🤝
  - Default: 🎁
- **RewardsPage.tsx** (Zeile 215): Fallback `reward.icon || '🎁'`
- **rewardIcons.ts**: Konstanten-Datei mit `REWARD_TYPE_ICONS` Record
- **Backend** (`reward.service.ts`, Zeile 69): `icon: getRewardIcon(row.reward_type)` - generiert Icon im Backend

**Betroffene Komponenten:**
1. `frontend/src/components/Rewards/RewardCard.tsx` - Haupt-Reward-Karten-Komponente
2. `frontend/src/pages/RewardsPage/RewardsPage.tsx` - Hauptansicht der Belohnungsliste
3. `frontend/src/components/LocationMap/UserLocationMap.tsx` - Karten-Marker (Zeilen 50-70)

---

## 2. Admin-Formulare (Erstellen/Bearbeiten)

### 2.1 Task-Formular

**Datei:** `frontend/src/pages/Admin/AdminPage.tsx`

**Betroffene Bereiche:**
- **TaskFormState** (Zeilen 110-142): Formular-State-Typ
  - **Hinzufügen:** `thumbnailFile: File | null` und `thumbnailUrl: string | null`
- **defaultTaskForm()** (Zeilen 1167-1199): Initialisierung des Formulars
  - **Hinzufügen:** Initialisierung der Thumbnail-Felder
- **startTaskEdit()** (Zeilen 4087-4137): Laden bestehender Task-Daten beim Bearbeiten
  - **Hinzufügen:** Laden des `thumbnail_url` aus der Datenbank
- **Task-Formular-Rendering** (ca. Zeilen 5000-6000): UI für Task-Erstellung/Bearbeitung
  - **Hinzufügen:** File-Input-Feld für Thumbnail-Upload
  - **Hinzufügen:** Preview des aktuellen/hochgeladenen Thumbnails
  - **Hinzufügen:** Button zum Löschen des Thumbnails (zurück zu Default-Icon)
- **validateTaskFormState()** (Zeilen 1431-1573): Validierung
  - **Optional:** Validierung der Dateigröße/Dateityp für Thumbnail
- **Task-Submit-Handler**: Speichern des Tasks
  - **Hinzufügen:** Upload des Thumbnails vor dem Speichern
  - **Hinzufügen:** `thumbnail_url` im Payload an Backend senden

### 2.2 Reward-Formular

**Datei:** `frontend/src/pages/Admin/AdminPage.tsx`

**Betroffene Bereiche:**
- **RewardFormState** (Zeilen 144-159): Formular-State-Typ
  - **Hinzufügen:** `thumbnailFile: File | null` und `thumbnailUrl: string | null`
- **defaultRewardForm()** (Zeilen 1201-1216): Initialisierung des Formulars
  - **Hinzufügen:** Initialisierung der Thumbnail-Felder
- **startRewardEdit()**: Laden bestehender Reward-Daten beim Bearbeiten
  - **Hinzufügen:** Laden des `thumbnail_url` aus der Datenbank
- **Reward-Formular-Rendering** (ca. Zeilen 6230-7000): UI für Reward-Erstellung/Bearbeitung
  - **Hinzufügen:** File-Input-Feld für Thumbnail-Upload
  - **Hinzufügen:** Preview des aktuellen/hochgeladenen Thumbnails
  - **Hinzufügen:** Button zum Löschen des Thumbnails (zurück zu Default-Icon)
- **validateRewardFormState()** (Zeilen 1574-1613): Validierung
  - **Optional:** Validierung der Dateigröße/Dateityp für Thumbnail
- **Reward-Submit-Handler**: Speichern des Rewards
  - **Hinzufügen:** Upload des Thumbnails vor dem Speichern
  - **Hinzufügen:** `thumbnail_url` im Payload an Backend senden

---

## 3. Backend-Änderungen

### 3.1 Datenbank-Migration

**Neue Migration erstellen:** `database/migrations/018_task_reward_thumbnails.sql`

**Änderungen:**
```sql
-- Thumbnail-Spalte für Tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Thumbnail-Spalte für Rewards
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
```

### 3.2 Backend-Services

**Task Service** (`backend/src/services/task.service.ts`):
- **Task Interface** (Zeilen 13-45): `thumbnail_url?: string` hinzufügen
- **getAllTasks()** (Zeilen 47-828): `thumbnail_url` in SELECT-Query aufnehmen
- **createTask()** (Zeile 218): `thumbnail_url` im Insert berücksichtigen
- **updateTask()**: `thumbnail_url` im Update berücksichtigen

**Reward Service** (`backend/src/services/reward.service.ts`):
- **getRewardsService()** (Zeilen 15-72): `thumbnail_url` in SELECT-Query aufnehmen und im Return-Objekt zurückgeben
- **createReward()**: `thumbnail_url` im Insert berücksichtigen
- **updateReward()**: `thumbnail_url` im Update berücksichtigen

### 3.3 Upload-Endpoint

**Bestehende Infrastruktur:**
- `backend/src/controllers/task.controller.ts`: `uploadPhoto()` existiert bereits (Zeile 781)
- `backend/src/routes/task.routes.ts`: `/tasks/upload` Endpoint existiert

**Neue Endpoints erstellen:**
- `POST /api/tasks/upload/thumbnail` - Upload für Task-Thumbnails
- `POST /api/rewards/upload/thumbnail` - Upload für Reward-Thumbnails

**Oder erweitern:**
- Bestehenden `/tasks/upload` Endpoint erweitern um `thumbnail` als Option
- Neuen `/rewards/upload/thumbnail` Endpoint erstellen

**Upload-Handler:**
- Dateityp-Validierung: Nur PNG/JPG erlauben
- Größen-Validierung: Max. Dateigröße definieren (z.B. 2MB)
- Bildverarbeitung: Thumbnails auf einheitliche Größe (48x48px oder größer mit Aspect-Ratio) zuschneiden/resizen
- Speicherung: In `uploads/thumbnails/tasks/` bzw. `uploads/thumbnails/rewards/`
- Rückgabe: URL des gespeicherten Thumbnails

### 3.4 API-Responses

**Task-Response:**
- `GET /api/tasks` und `GET /api/tasks/:id`: `thumbnail_url` Feld hinzufügen

**Reward-Response:**
- `GET /api/rewards` und `GET /api/rewards/:id`: `thumbnail_url` Feld hinzufügen

---

## 4. Frontend-Anzeige-Logik

### 4.1 Task-Icon-Anzeige

**Logik implementieren in:**

1. **TasksPage.tsx** (Zeilen 321-327):
   ```typescript
   {task.thumbnail_url ? (
     <img src={task.thumbnail_url} alt={task.title} className="task-icon-image" />
   ) : (
     // Aktuelle Emoji/Icon-Logik
   )}
   ```

2. **TaskCard.tsx** (Zeile 134):
   ```typescript
   <span aria-hidden>
     {task.thumbnail_url ? (
       <img src={task.thumbnail_url} alt={task.title} />
     ) : (
       {emoji}
     )}
   </span>
   ```

3. **UserLocationMap.tsx** (Zeilen 28-48):
   - Marker-Icons: Optional Thumbnail als Marker-Icon verwenden (falls vorhanden)

### 4.2 Reward-Icon-Anzeige

**Logik implementieren in:**

1. **RewardCard.tsx** (Zeile 341-343):
   ```typescript
   <div className="reward-icon" aria-hidden>
     {reward.thumbnail_url ? (
       <img src={reward.thumbnail_url} alt={reward.title} />
     ) : (
       // Aktuelle Emoji-Logik
     )}
   </div>
   ```

2. **RewardsPage.tsx** (Zeile 215):
   - Fallback-Logik anpassen

### 4.3 CSS-Anpassungen

**TasksPage.css:**
- `.task-icon` (Zeile 179): Für `<img>` Tags anpassen
- **Hinzufügen:** `.task-icon-image` Klasse für Thumbnail-Bilder
  ```css
  .task-icon-image {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 8px;
  }
  ```

**RewardCard.css:**
- `.reward-icon` (Zeile 14): Für `<img>` Tags anpassen
- **Hinzufügen:** `.reward-icon-image` Klasse für Thumbnail-Bilder
  ```css
  .reward-icon-image {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 8px;
  }
  ```

---

## 5. API-Client (Frontend)

**Datei:** `frontend/src/services/api.ts`

**Hinzufügen:**
```typescript
async uploadTaskThumbnail(file: File): Promise<{ thumbnail_url: string }> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  const response = await apiClient.post('/tasks/upload/thumbnail', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

async uploadRewardThumbnail(file: File): Promise<{ thumbnail_url: string }> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  const response = await apiClient.post('/rewards/upload/thumbnail', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
```

---

## 6. Zusammenfassung der betroffenen Dateien

### Frontend:
1. ✅ `frontend/src/pages/TasksPage/TasksPage.tsx` - Icon-Anzeige
2. ✅ `frontend/src/pages/TasksPage/TasksPage.css` - Icon-Styling
3. ✅ `frontend/src/components/Tasks/TaskCard.tsx` - Icon-Anzeige
4. ✅ `frontend/src/components/Rewards/RewardCard.tsx` - Icon-Anzeige
5. ✅ `frontend/src/components/Rewards/RewardCard.css` - Icon-Styling
6. ✅ `frontend/src/pages/RewardsPage/RewardsPage.tsx` - Icon-Anzeige
7. ✅ `frontend/src/pages/Admin/AdminPage.tsx` - Formulare für Erstellen/Bearbeiten
8. ✅ `frontend/src/pages/Admin/AdminPage.css` - Formular-Styling (Upload-Feld)
9. ✅ `frontend/src/components/LocationMap/UserLocationMap.tsx` - Karten-Marker (optional)
10. ✅ `frontend/src/services/api.ts` - API-Client-Methoden
11. ✅ `frontend/src/constants/taskIcons.ts` - Konstanten (bleiben als Fallback)
12. ✅ `frontend/src/constants/rewardIcons.ts` - Konstanten (bleiben als Fallback)

### Backend:
1. ✅ `database/migrations/018_task_reward_thumbnails.sql` - **NEU** - Datenbank-Migration
2. ✅ `backend/src/services/task.service.ts` - Service-Logik
3. ✅ `backend/src/services/reward.service.ts` - Service-Logik
4. ✅ `backend/src/controllers/task.controller.ts` - Upload-Controller
5. ✅ `backend/src/controllers/reward.controller.ts` - Upload-Controller (oder neu erstellen)
6. ✅ `backend/src/routes/task.routes.ts` - Upload-Route
7. ✅ `backend/src/routes/reward.routes.ts` - Upload-Route (oder neu erstellen)
8. ✅ `backend/openapi.yaml` - API-Dokumentation aktualisieren

---

## 7. Technische Anforderungen

### Upload-Validierung:
- **Dateitypen:** Nur `.png`, `.jpg`, `.jpeg` erlauben
- **Max. Dateigröße:** 2-5 MB (empfohlen: 2MB)
- **Bildverarbeitung:** 
  - Thumbnails auf einheitliche Größe zuschneiden/resizen (48x48px oder größer mit Aspect-Ratio)
  - Verwendung von Sharp oder ähnlicher Bibliothek im Backend

### Fallback-Verhalten:
- Wenn `thumbnail_url` `null` oder leer ist → Default-Icon (Emoji) verwenden
- Wenn Thumbnail gelöscht wird → `thumbnail_url` auf `null` setzen → Default-Icon verwenden

### Speicherung:
- **Lokaler Speicher:** `backend/uploads/thumbnails/tasks/` und `backend/uploads/thumbnails/rewards/`
- **Oder:** Cloud-Storage (S3, etc.) - je nach Deployment-Strategie
- **Dateinamen:** UUID-basiert oder `{task_id}.png` / `{reward_id}.png`

---

## 8. Implementierungsreihenfolge (Empfehlung)

1. **Datenbank-Migration** erstellen und ausführen
2. **Backend-Upload-Endpoints** implementieren
3. **Backend-Services** erweitern (thumbnail_url in Queries)
4. **Frontend API-Client** erweitern
5. **Admin-Formulare** erweitern (Upload-Felder)
6. **Frontend-Anzeige-Logik** implementieren (Thumbnail vs. Default-Icon)
7. **CSS-Anpassungen** für Thumbnail-Bilder
8. **Testing** und Validierung

---

## 9. Offene Fragen / Entscheidungen

1. **Bildverarbeitung:** Soll das Backend automatisch Thumbnails auf 48x48px zuschneiden/resizen?
2. **Aspect-Ratio:** Sollen Thumbnails quadratisch sein oder Aspect-Ratio beibehalten?
3. **Speicherort:** Lokaler Speicher oder Cloud-Storage?
4. **Löschen:** Soll beim Löschen eines Tasks/Rewards auch das Thumbnail gelöscht werden?
5. **Karten-Marker:** Sollen Thumbnails auch auf der Karte (UserLocationMap) verwendet werden?
