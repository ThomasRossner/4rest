# Fehlende Übersetzungen - Vollständige Analyse

## Zusammenfassung
**Total verwendete Admin-Übersetzungsschlüssel:** 593
**Tatsächlich fehlende Übersetzungen:** 7
- **Deutsch (DE):** 6 fehlend
- **Englisch (EN):** 1 fehlend

---

## ✅ BEREITS VORHANDEN (aber möglicherweise nicht gefunden)

### Admin Confirm Dialoge
- ✅ `admin.confirm.deleteTask` - Vorhanden (DE: Zeile 1123, EN: vorhanden)
- ✅ `admin.confirm.deleteTasks` - Vorhanden (DE: Zeile 1122, EN: vorhanden)
- ✅ `admin.confirm.deleteTaskSingle.title` - Vorhanden (DE: Zeile 1133, EN: vorhanden)
- ✅ `admin.confirm.deleteTaskSingle.description` - Vorhanden (DE: Zeile 1134, EN: vorhanden)
- ✅ `admin.confirm.deleteSelectedTasks.title` - Vorhanden (DE: Zeile 1129, EN: vorhanden)
- ✅ `admin.confirm.deleteSelectedTasks.description` - Vorhanden (DE: Zeile 1130, EN: vorhanden)
- ✅ `admin.confirm.deleteReward` - Vorhanden (DE: Zeile 1125, EN: vorhanden)
- ✅ `admin.confirm.deleteRewards` - Vorhanden (DE: Zeile 1124, EN: vorhanden)
- ✅ `admin.confirm.deleteRewardSingle.title` - Vorhanden (DE: Zeile 1141, EN: vorhanden)
- ✅ `admin.confirm.deleteRewardSingle.description` - Vorhanden (DE: Zeile 1142, EN: vorhanden)
- ✅ `admin.confirm.deleteSelectedRewards.title` - Vorhanden (DE: Zeile 1137, EN: vorhanden)
- ✅ `admin.confirm.deleteSelectedRewards.description` - Vorhanden (DE: Zeile 1138, EN: vorhanden)
- ✅ `admin.confirm.deleteLocation` - Vorhanden (DE: Zeile 1127, EN: vorhanden)
- ✅ `admin.confirm.deleteLocations` - Vorhanden (DE: Zeile 1126, EN: vorhanden)
- ✅ `admin.confirm.deleteSelectedLocations.title` - Vorhanden (DE: Zeile 1145, EN: vorhanden)
- ✅ `admin.confirm.deleteSelectedLocations.description` - Vorhanden (DE: Zeile 1146, EN: vorhanden)

### Admin Reward
- ✅ `admin.reward.saveChanges` - Vorhanden (DE: Zeile 785, EN: vorhanden)
- ✅ `admin.reward.saving` - Vorhanden (DE: Zeile 784, EN: vorhanden)
- ✅ `admin.reward.publishButton` - Vorhanden (DE: Zeile 783, EN: vorhanden)
- ✅ `admin.reward.publishing` - Vorhanden (DE: Zeile 782, EN: vorhanden)

### Admin Task Recurrence
- ✅ `admin.task.recurrence.typeLabel` - Vorhanden (DE: Zeile 633, EN: fehlt!)

### Admin Actions
- ✅ `admin.actions.manageUsers.title` - Vorhanden (DE: Zeile 375, EN: vorhanden)
- ✅ `admin.actions.manageUsers.description` - Vorhanden (DE: Zeile 376, EN: vorhanden)

---

## ❌ TATSÄCHLICH FEHLENDE ÜBERSETZUNGEN

### 1. Admin Fields (EN fehlt)
- ❌ `admin.fields.required` 
  - DE: ✅ "Pflichtfeld" (vorhanden, Zeile 1112)
  - EN: ✅ "Required field" (vorhanden, Zeile 1113) - **KORREKTUR: Vorhanden!**
  - **Verwendung:** FieldLabel Komponente

- ❌ `admin.fields.readOnly`
  - DE: ✅ "Nur lesen" (vorhanden, Zeile 1113)
  - EN: ✅ "Read only" (vorhanden, Zeile 1114) - **KORREKTUR: Vorhanden!**
  - **Verwendung:** FieldLabel Komponente

### 2. Admin Task (DE fehlt - 6 Übersetzungen)
- ❌ `admin.task.createLocation`
  - DE: ❌ fehlt
  - EN: ✅ "Create a location" (vorhanden, Zeile 721)
  - **Verwendung:** Button in Task-Form wenn keine Locations vorhanden (AdminPage.tsx Zeile 5623, 6432)

