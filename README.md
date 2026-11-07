# Calendar Clock Card

Analoge Home-Assistant-Kalenderuhr mit zwei Zeitringen, farbigen Terminbalken, Beschriftungen außerhalb des Zifferblatts und Wischsteuerung im Zentrum.

## Installation / Update
- HACS: Repository als Dashboard-Custom-Repository hinzufügen und die Karte installieren bzw. aktualisieren.
- Für ein Update: `calendar-clock-card.js` ersetzen, einen neuen GitHub-Release erstellen und in HACS aktualisieren.

## Lovelace
```yaml
type: custom:calendar-clock-card
entity: sensor.famalywall_tageskalender
```

## Funktionen
- Links/rechts wischen im mittleren Textbereich (Touch und Maus).
- Die Auswahl bleibt lokal in der Karte; kein Helfer wird verändert.
- Jeder Termin erhält eine eigene Farbe.
- Ganztägige Termine werden transparent und gestrichelt dargestellt.
- Außenbeschriftungen zeigen gekürzten Titel und Uhrzeit; links/rechts getrennte Spalten und vertikale Verteilung vermeiden Textüberlappungen.
- Erwartet `events` als Array oder JSON-String mit `start`, `end`, `summary` und optional `all_day`.
