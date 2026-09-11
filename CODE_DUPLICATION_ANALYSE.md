# Code-Duplikation Analyse

## 1. Upload-Controller (Backend)

### Problem
Die Upload-Controller in `task.controller.ts` und `reward.controller.ts` sind identisch:

**Dupliziert:**
- `uploadPhoto` (task.controller.ts:183-190)
- `uploadVideo` (task.controller.ts:192-199)
- `uploadThumbnail` (task.controller.ts:201-207)
- `uploadThumbnail` (reward.controller.ts:279-286)

**Gleiche Struktur:**
```typescript
export const uploadX: RequestHandler = asyncHandler(async (req, res) => {
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = await uploadXService(file);
  res.json({ x_url: url });
});
```

**Lösung:** Generischer Upload-Controller erstellen

---

## 2. Upload-Services (Backend)

### Problem
Alle Upload-Services haben identische Logik:

**Dupliziert:**
- `uploadPhoto` (task.service.ts:888-895)
- `uploadVideo` (task.service.ts:897-901)
- `uploadThumbnail` (task.service.ts:903-907)
- `uploadThumbnail` (reward.service.ts:814-818)

**Gleiche Logik:**
```typescript
export async function uploadX(file: Express.Multer.File): Promise<string> {
  const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5001';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/uploads/${file.filename}`;
}
```

**Lösung:** Gemeinsame Utility-Funktion erstellen

---

## 3. Multer-Konfigurationen (Backend)

### Problem
Multer-Konfigurationen sind sehr ähnlich:

**Dupliziert:**
- `photoStorage` (task.routes.ts:22-30)
- `videoStorage` (task.routes.ts:46-54)
- `thumbnailStorage` (task.routes.ts:68-76)
- `thumbnailStorage` (reward.routes.ts:25-33)

**Gleiche Struktur:**
```typescript
const xStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'prefix-' + uniqueSuffix + path.extname(file.originalname));
  },
});
```

**Lösung:** Factory-Funktion für Multer-Storage erstellen

---

## 4. Frontend Thumbnail-Upload-Logik

### Problem
Thumbnail-Upload-Logik ist in `handlePublishTask` und `handlePublishReward` dupliziert:

**Dupliziert:**
- `handlePublishTask` (AdminPage.tsx:3741-3752)
- `handlePublishReward` (AdminPage.tsx:4088-4102)

**Gleiche Logik:**
```typescript
let thumbnailUrl: string | null = form.thumbnailUrl ?? null;
if (form.thumbnailFile) {
  try {
    const uploadResult = await api.uploadXThumbnail(form.thumbnailFile);
    thumbnailUrl = uploadResult.thumbnail_url;
  } catch (error: any) {
    setMessage({ type: 'error', text: error?.message || 'Failed to upload thumbnail.' });
    return;
  }
}
if (!form.thumbnailFile && !form.thumbnailUrl) {
  thumbnailUrl = null;
}
```

**Lösung:** Gemeinsame Hook oder Utility-Funktion erstellen

---

## 5. OAuth-Strategien (Backend)

### Problem
OAuth-Strategien haben ähnliche Struktur, aber bereits teilweise refactored:

**Bereits refactored:**
- `createOAuthCallback` (oauth.ts:48-79) - eliminiert Duplikation in Callbacks
- `handleOAuthUser` (passport.ts:26-83) - eliminiert Duplikation in User-Erstellung

**Verbleibende Duplikation:**
- Profile-Daten-Extraktion in jeder Strategy (GitHub, Google, Facebook, Apple)
- Fehlerbehandlung ist ähnlich

**Lösung:** Weitere Abstraktion für Profile-Extraktion

---

---

## 6. OAuth Auth-Handler (Backend)

### Problem
OAuth Auth-Handler sind sehr ähnlich:

**Dupliziert:**
- `githubAuth` (auth.controller.ts:326-337)
- `googleAuth` (auth.controller.ts:344-355)
- `facebookAuth` (auth.controller.ts:362-373)
- `appleAuth` (auth.controller.ts:380-390)

**Gleiche Struktur:**
```typescript
export function xAuth(req: Request, res: Response, next: any) {
  if (!process.env.X_CLIENT_ID || !process.env.X_CLIENT_SECRET) {
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_not_configured`);
  }
  
  try {
    passport.authenticate('x', { scope: [...] })(req, res, next);
  } catch (error: any) {
    console.error('X OAuth error:', error);
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_failed`);
  }
}
```

**Lösung:** Factory-Funktion für OAuth Auth-Handler erstellen

---

## 7. Location-Validierung (Backend)

### Problem
Location-Validierung ist in `createTask` und `createReward` identisch:

**Dupliziert:**
- `createTask` (task.controller.ts:78-88)
- `createReward` (reward.controller.ts:39-47)

**Gleiche Logik:**
```typescript
const locationId = payload.locationId ?? payload.location_id;
if (!locationId || typeof locationId !== 'string') {
  return res.status(400).json({ error: 'locationId is required.' });
}
const { getLocationById } = await import('../services/location.service.js');
const location = await getLocationById(locationId);
if (!location) {
  return res.status(400).json({ error: 'Invalid locationId.' });
}
payload.location_id = location.id;
```

**Lösung:** Middleware oder Utility-Funktion für Location-Validierung

---

## 8. Active-Flag-Validierung (Backend)

### Problem
Active-Flag-Validierung ist in `createTask` und `createReward` identisch:

**Dupliziert:**
- `createTask` (task.controller.ts:60-62)
- `createReward` (reward.controller.ts:35-37)
- `updateTask` (task.controller.ts:111-113)
- `updateReward` (reward.controller.ts:72-74)

**Gleiche Logik:**
```typescript
if (payload.active !== undefined && typeof payload.active !== 'boolean') {
  return res.status(400).json({ error: 'Active flag must be a boolean value' });
}
```

**Lösung:** Validierungs-Middleware oder Utility-Funktion

---

## Priorität

1. **Hoch:** Upload-Services (4x identisch)
2. **Hoch:** Upload-Controller (4x identisch)
3. **Mittel:** Multer-Konfigurationen (4x ähnlich)
4. **Mittel:** Frontend Thumbnail-Upload (2x identisch)
5. **Mittel:** Location-Validierung (2x identisch)
6. **Mittel:** Active-Flag-Validierung (4x identisch)
7. **Niedrig:** OAuth Auth-Handler (4x ähnlich)
8. **Niedrig:** OAuth-Strategien (bereits teilweise refactored)
