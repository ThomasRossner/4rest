# Erweiterte Code-Duplikation Analyse

Diese Analyse erweitert die bestehende `CODE_DUPLICATION_ANALYSE.md` um Frontend-Duplikationen und weitere Backend-Duplikationen.

## Frontend-Duplikationen

### 1. Management-Tabellen-Struktur (KRITISCH - HOCHSTE PRIORITÄT)

**Problem:** Identische Tabellen-Strukturen für verschiedene Entitäten mit nur unterschiedlichen CSS-Präfixen.

**Dupliziert in:**
- `AdminPage.tsx`: Task-Management-Tabelle (Zeilen ~8265-8579)
- `AdminPage.tsx`: Reward-Management-Tabelle (Zeilen ~8582-9000+)
- `AdminPage.tsx`: Location-Management-Tabelle (Zeilen ~8000-8139)
- `UserManagement.tsx`: User-Management-Tabelle (Zeilen ~422-600)
- `TeamManagement.tsx`: Team-Management-Tabelle (Zeilen ~622-733)
- `ContestManagement.tsx`: Contest-Management-Tabelle (Zeilen ~626-750+)
- `RedaktionPage.tsx`: Location-Management (vereinfacht, Zeilen ~134-233)

**Gemeinsame Struktur:**
```typescript
// Checkbox-Spalte
<th><input type="checkbox" className="{prefix}-checkbox" checked={allSelected} onChange={...} /></th>

// Name/Title-Spalte
<th>Name/Title</th>

// Status-Spalte
<th>Status</th>
<td><span className="{prefix}-status-badge {active ? 'active' : 'inactive'}">{status}</span></td>

// Actions-Spalte
<th>Actions</th>
<td>
  <div className="{prefix}-bulk-buttons">
    <button onClick={() => edit(id)}>Bearbeiten</button>
    <button onClick={() => toggleStatus(id)}>Aktivieren/Deaktivieren</button>
    <button onClick={() => delete(id)}>Löschen</button>
  </div>
</td>
```

**Lösung:** 
- Generische `ManagementTable` Komponente erstellen
- Props: `items`, `columns`, `onSelect`, `onEdit`, `onToggleStatus`, `onDelete`, `cssPrefix`
- Column-Definitionen als Konfiguration

---

### 2. Bulk-Operationen-Logik (HOCH)

**Problem:** Identische Logik für Bulk-Status-Änderungen und Bulk-Löschungen.

**Dupliziert in:**
- `AdminPage.tsx`: `handleTaskBulkStatus`, `handleTaskBulkDelete` (Zeilen ~4360-4411)
- `AdminPage.tsx`: `handleRewardBulkStatus`, `handleRewardBulkDelete` (Zeilen ~4461-4520)
- `AdminPage.tsx`: `handleLocationBulkStatus`, `handleLocationBulkDelete` (Zeilen ~4570-4622)
- `UserManagement.tsx`: `handleUserBulkStatus`, `handleUserBulkDelete` (Zeilen ~223-272)
- `TeamManagement.tsx`: `handleTeamBulkStatus`, `handleTeamBulkDelete` (Zeilen ~370-399)
- `ContestManagement.tsx`: `handleContestBulkStatus`, `handleContestBulkDelete` (Zeilen ~365-394)

**Gleiche Logik:**
```typescript
const handleXBulkStatus = async (active: boolean) => {
  if (!selectedXIds.length) return;
  try {
    setXManagementMessage(null);
    await api.bulkUpdateXStatus(selectedXIds, active);
    setXManagementMessage({ type: 'success', text: ... });
    setSelectedXIds([]);
    await refetchX();
  } catch (error) {
    setXManagementMessage({ type: 'error', text: ... });
  }
};

const handleXBulkDelete = async () => {
  if (!selectedXIds.length) return;
  setXConfirm({ visible: true, ... });
};
```

**Lösung:**
- Custom Hook: `useBulkOperations<T>(entityType, apiCalls, refetch)`
- Generische Bulk-Operation-Komponente

---

### 3. Filter-State-Management (HOCH)

**Problem:** Identische Filter-State-Variablen und -Logik für verschiedene Entitäten.

**Dupliziert in:**
- `AdminPage.tsx`: Task-Filter (Zeilen ~2543-2552)
  - `taskFilterLocation`, `taskFilterStatus`, `taskFilterRecurrence`, `taskFilterType`, `taskFilterTitle`, `taskFilterPointsMin`, `taskFilterPointsMax`
