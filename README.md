# Calendar Clock Card

Eine eigenständige Home-Assistant-Lovelace-Custom-Card: analoge Uhr mit zwei Ereignisringen und Terminwechsel durch horizontales Wischen **nur im mittleren Textbereich**.

## Installation über HACS (manuell hinzugefügtes Repository)

1. Lege dieses Repository auf GitHub an und lade die Dateien aus diesem Projekt in das Repository-Root hoch.
2. In HACS: **Frontend → ⋮ → Benutzerdefinierte Repositories**.
3. Repository-URL eintragen, Kategorie **Dashboard** auswählen und hinzufügen.
4. Die Karte installieren und Home Assistant bzw. den Browser neu laden.

## Manuelle Installation

1. `calendar-clock-card.js` nach `/config/www/` kopieren.
2. Unter **Einstellungen → Dashboards → Ressourcen** hinzufügen:
   - URL: `/local/calendar-clock-card.js`
   - Typ: `JavaScript-Modul`

## Lovelace-Konfiguration

```yaml
type: custom:calendar-clock-card
entity: sensor.famalywall_tageskalender
```

## Verhalten

- Wischen nach links: nächster Termin.
- Wischen nach rechts: vorheriger Termin.
- Funktioniert mit Touch und mit gedrückter linker Maustaste.
- Nur der Textbereich in der Mitte reagiert auf horizontale Wischbewegungen.
- Die Auswahl wird lokal in der Karte gehalten. `input_number.kalender_auswahl` wird nicht verändert.
- Erwartet ein `events`-Attribut als Array oder als JSON-String mit Objekten, die `start`, `end`, `summary` und optional `all_day` enthalten.

## Hinweis

Die Zeitringe werden für den lokalen Kalendertag gezeichnet. Ganztägige Ereignisse ohne Zeitanteil werden entsprechend dem gelieferten Start-/Endzeitraum dargestellt.
