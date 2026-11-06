class CalendarClockCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selected = 0;
    this._start = null;
    this._lastEventsKey = "";
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Bitte eine Kalender-Sensor-Entity angeben.");
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 5; }

  static getConfigElement() { return null; }
  static getStubConfig() {
    return { entity: "sensor.famalywall_tageskalender" };
  }

  _getEvents() {
    const raw = this._hass?.states?.[this._config.entity]?.attributes?.events ?? [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) { return []; }
    }
    return [];
  }

  _escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  _render() {
    if (!this._config || !this._hass) return;

    const events = this._getEvents();
    const eventsKey = events.map(e => `${e.start}|${e.end}|${e.summary}`).join(";");
    if (eventsKey !== this._lastEventsKey) {
      this._lastEventsKey = eventsKey;
      this._selected = Math.max(0, Math.min(this._selected, events.length - 1));
    }
    if (!events.length) this._selected = 0;

    const ev = events[this._selected];
    const now = new Date();
    const cx = 180, cy = 180;

    const point = (r, h) => {
      const a = (h * 30 - 90) * Math.PI / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const arc = (r, s, e) => {
      const p1 = point(r, s), p2 = point(r, e);
      return `M${p1[0]} ${p1[1]} A${r} ${r} 0 ${e-s > 6 ? 1 : 0} 1 ${p2[0]} ${p2[1]}`;
    };

    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    const noon = new Date(midnight);
    noon.setHours(12);
    const tomorrow = new Date(midnight);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let bars = "";
    events.forEach((event, i) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      [
        { from: midnight, to: noon, r: 143, color: "#ff9d32" },
        { from: noon, to: tomorrow, r: 160, color: "#62c8ff" }
      ].forEach(ring => {
        const s = new Date(Math.max(start, ring.from));
        const e = new Date(Math.min(end, ring.to));
        if (e > s) {
          const sh = (s - ring.from) / 3600000;
          const eh = (e - ring.from) / 3600000;
          const selected = i === this._selected;
          bars += `<path d="${arc(ring.r, sh, eh)}" fill="none"
            stroke="${ring.color}" stroke-width="${selected ? 11 : 7}"
            stroke-opacity="${selected ? 1 : .55}" stroke-linecap="round"/>`;
        }
      });
    });

    const marks = Array.from({ length: 60 }, (_, i) => {
      const a = i * Math.PI / 30;
      const r1 = 126, r2 = i % 5 === 0 ? 116 : 121;
      return `<line x1="${cx+r1*Math.sin(a)}" y1="${cy-r1*Math.cos(a)}"
        x2="${cx+r2*Math.sin(a)}" y2="${cy-r2*Math.cos(a)}"
        stroke="#75819b" stroke-width="${i%5 === 0 ? 1.5 : .7}"/>`;
    }).join("");

    const labels = Array.from({ length: 12 }, (_, i) => {
      const n = i === 0 ? 12 : i;
      const p = point(103, i);
      return `<text x="${p[0]}" y="${p[1]+4}" fill="#e4eaf7"
        font-size="12" text-anchor="middle">${n}</text>`;
    }).join("");

    const hour = now.getHours() % 12 + now.getMinutes() / 60;
    const minute = now.getMinutes() / 60;
    const hp = point(55, hour), mp = point(78, minute);

    const title = ev?.summary || "Keine Termine";
    const start = ev ? new Date(ev.start) : null;
    const end = ev ? new Date(ev.end) : null;
    const fmt = d => d?.toLocaleTimeString("de-DE", {
      hour: "2-digit", minute: "2-digit"
    }) || "";
    const timeText = ev?.all_day ? "GANZTÄGIG" : ev ? `${fmt(start)} – ${fmt(end)}` : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        ha-card {
          background: var(--card-background-color, #080e20);
          border-radius: 24px;
          padding: 12px;
          box-shadow: none;
          overflow: hidden;
          color: white;
        }
        .clock { max-width:390px; margin:auto; position:relative; }
        svg { display:block; width:100%; height:auto; }
        .middle {
          position:absolute; top:50%; left:50%;
          transform:translate(-50%,-30%);
          width:48%; min-height:90px; padding:4px;
          box-sizing:border-box; display:flex; flex-direction:column;
          justify-content:center; align-items:center; text-align:center;
          user-select:none; -webkit-user-select:none;
          touch-action:pan-y; cursor:grab;
        }
        .middle:active { cursor:grabbing; }
        .count { font-size:9px; color:#8995ad; letter-spacing:1px; }
        .title { font-size:15px; font-weight:600; color:white; margin-top:7px; overflow-wrap:anywhere; }
        .time { font-size:12px; color:#ffb35d; margin-top:6px; }
        .hint { font-size:9px; color:#75819b; margin-top:8px; }
      </style>
      <ha-card>
        <div class="clock">
          <svg viewBox="0 0 360 360">
            <circle cx="180" cy="180" r="160" fill="none" stroke="#27334e" stroke-width="8"/>
            <circle cx="180" cy="180" r="143" fill="none" stroke="#27334e" stroke-width="8"/>
            ${bars}
            ${marks}
            ${labels}
            <text x="180" y="13" fill="#8491ac" font-size="8" text-anchor="middle">12–24 UHR</text>
            <text x="180" y="34" fill="#8491ac" font-size="8" text-anchor="middle">00–12 UHR</text>
            <line x1="180" y1="180" x2="${hp[0]}" y2="${hp[1]}" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <line x1="180" y1="180" x2="${mp[0]}" y2="${mp[1]}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="180" cy="180" r="5" fill="#ff9d32"/>
          </svg>
          <div class="middle" aria-label="Termin durch Wischen wechseln">
            <div class="count">TERMIN ${events.length ? this._selected + 1 : 0}/${events.length}</div>
            <div class="title">${this._escape(title)}</div>
            <div class="time">${timeText}</div>
            <div class="hint">‹ WISCHEN ›</div>
          </div>
        </div>
      </ha-card>`;

    const middle = this.shadowRoot.querySelector(".middle");
    middle.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      this._start = { x: e.clientX, y: e.clientY };
      middle.setPointerCapture?.(e.pointerId);
    });
    middle.addEventListener("pointerup", e => {
      if (!this._start || events.length < 2) {
        this._start = null;
        return;
      }
      const dx = e.clientX - this._start.x;
      const dy = e.clientY - this._start.y;
      this._start = null;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        this._selected = (this._selected + (dx < 0 ? 1 : -1) + events.length) % events.length;
        this._render();
      }
    });
    middle.addEventListener("pointercancel", () => { this._start = null; });
  }
}

customElements.define("calendar-clock-card", CalendarClockCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "calendar-clock-card",
  name: "Calendar Clock Card",
  description: "Analoge Kalenderuhr mit Wischsteuerung nur in der Mitte."
});