- `AdminPage.tsx`: Reward-Filter (Zeilen ~2571-2580)
  - `rewardFilterLocation`, `rewardFilterStatus`, `rewardFilterRecurrence`, `rewardFilterType`, `rewardFilterTitle`, `rewardFilterCostMin`, `rewardFilterCostMax`
- `AdminPage.tsx`: Location-Filter (vereinfacht)
- `RedaktionPage.tsx`: Location-Filter (Zeilen ~31-32)
  - `locationFilterStatus`, `locationFilterName`
- `TeamManagement.tsx`: Team-Filter (Zeilen ~35-37)
  - `teamFilterStatus`, `teamFilterName`, `teamFilterCreator`
- `ContestManagement.tsx`: Contest-Filter (ähnlich)

**Gleiche Struktur:**
```typescript
const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | null>(null);
const [filterName, setFilterName] = useState<string>('');
const [filterLocation, setFilterLocation] = useState<string | null>(null);
// ... weitere Filter

const filteredItems = useMemo(() => {
  let filtered = items;
  if (filterStatus) filtered = filtered.filter(item => item.active === (filterStatus === 'active'));
  if (filterName) filtered = filtered.filter(item => item.name?.toLowerCase().includes(filterName.toLowerCase()));
  // ...
  return filtered;
}, [items, filterStatus, filterName, ...]);
```

**Lösung:**
- Custom Hook: `useEntityFilters<T>(items, filterConfig)`
- Filter-Konfiguration als Objekt definieren

---

### 4. Management-Message-State (MITTEL)

**Problem:** Identische Message-State-Struktur für verschiedene Entitäten.

**Dupliziert in:**
- `AdminPage.tsx`: `taskManagementMessage`, `rewardManagementMessage`, `locationManagementMessage`
- `UserManagement.tsx`: `userManagementMessage`
- `TeamManagement.tsx`: `teamManagementMessage`
- `ContestManagement.tsx`: `contestManagementMessage`

**Gleiche Struktur:**
```typescript
const [xManagementMessage, setXManagementMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

// Verwendung:
{xManagementMessage && (
  <p className={xManagementMessage.type === 'error' ? '{prefix}-error' : '{prefix}-success'}>
    {xManagementMessage.text}
  </p>
)}
```

**Lösung:**
- Custom Hook: `useManagementMessage()`
- Oder: Teil der generischen Management-Komponente

---

### 5. Selection-State-Management (MITTEL)

**Problem:** Identische Selection-Logik für verschiedene Entitäten.

**Dupliziert in:**
- `AdminPage.tsx`: `selectedTaskIds`, `selectedRewardIds`, `selectedLocationIds`
- `UserManagement.tsx`: `selectedUserIds`
- `TeamManagement.tsx`: `selectedTeamIds`
- `ContestManagement.tsx`: `selectedContestIds`
- `RedaktionPage.tsx`: `selectedLocationIds`

**Gleiche Logik:**
```typescript
const [selectedXIds, setSelectedXIds] = useState<string[]>([]);

const toggleXSelection = (id: string, checked: boolean) => {
  setSelectedXIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
};

const allXSelected = selectedXIds.length === filteredX.length && filteredX.length > 0;
```

**Lösung:**
- Custom Hook: `useSelection<T>()`

---

### 6. Include-Inactive-State (MITTEL)

**Problem:** Identischer State für "Inaktive anzeigen" Checkbox.

**Dupliziert in:**
- `AdminPage.tsx`: `includeInactiveTasks`, `includeInactiveRewards`, `includeInactiveLocations`
- `UserManagement.tsx`: `includeInactiveUsers`
- `TeamManagement.tsx`: `includeInactiveTeams`
- `ContestManagement.tsx`: `includeInactiveContests`
- `RedaktionPage.tsx`: `includeInactiveLocations`

**Gleiche Struktur:**
```typescript
const [includeInactiveX, setIncludeInactiveX] = useState(false);

// In useQuery:
enabled: mode === 'xManage',
queryKey: ['adminX', includeInactiveX],

// In UI:
<label className="{prefix}-toggle">
  <input type="checkbox" checked={includeInactiveX} onChange={...} />
  <span>Inaktive anzeigen</span>
</label>
```

**Lösung:**
- Teil der generischen Management-Komponente oder Custom Hook

---

### 7. Edit-State-Management (MITTEL)

**Problem:** Identische Edit-State-Logik für verschiedene Entitäten.

