# Calendar Clock Card

Analoge Kalenderuhr für Home Assistant Lovelace.

## Konfiguration

```yaml
type: custom:calendar-clock-card
entity: sensor.famalywall_tageskalender
```

Die Karte liest das Attribut `events` des angegebenen Sensors. Unterstützt werden Ereignisse mit `start`, `end`, `summary` und optional `all_day`.

Version 1.3.0: Größere Uhrfläche, feste linke/rechte Beschriftungsspalten, farbige Verbindungslinien, individuelle Terminfarben, transparente ganztägige Termine und lokale Wischsteuerung im Mittelbereich.
