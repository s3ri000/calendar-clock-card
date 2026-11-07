class CalendarClockCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selected = 0;
    this._start = null;
    this._eventsKey = "";
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Bitte eine Kalender-Sensor-Entity angeben.");
    this._config = config;
    this._render();
  }

  set hass(hass) { this._hass = hass; this._render(); }
  getCardSize() { return 6; }
  static getConfigElement() { return null; }
  static getStubConfig() { return { entity: "sensor.famalywall_tageskalender" }; }

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
    const key = events.map(e => `${e.start}|${e.end}|${e.summary}|${e.all_day}`).join(";");
    if (key !== this._eventsKey) {
      this._eventsKey = key;
      this._selected = Math.max(0, Math.min(this._selected, events.length - 1));
    }
    if (!events.length) this._selected = 0;

    const now = new Date();
    const cx = 400, cy = 320;
    const colors = [
      "#ff9d32", "#62c8ff", "#b48cff", "#55d6a3", "#ff6f91",
      "#f4cf58", "#6f9cff", "#ff9966", "#7bd1cf", "#d78cff",
      "#a8d86e", "#ff789e", "#8ab4f8", "#e6a15c", "#72c5ef"
    ];
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

    const labelItems = [];
    let bars = "";

    events.forEach((event, i) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const color = colors[i % colors.length];
      const allDay = Boolean(event.all_day);
      const opacity = allDay ? 0.25 : (i === this._selected ? 1 : 0.78);

      const segments = [
        { from: midnight, to: noon, r: 143 },
        { from: noon, to: tomorrow, r: 160 }
      ];

      let longest = null;
      segments.forEach(ring => {
        const s = new Date(Math.max(start, ring.from));
        const e = new Date(Math.min(end, ring.to));
        if (e > s) {
          const sh = (s - ring.from) / 3600000;
          const eh = (e - ring.from) / 3600000;
          bars += `<path d="${arc(ring.r, sh, eh)}" fill="none"
            stroke="${color}" stroke-width="${i === this._selected ? 11 : 8}"
            stroke-opacity="${opacity}" stroke-linecap="round"
            ${allDay ? 'stroke-dasharray="3 3"' : ""}/>`;
          if (!longest || (e - s) > longest.duration) {
            longest = { ring: ring.r, mid: (sh + eh) / 2, duration: e - s };
          }
        }
      });

      if (longest) {
        const h = longest.mid;
        const angle = (h * 30 - 90) * Math.PI / 180;
        const side = Math.cos(angle) >= 0 ? "right" : "left";
        const anchor = point(longest.r, h);
        const elbow = point(178, h);
        const title = String(event.summary || "Termin").replace(/\s+/g, " ").trim();
        const time = allDay ? "Ganztägig" :
          `${start.toLocaleTimeString("de-DE", {hour:"2-digit",minute:"2-digit"})}–${end.toLocaleTimeString("de-DE", {hour:"2-digit",minute:"2-digit"})}`;
        labelItems.push({
          i, side, anchor, elbow, color, title, time,
          text: title.length > 19 ? title.slice(0, 18) + "…" : title
        });
      }
    });

    // Labels are split into left/right columns and assigned non-overlapping vertical slots.
    const distribute = side => {
      const items = labelItems.filter(x => x.side === side).sort((a,b) => a.anchor[1] - b.anchor[1]);
      const top = 72, bottom = 568, gap = items.length > 1 ? Math.min(46, 496 / (items.length - 1)) : 46;
      items.forEach((item, idx) => {
        item.labelY = Math.max(top + idx * gap, item.anchor[1]);
      });
      for (let i = items.length - 1; i >= 0; i--) {
        const maxY = bottom - (items.length - 1 - i) * gap;
        items[i].labelY = Math.min(items[i].labelY, maxY);
      }
      for (let i = 1; i < items.length; i++) {
        items[i].labelY = Math.max(items[i].labelY, items[i-1].labelY + gap);
      }
      if (items.length && items[items.length-1].labelY > bottom) {
        const shift = items[items.length-1].labelY - bottom;
        items.forEach(item => item.labelY -= shift);
      }
    };
    distribute("left");
    distribute("right");

    const leaders = labelItems.map(item => {
      const isRight = item.side === "right";
      const edgeX = isRight ? 772 : 28;
      const textX = isRight ? 788 : 12;
      const anchorText = isRight ? "end" : "start";
      const y = item.labelY;
      const selected = item.i === this._selected;
      const path = `M${item.anchor[0]} ${item.anchor[1]} L${item.elbow[0]} ${item.elbow[1]} L${edgeX} ${y} `;
      return `<path d="${path}" fill="none" stroke="${item.color}" stroke-width="${selected ? 1.8 : 1.1}" stroke-opacity=".9"/>
        <circle cx="${item.anchor[0]}" cy="${item.anchor[1]}" r="3" fill="${item.color}"/>
        <text x="${textX}" y="${y-3}" text-anchor="${anchorText}"
          fill="${item.color}" font-size="15" font-weight="${selected ? 700 : 500}">${this._escape(item.text)}</text>
        <text x="${textX}" y="${y+11}" text-anchor="${anchorText}"
          fill="#aab5ca" font-size="11">${this._escape(item.time)}</text>`;
    }).join("");

    const marks = Array.from({ length: 60 }, (_, i) => {
      const a = i * Math.PI / 30, r1 = 116, r2 = i % 5 === 0 ? 106 : 111;
      return `<line x1="${cx+r1*Math.sin(a)}" y1="${cy-r1*Math.cos(a)}"
        x2="${cx+r2*Math.sin(a)}" y2="${cy-r2*Math.cos(a)}"
        stroke="#75819b" stroke-width="${i%5 === 0 ? 1.5 : .7}"/>`;
    }).join("");

    const labels = Array.from({ length: 12 }, (_, i) => {
      const p = point(96, i), n = i === 0 ? 12 : i;
      return `<text x="${p[0]}" y="${p[1]+4}" fill="#e4eaf7"
        font-size="12" text-anchor="middle">${n}</text>`;
    }).join("");

    const hp = point(48, now.getHours() % 12 + now.getMinutes() / 60);
    const mp = point(70, now.getMinutes() / 60);
    const ev = events[this._selected];
    const start = ev ? new Date(ev.start) : null;
    const end = ev ? new Date(ev.end) : null;
    const fmt = d => d?.toLocaleTimeString("de-DE", {hour:"2-digit", minute:"2-digit"}) || "";
    const timeText = ev?.all_day ? "GANZTÄGIG" : ev ? `${fmt(start)} – ${fmt(end)}` : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        ha-card { background:#080e20; border-radius:24px; padding:8px; box-shadow:none; overflow:hidden; color:white; }
        .clock { max-width:800px; margin:auto; position:relative; }
        svg { display:block; width:100%; height:auto; }
        .middle { position:absolute; left:50%; top:50%; transform:translate(-50%,-30%);
          width:25%; min-height:90px; padding:4px; box-sizing:border-box;
          display:flex; flex-direction:column; justify-content:center; align-items:center;
          text-align:center; user-select:none; -webkit-user-select:none; touch-action:pan-y; cursor:grab; }
        .middle:active { cursor:grabbing; }
        .count { font-size:9px; color:#8995ad; letter-spacing:1px; }
        .title { font-size:15px; font-weight:600; color:white; margin-top:7px; overflow-wrap:anywhere; }
        .time { font-size:12px; color:#ffb35d; margin-top:6px; }
        .hint { font-size:9px; color:#75819b; margin-top:8px; }
      </style>
      <ha-card>
        <div class="clock">
          <svg viewBox="0 0 800 640" role="img" aria-label="Kalenderuhr mit Terminbeschriftungen">
            <circle cx="400" cy="320" r="160" fill="none" stroke="#27334e" stroke-width="8"/>
            <circle cx="400" cy="320" r="143" fill="none" stroke="#27334e" stroke-width="8"/>
            ${bars}${marks}${labels}${leaders}
            <text x="400" y="153" fill="#8491ac" font-size="8" text-anchor="middle">12–24 UHR</text>
            <text x="400" y="174" fill="#8491ac" font-size="8" text-anchor="middle">00–12 UHR</text>
            <line x1="400" y1="320" x2="${hp[0]}" y2="${hp[1]}" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <line x1="400" y1="320" x2="${mp[0]}" y2="${mp[1]}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="400" cy="320" r="5" fill="#ff9d32"/>
          </svg>
          <div class="middle">
            <div class="count">TERMIN ${events.length ? this._selected + 1 : 0}/${events.length}</div>
            <div class="title">${this._escape(ev?.summary || "Keine Termine")}</div>
            <div class="time">${timeText}</div>
            <div class="hint">‹ WISCHEN ›</div>
          </div>
        </div>
      </ha-card>`;

    const middle = this.shadowRoot.querySelector(".middle");
    middle.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      this._start = { x:e.clientX, y:e.clientY };
      middle.setPointerCapture?.(e.pointerId);
    });
    middle.addEventListener("pointerup", e => {
      if (!this._start || events.length < 2) { this._start = null; return; }
      const dx = e.clientX - this._start.x, dy = e.clientY - this._start.y;
      this._start = null;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        this._selected = (this._selected + (dx < 0 ? 1 : -1) + events.length) % events.length;
        this._render();
      }
    });
    middle.addEventListener("pointercancel", () => { this._start = null; });
  }
}

if (!customElements.get("calendar-clock-card")) {
  customElements.define("calendar-clock-card", CalendarClockCard);
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: "calendar-clock-card",
  name: "Calendar Clock Card",
  description: "Analoge Kalenderuhr mit farbigen Terminringen, Außenbeschriftung und Wischsteuerung."
});