**Dupliziert in:**
- `AdminPage.tsx`: `isEditingTask`, `editingTaskId`, `isEditingReward`, `editingRewardId`
- `TeamManagement.tsx`: `isCreatingTeam`, `editingTeamId`
- `ContestManagement.tsx`: `isCreatingContest`, `editingContestId`

**Gleiche Struktur:**
```typescript
const [isEditingX, setIsEditingX] = useState(false);
const [editingXId, setEditingXId] = useState<string | null>(null);

const startXEdit = (x: XType) => {
  setEditingXId(x.id);
  setIsEditingX(true);
  // ... Formular laden
};

const cancelXEdit = () => {
  setEditingXId(null);
  setIsEditingX(false);
  // ... Formular zurücksetzen
};
```

**Lösung:**
- Custom Hook: `useEntityEdit<T>()`

---

### 8. FilterDropdown-Komponente (MITTEL)

**Problem:** `FilterDropdown` ist in `AdminPage.tsx` definiert (Zeilen ~323-587), aber es gibt auch eine separate `FilterDropdown.tsx` Komponente.

**Dupliziert:**
- `AdminPage.tsx`: Lokale `FilterDropdown` Komponente (Zeilen ~323-587)
- `components/Filters/FilterDropdown.tsx`: Separate Komponente

**Lösung:**
- Eine zentrale `FilterDropdown` Komponente verwenden
- Lokale Definition aus `AdminPage.tsx` entfernen

---

### 9. MobileFilterModal-Komponente (MITTEL)

**Problem:** `MobileFilterModal` ist nur in `AdminPage.tsx` definiert (Zeilen ~589-973), wird aber für Tasks und Rewards verwendet.

**Dupliziert:**
- `AdminPage.tsx`: `MobileFilterModal` für Tasks (Zeilen ~8541-8578)
- `AdminPage.tsx`: `MobileFilterModal` für Rewards (ähnliche Struktur)

**Lösung:**
- `MobileFilterModal` in separate Datei auslagern
- Generisch für alle Entitäten verwenden

---

### 10. ConfirmDialog-Komponente (MITTEL)

**Problem:** `ConfirmDialog` ist in `AdminPage.tsx` definiert (Zeilen ~2477-2513), wird aber für verschiedene Aktionen verwendet.

**Dupliziert:**
- `AdminPage.tsx`: `taskConfirm`, `rewardConfirm`, `locationConfirm`, `teamConfirm`, `contestConfirm`
- `TeamManagement.tsx`: `teamConfirmDialog` (eigene Implementierung)
- `ContestManagement.tsx`: `contestConfirmDialog` (eigene Implementierung)

**Gleiche Struktur:**
```typescript
const [xConfirm, setXConfirm] = useState<ConfirmDialogState>({
  visible: false,
  title: '',
  description: '',
  confirmLabel: '',
  onConfirm: () => {},
});
```

**Lösung:**
- `ConfirmDialog` in separate Datei auslagern
- Custom Hook: `useConfirmDialog()`

---

### 11. CSS-Präfix-Duplikation (HOCH)

**Problem:** Identische CSS-Klassen mit unterschiedlichen Präfixen.

**Dupliziert in:**
- `AdminPage.css`: `.admin-section`, `.admin-section-header`, `.admin-actions`, `.admin-icon-button`, `.admin-action-button`, `.admin-table`, `.admin-status-badge`, etc.
- `RedaktionPage.css`: `.redaktion-section`, `.redaktion-section-header`, `.redaktion-actions`, `.redaktion-icon-button`, `.redaktion-action-button`, `.redaktion-status-badge`, etc.
- `RezeptionPage.css`: `.rezeption-section`, `.rezeption-section-header`, `.rezeption-actions`, etc.

**Gleiche Struktur:**
```css
.{prefix}-section { ... }
.{prefix}-section-header { ... }
.{prefix}-actions { ... }
.{prefix}-icon-button { ... }
.{prefix}-action-button { ... }
.{prefix}-table { ... }
.{prefix}-status-badge { ... }
.{prefix}-status-badge.active { ... }
.{prefix}-status-badge.inactive { ... }
```

**Lösung:**
- CSS-Variablen für Präfixe verwenden
- Oder: Gemeinsame Basis-Klassen + Präfix-Modifikatoren
- Oder: CSS-in-JS mit Theme-Provider

---

### 12. Icon-Helper-Komponente (NIEDRIG)

**Problem:** Identische `Icon` Helper-Komponente in mehreren Dateien.

