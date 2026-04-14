# TICKET-066: Belohnungen – Reward-Namen in Karten abgeschnitten / falscher Umbruch

**Typ:** Bug

**Status:** umgesetzt

**Verifikation:** 2026-04-12: `RewardCard` Titelzeile mit `.reward-title-row`, `overflow-wrap`/flex `min-width: 0` für vollständigen Umbruch.

**PDF-Bug:** 011

**Abgleich:** [TICKET-049-responsive-layout-teams-contests-rewards.md](TICKET-049-responsive-layout-teams-contests-rewards.md) nennt generell Textabschnitt in Belohnungen; dieses Ticket **konkretisiert Reward-Titel** (z. B. „Shoppingrabatt“).

**Priorität (laut PDF):** Hoch

**Beschreibung:**
Titel müssen vollständig lesbar sein oder kontrolliert gekürzt (Line-Clamp + Tooltip/Detail), ohne abgeschnittene Wörter.

**Quelle:** PDF Bug-tracker, Bug 011.