- ❌ `admin.task.saveChanges`
  - DE: ❌ fehlt
  - EN: ✅ "Save Task Changes" (vorhanden, Zeile 725)
  - **Verwendung:** Button-Text beim Bearbeiten von Tasks (AdminPage.tsx Zeile 4529)

- ❌ `admin.task.saving`
  - DE: ❌ fehlt
  - EN: ✅ "Saving…" (vorhanden, Zeile 724)
  - **Verwendung:** Loading-Text beim Speichern von Tasks (AdminPage.tsx Zeile 4528)

- ❌ `admin.task.publishButton`
  - DE: ❌ fehlt
  - EN: ✅ "Publish Task" (vorhanden, Zeile 723)
  - **Verwendung:** Button-Text beim Erstellen von Tasks (AdminPage.tsx Zeile 4532)

- ❌ `admin.task.publishing`
  - DE: ❌ fehlt
  - EN: ✅ "Publishing…" (vorhanden, Zeile 722)
  - **Verwendung:** Loading-Text beim Veröffentlichen von Tasks (AdminPage.tsx Zeile 4531)

- ❌ `admin.task.untitled`
  - DE: ❌ fehlt
  - EN: ✅ "Untitled task" (vorhanden, Zeile 726)
  - **Verwendung:** Fallback-Text wenn Task keinen Titel hat (AdminPage.tsx Zeile 7381)

### 3. Admin Task Recurrence (EN fehlt)
- ❌ `admin.task.recurrence.typeLabel`
  - DE: ✅ "Wiederholungstyp" (vorhanden, Zeile 633)
  - EN: ❌ fehlt (in recurrence Objekt vorhanden, aber nicht unter `admin.task.recurrence.typeLabel`)
  - **Verwendung:** Label für Recurrence-Type Dropdown (AdminPage.tsx Zeile 6055)
  - **Hinweis:** EN hat `admin.reward.recurrence.typeLabel` (Zeile 767), aber nicht `admin.task.recurrence.typeLabel`

---

## 📋 ZUSAMMENFASSUNG DER FEHLENDEN ÜBERSETZUNGEN

### Deutsch (DE) - 6 fehlend:
1. `admin.task.createLocation` - "Standort erstellen"
2. `admin.task.saveChanges` - "Änderungen speichern"
3. `admin.task.saving` - "Wird gespeichert…"
4. `admin.task.publishButton` - "Aufgabe veröffentlichen"
5. `admin.task.publishing` - "Wird veröffentlicht…"
6. `admin.task.untitled` - "Unbenannte Aufgabe"

### Englisch (EN) - 1 fehlend:
1. `admin.task.recurrence.typeLabel` - "Recurrence type"
   - **Hinweis:** `admin.reward.recurrence.typeLabel` existiert (Zeile 767), aber `admin.task.recurrence.typeLabel` fehlt

---

## 🔍 WEITERE ZU ÜBERPRÜFENDE BEREICHE

### Dynamische Übersetzungsschlüssel
Diese werden dynamisch generiert und sollten in beiden Sprachen vorhanden sein:
- `admin.task.recurrence.once` - "Einmal" / "Once"
- `admin.task.recurrence.daily` - "Täglich" / "Daily"
- `admin.task.recurrence.weekly` - "Wöchentlich" / "Weekly"
- `admin.task.recurrence.monthly` - "Monatlich" / "Monthly"
- `admin.users.roles.guest` - "Gast" / "Guest"
- `admin.users.roles.employee` - "Mitarbeiter" / "Employee"
- `admin.users.roles.administrator` - "Administrator" / "Administrator"
- `admin.users.roles.stakeholder` - "Stakeholder" / "Stakeholder"

### Potenzielle weitere fehlende Schlüssel
- `admin.task.prerequisites.modal.noSelection` - Prüfen ob vorhanden
- `admin.task.prerequisites.modal.noSelectionMulti` - Prüfen ob vorhanden
- `admin.task.prerequisites.modal.selectedCount` - Prüfen ob vorhanden
- `admin.task.survey.typeMixed` - Prüfen ob vorhanden
- `admin.task.survey.typeSingleChoiceOnly` - Prüfen ob vorhanden
- `admin.task.survey.typeMultipleChoiceOnly` - Prüfen ob vorhanden
- `admin.task.survey.typeTextOnly` - Prüfen ob vorhanden
- `admin.task.survey.typeRatingOnly` - Prüfen ob vorhanden