**Dupliziert in:**
- `AdminPage.tsx`: `Icon` Komponente (Zeilen ~237-251)
- `RedaktionPage.tsx`: `Icon` Komponente (Zeilen ~15-22)
- `RezeptionPage.tsx`: `Icon` Komponente (Zeilen ~20-27)
- `TeamManagement.tsx`: `Icon` Komponente (Zeilen ~17-24)
- `ContestManagement.tsx`: `Icon` Komponente (ähnlich)

**Gleiche Struktur:**
```typescript
const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    back: '←',
    refresh: '↻',
    close: '×',
  };
  return <span>{icons[name] || name}</span>;
};
```

**Lösung:**
- Zentrale `Icon` Komponente in `components/Icons/Icon.tsx`

---

### 13. Header-Struktur (MITTEL)

**Problem:** Identische Header-Struktur für Management-Seiten.

**Dupliziert in:**
- `AdminPage.tsx`: Task-Management-Header (Zeilen ~8142-8174)
- `AdminPage.tsx`: Reward-Management-Header (Zeilen ~8583-8615)
- `RedaktionPage.tsx`: Location-Management-Header (Zeilen ~135-161)
- `TeamManagement.tsx`: Header (Zeilen ~418-453)
- `ContestManagement.tsx`: Header (ähnlich)

**Gleiche Struktur:**
```typescript
<header className="{prefix}-section-header">
  <div>
    <h2>{title}</h2>
    <p>{subtitle}</p>
  </div>
  <div className="{prefix}-actions">
    <button className="{prefix}-icon-button" onClick={refetch}>Refresh</button>
    <button className="{prefix}-icon-button" onClick={onBack}>Back</button>
  </div>
</header>
```

**Lösung:**
- `ManagementHeader` Komponente erstellen

---

### 14. Management-Card-Struktur (MITTEL)

**Problem:** Identische Management-Card-Struktur.

**Dupliziert in:**
- `AdminPage.tsx`: Task-Management-Card (Zeilen ~8187-8264)
- `AdminPage.tsx`: Reward-Management-Card (Zeilen ~8622-8699)
- `RedaktionPage.tsx`: Location-Management-Card (Zeilen ~168-231)

**Gleiche Struktur:**
```typescript
<div className="{prefix}-management-card">
  <div className="{prefix}-management-top">
    <div>
      <h3>{existing.title}</h3>
      <p>{existing.subtitle}</p>
    </div>
    <div className="{prefix}-management-controls">
      <label className="{prefix}-toggle">
        <input type="checkbox" checked={includeInactive} onChange={...} />
        <span>Inaktive anzeigen</span>
      </label>
      {/* Filter-Button, New-Button */}
    </div>
  </div>
  {/* Message */}
  {/* Bulk-Actions */}
  {/* Table */}
</div>
```

**Lösung:**
- `ManagementCard` Komponente erstellen

---

### 15. Bulk-Actions-Bar (MITTEL)

**Problem:** Identische Bulk-Actions-Bar-Struktur.

**Dupliziert in:**
- `AdminPage.tsx`: Task-Bulk-Actions (Zeilen ~8234-8264)
- `AdminPage.tsx`: Reward-Bulk-Actions (Zeilen ~8669-8699)
- `UserManagement.tsx`: User-Bulk-Actions (ähnlich)
- `TeamManagement.tsx`: Team-Bulk-Actions (Zeilen ~587-619)
- `ContestManagement.tsx`: Contest-Bulk-Actions (ähnlich)

**Gleiche Struktur:**
```typescript
<div className="{prefix}-management-actions">
  <div className="{prefix}-bulk-buttons">
    <button onClick={() => handleBulkStatus(true)} disabled={!hasSelection}>Aktivieren</button>
    <button onClick={() => handleBulkStatus(false)} disabled={!hasSelection}>Deaktivieren</button>
    <button onClick={handleBulkDelete} disabled={!hasSelection}>Löschen</button>
  </div>
  <span className="{prefix}-selection-count">
    {hasSelection ? `${count} ausgewählt` : 'Keine Auswahl'}
  </span>
</div>
```

**Lösung:**
- `BulkActionsBar` Komponente erstellen

---

### 16. Type-Icon-Komponenten (NIEDRIG)

**Problem:** Ähnliche Type-Icon-Komponenten für Tasks und Rewards.

**Dupliziert in:**
- `AdminPage.tsx`: `TaskTypeIcon`, `TaskTypeBadge` (Zeilen ~237-270)
- `AdminPage.tsx`: `RewardTypeIcon`, `RewardTypeBadge` (Zeilen ~272-300)

