/**
 * WorldClock web component - Displays current time for multiple cities
 * @customElement world-clock
 * @attr {string} cities - Comma-separated list of cities
 * @attr {string} locale - BCP 47 language tag for time formatting
 */
class WorldClock extends HTMLElement {
  constructor() {
    super();
    

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
      try {
        Intl.DateTimeFormat('en', { timeZone: zone });
      } catch (e) {
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
        this.updateTime();
      }
      if (name === 'locale') {
        this.locale = newVal || undefined;
        this.updateTime();
      }
    }
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    // Render the initial clock
    this.render();
    this.updateTime();

    // Create styles and append them to the shadow root
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(`
      :host {
        font-family: var(--world-clock-font, 'Roboto Mono', 'Courier New', monospace);
        border: 1px solid var(--world-clock-border-color, #ccc);
        padding: var(--world-clock-padding, 1em);
        border-radius: var(--world-clock-radius, 10px);
        max-width: var(--world-clock-max-width, fit-content);
        background: var(--world-clock-bg, #f9f9f9);
        display: block;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      h3 {
        margin: 0 0 0.5em;
        text-align: center;
        color: var(--world-clock-title-color, #333);
        font-weight: 600;
      }
      
      ul {
        display: var(--world-clock-display, block);
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
        font-size: 0.95em;
        transition: background-color 0.2s ease;
      }
      
      li:hover {
        background: var(--world-clock-item-hover, rgba(0,123,255,0.1));
      }
      
      li strong {
        color: var(--world-clock-city-color, #333);
        font-weight: 500;
        min-width: 120px;
      }
      
      /* Digital clock styling for time */
      li::after {
        content: '';
        font-family: 'Roboto Mono', 'Courier New', monospace;
        font-weight: 700;
        color: var(--world-clock-time-color, #007bff);
        letter-spacing: 0.5px;
      }
      
      /* Grid layout option */
      .grid-layout ul {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
      }
      
      /* Compact horizontal layout */
      .compact ul {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      
      .compact li {
        flex: 1;
        min-width: 140px;
        padding: 0.4em 0.6em;
        text-align: center;
        flex-direction: column;
        gap: 0.2em;
      }

      .clock-container {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .error {
        color: red;
        font-weight: bold;
      }

      .city {
        color: var(--world-clock-city-color, #333);
        font-weight: 500;
        min-width: 120px;
      }

      .time {
        color: var(--world-clock-time-color, #007bff);
        font-weight: 700;
        letter-spacing: 0.5px;
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
    `)
    this.shadowRoot.adoptedStyleSheets = [sheet];

    const citiesAttr = this.getAttribute('cities');
    this.cities = citiesAttr ? citiesAttr.split(',').map(c => c.trim()) : ["New York", "London", "Tokyo"];
    this.locale = this.getAttribute('locale') || undefined;
    
    this.startClock();
    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  disconnectedCallback() {
    clearInterval(this.updateInterval);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
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
    if (!this.isConnected) return; // Early return if not in DOM
    if (!this.cities?.length) {
      console.warn('WorldClock: No cities configured');
      return;
    }

    try {
      const now = new Date();
      const times = this.cities.map(city => {
        const zone = this.cityTimeZones[city];
        if (!zone){
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

  render() {
    this.shadowRoot.innerHTML = `
      <div class="clock-container">
        <h3>🌍 World Clock</h3>
        <ul id="clock-list" role="list" aria-live="polite"></ul>
      </div>
    `;
  }
}

customElements.define('world-clock', WorldClock);