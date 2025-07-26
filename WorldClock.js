/**
 * WorldClock web component - Displays current time for multiple cities
 * 
 * @customElement world-clock
 * @attr {string} cities - Comma-separated list of cities or "City|TimeZone" format
 * @attr {string} locale - BCP 47 language tag for time formatting (e.g., 'en-US', 'de-DE')
 * 
 * @example
 * <world-clock cities="New York,London,Custom City|Asia/Singapore" locale="en-US"></world-clock>
 * 
 * @fires time-updated - Fired every second when time updates
 * @fires world-clock-error - Fired when an error occurs
 */
class WorldClock extends HTMLElement {
  constructor() {
    super();
  
    this.attachShadow({ mode: 'open' });

    // Always initialize cityTimeZones here!
    this.cityTimeZones = {
      "New York": "America/New_York",
      "London": "Europe/London",
      "Tokyo": "Asia/Tokyo",
      "Jerusalem": "Asia/Jerusalem",
      "Sydney": "Australia/Sydney",
      "Paris": "Europe/Paris",
      "Beijing": "Asia/Shanghai",
      "Moscow": "Europe/Moscow",
      "Mexico City": "America/Mexico_City",
      "Buenos Aires": "America/Argentina/Buenos_Aires",
      "Delhi": "Asia/Kolkata",
      "Cairo": "Africa/Cairo",
      "Bangkok": "Asia/Bangkok",
      "Berlin": "Europe/Berlin",
      "Rome": "Europe/Rome",
      "Istanbul": "Europe/Istanbul",
    };

    this.updateInterval = null;
    this.cities = ["New York", "London", "Tokyo"];
    this.locale = undefined;
    this._onVisibilityChange = this._onVisibilityChange.bind(this);

    // Validate time zones on initialization
    Object.values(this.cityTimeZones).forEach(zone => {
      if (!WorldClock.#validateTimezone(zone)) {
        console.warn(`Invalid time zone: ${zone}`);
      }
    });
  }

  static get observedAttributes() {
    return ['cities', 'locale'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal){ 
      if (name === 'cities') {
        this.cities = newVal ? newVal.split(',').map(c => c.trim()) : ["New York", "London", "Tokyo"];
        this._render();
        this.updateTime();
      }
      if (name === 'locale') {
        this.locale = newVal || undefined;
        this._render();
        this.updateTime();
      }
    }
  }