**Gleiche Struktur:**
```typescript
const XTypeIcon = ({ type, thumbnailUrl }: { type: string; thumbnailUrl?: string | null }) => {
  const typeIcon = X_TYPE_ICONS[type] ?? '🧩';
  return thumbnailUrl ? <img src={thumbnailUrl} /> : <span>{typeIcon}</span>;
};

const XTypeBadge = ({ type, thumbnailUrl }: { type: string; thumbnailUrl?: string | null }) => {
  // Ähnliche Logik
};
```

**Lösung:**
- Generische `TypeIcon` und `TypeBadge` Komponenten

---

## Backend-Duplikationen (Ergänzung)

### 17. Bulk-Update-Controller (HOCH)

**Problem:** Ähnliche Bulk-Update-Controller für verschiedene Entitäten.

**Dupliziert in:**
- `task.controller.ts`: `bulkUpdateTasksStatus`, `bulkDeleteTasks`
- `reward.controller.ts`: `bulkUpdateRewardsStatus`, `bulkDeleteRewards` (vermutlich)
- `team.controller.ts`: `bulkUpdateTeamsStatus`, `bulkDeleteTeams` (vermutlich)
- `contest.controller.ts`: `bulkUpdateContestsStatus`, `bulkDeleteContests` (vermutlich)

**Lösung:**
- Generische Bulk-Operation-Middleware oder Controller-Factory

---

### 18. Validierungs-Middleware (MITTEL)

**Problem:** Ähnliche Validierungslogik in verschiedenen Controllern.

**Dupliziert in:**
- `task.controller.ts`: Location-Validierung, Active-Flag-Validierung
- `reward.controller.ts`: Location-Validierung, Active-Flag-Validierung

**Lösung:**
- Validierungs-Middleware erstellen

---

## Priorisierung

### KRITISCH (Sofort modularisieren):
1. **Management-Tabellen-Struktur** - Größte Duplikation, betrifft 6+ Dateien
2. **Bulk-Operationen-Logik** - Betrifft 6+ Dateien
3. **Filter-State-Management** - Betrifft 5+ Dateien
4. **CSS-Präfix-Duplikation** - Betrifft 3+ CSS-Dateien

### HOCH (Bald modularisieren):
5. **Selection-State-Management** - Betrifft 5+ Dateien
6. **Include-Inactive-State** - Betrifft 5+ Dateien
7. **Header-Struktur** - Betrifft 5+ Dateien
8. **Management-Card-Struktur** - Betrifft 3+ Dateien
9. **Bulk-Actions-Bar** - Betrifft 5+ Dateien

### MITTEL (Später modularisieren):
10. **Edit-State-Management** - Betrifft 3+ Dateien
11. **Management-Message-State** - Betrifft 5+ Dateien
12. **FilterDropdown-Komponente** - 2 Definitionen
13. **MobileFilterModal-Komponente** - 1 Definition, mehrfach verwendet
14. **ConfirmDialog-Komponente** - 1 Definition, mehrfach verwendet

### NIEDRIG (Optional):
15. **Icon-Helper-Komponente** - Betrifft 5+ Dateien, aber klein
16. **Type-Icon-Komponenten** - Betrifft 2 Dateien

---

## Empfohlene Modularisierungs-Strategie

1. **Phase 1: Basis-Komponenten**
   - `ManagementTable` - Generische Tabelle
   - `ManagementHeader` - Header-Komponente
   - `ManagementCard` - Card-Wrapper
   - `BulkActionsBar` - Bulk-Actions

2. **Phase 2: Custom Hooks**
   - `useEntityFilters<T>()` - Filter-Logik
   - `useSelection<T>()` - Selection-Logik
   - `useBulkOperations<T>()` - Bulk-Operationen
   - `useEntityEdit<T>()` - Edit-Logik
   - `useManagementMessage()` - Message-State

3. **Phase 3: CSS-Konsolidierung**
   - Gemeinsame Basis-Klassen
   - CSS-Variablen für Präfixe
   - Oder: CSS-in-JS mit Theme

4. **Phase 4: Spezifische Komponenten**
   - `TaskManagement`, `RewardManagement`, etc. als Wrapper um generische Komponenten

---

## Geschätzte Reduktion

- **Aktueller Code:** ~15.000+ Zeilen duplizierter Code
- **Nach Modularisierung:** ~3.000-4.000 Zeilen wiederverwendbarer Code
- **Reduktion:** ~70-80% weniger Code-Duplikation
