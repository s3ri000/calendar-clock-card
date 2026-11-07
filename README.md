# Calendar Clock Card v1.2.0

Analoge Home-Assistant-Kalenderuhr mit zwei Zeitringen, farbigen Terminbalken, gut lesbaren Außenbeschriftungen und Wischsteuerung im Zentrum.

## Update über GitHub und HACS
1. Die drei Dateien aus diesem ZIP in das Stammverzeichnis des GitHub-Repositories hochladen und die vorhandene `calendar-clock-card.js` ersetzen.
2. Einen GitHub-Release mit Tag `v1.2.0` und Titel `Calendar Clock Card v1.2.0` veröffentlichen.
3. In HACS die Karte aktualisieren. Danach das Dashboard im Browser mit `Strg + F5` neu laden.

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
- Terminbeschriftungen stehen in äußeren linken/rechten Spalten mit farbigen Verbindungslinien.
- Beschriftungen werden pro Seite vertikal verteilt; bei sehr vielen Terminen wird der Abstand automatisch angepasst.
- Erwartet `events` als Array oder JSON-String mit `start`, `end`, `summary` und optional `all_day`.