  static #sheet = (() => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        font-family: var(--world-clock-font, 'Roboto Mono', 'Courier New', monospace);
        border: 1px solid var(--world-clock-border-color, #ccc);
        padding: var(--world-clock-padding, 1em);
        border-radius: var(--world-clock-radius, 10px);
        max-width: 100vw;
        background: var(--world-clock-bg, #f9f9f9);
        display: block;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin: 0 auto;
      }
      h3 {
        margin: 0 0 0.5em;
        text-align: center;
        color: var(--world-clock-title-color, #333);
        font-weight: 600;
        font-size: 1.1rem;
      }
      ul {
        display: block;
        gap: 0.5rem;
        list-style: none;
        padding: 0;
        margin: 0;
      }
      li {
        padding: 0.5em 0.75em;
        margin-bottom: 0.25em;
        background: var(--world-clock-item-bg, rgba(255,255,255,0.5));
        border-radius: 4px;
        border-left: 3px solid var(--world-clock-accent, #007bff);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1em;
        transition: background-color 0.2s ease;
        min-width: 0;
        word-break: break-word;
      }
      li:hover {
        background: var(--world-clock-item-hover, rgba(0,123,255,0.1));
      }
      .city {
        color: var(--world-clock-city-color, #333);
        font-weight: 500;
        min-width: 90px;
        font-size: 1em;
        flex: 1 1 40%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .time {
        color: var(--world-clock-time-color, #007bff);
        font-weight: 700;
        letter-spacing: 0.5px;
        font-size: 1.1em;
        flex: 1 1 60%;
        text-align: right;
      }
      .clock-container {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
      }
      .error {
        color: red;
        font-weight: bold;
      }
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0,0,0,0) !important;
        border: 0 !important;
      }
      @media (max-width: 600px) {
        :host {
          padding: 0.5em;
          border-radius: 6px;
          font-size: 0.98em;
        }
        h3 {
          font-size: 1em;
        }
        li {
          font-size: 0.98em;
          padding: 0.4em 0.5em;
        }
        .city, .time {
          font-size: 0.98em;
        }
      }
      @media (min-width: 700px) {
        :host {
          max-width: 500px;
          padding: 2em;
        }
        h3 {
          font-size: 1.3rem;
        }
        li {
          font-size: 1.0em;
          padding: 0.7em 1.2em;
        }
        .city, .time {
          font-size: 1.0em;
        }
      }
      @media (min-width: 1000px) {
        :host {
          max-width: 700px;
        }
        ul {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.7rem;
        }
        li {
          margin-bottom: 0;
        }
      }
      @media (prefers-color-scheme: dark) {
        :host {
          --world-clock-bg: #2d3748;
          --world-clock-border-color: #4a5568;
          --world-clock-title-color: #e2e8f0;
          --world-clock-city-color: #cbd5e0;
          --world-clock-time-color: #63b3ed;
          --world-clock-item-bg: rgba(255,255,255,0.05);
          --world-clock-item-hover: rgba(99,179,237,0.1);
        }
      }
    `);
    return sheet;
  })();

  connectedCallback() {
    
    this._render();
    this.updateTime();
    this.shadowRoot.adoptedStyleSheets = [WorldClock.#sheet];

    const citiesAttr = this.getAttribute('cities');
    this.cities = citiesAttr ? citiesAttr.split(',').map(c => c.trim()) : ["New York", "London", "Tokyo"];
    this.locale = this.getAttribute('locale') || undefined;
    
    this.startClock();
    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  disconnectedCallback() {
    clearInterval(this.updateInterval);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    this.updateInterval = null;
    this.cities = null;
    
    // Clear timezone cache when component is removed
    // Only if this is the last instance of WorldClock
    if (!document.querySelector('world-clock')) {
        WorldClock.#timezoneCache.clear();
    }
  }

  _onVisibilityChange() {
    if (document.hidden) {
      clearInterval(this.updateInterval);
    } else {
      this.startClock();
    }
  }

  startClock() {
    clearInterval(this.updateInterval);
    this.updateTime();
    this.updateInterval = setInterval(() => this.updateTime(), 1000);

  }

  updateTime() {
    if (!this.isConnected) return;
    if (!this.cities?.length) {
        console.warn('WorldClock: No cities configured');
        return;
    }

    try {
        const now = new Date();
        const times = this.cities.map(cityEntry => {
            let city = cityEntry;
            let zone = this.cityTimeZones[cityEntry];

            // Support custom format: "City|TimeZone"
            if (cityEntry.includes('|')) {
                const [customCity, customZone] = cityEntry.split('|').map(s => s.trim());
                city = customCity;
                zone = customZone;
            }

            // Use cached validation
            if (!zone || !WorldClock.#validateTimezone(zone)) {
                return `<li role="listitem" class="error">${city}: Invalid Timezone</li>`;
            }

            const time = new Intl.DateTimeFormat(this.locale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: zone
            }).format(now);

            return `
                <li role="listitem">
                    <span class="city">${city}</span>
                    <span class="time">${time}</span>
                </li>
            `;
        });

        const clockList = this.shadowRoot.querySelector('#clock-list');
        if (clockList) {
            clockList.innerHTML = times.join('');
        }
    } catch (error) {
        console.error('WorldClock: Error updating time', error);
        this._renderError('Unable to update time');
    }
  }

  _renderError(message) {
    const list = this.shadowRoot?.querySelector('#clock-list');
    if (list) {
      list.innerHTML = `
        <li role="listitem" class="error">
          ⚠️ ${message}
        </li>
      `;
    }
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <div class="clock-container">
        <h3>🌍 World Clock</h3>
        <label id="clock-list-label" class="sr-only" for="clock-list">Current times in selected cities</label>
        <ul id="clock-list" role="list" aria-labelledby="clock-list-label" aria-live="polite"></ul>
      </div>
    `;
  }

  // Add static cache at the top of the class
  static #timezoneCache = new Map();

  // Add validation method
  static #validateTimezone(zone) {
      // Return cached result if available
      if (this.#timezoneCache.has(zone)) {
          return this.#timezoneCache.get(zone);
      }

      try {
          Intl.DateTimeFormat('en', { timeZone: zone });
          this.#timezoneCache.set(zone, true);
          return true;
      } catch (e) {
          this.#timezoneCache.set(zone, false);
          return false;
      }
  }
}

customElements.define('world-clock', WorldClock);