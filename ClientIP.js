/**
 * @customElement client-ip
 * @description Displays client IP address and location information
 * @attr {string} api-url - Custom API endpoint (default: ipinfo.io)
 * @attr {boolean} show-coords - Show coordinates
 * @attr {boolean} show-org - Show ISP/Organization
 * @cssprop --bg-color - Background color
 * @cssprop --label-color - Label text color
 * @fires {CustomEvent} ip-loaded - Fired when IP data is loaded
 * @example <client-ip show-coords show-org></client-ip>
 */

class ClientIP extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['api-url', 'show-coords', 'show-org'];
    }

    get apiUrl() {
        return this.getAttribute('api-url') || 'https://ipinfo.io/json';
    }

    get showCoords() {
        return this.hasAttribute('show-coords');
    }

    get showOrg() {
        return this.hasAttribute('show-org');
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });

        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(`
            :host {
                display: block;
                font-family: var(--client-ip-font, system-ui, sans-serif);
                max-width: 100%;
                padding: 1rem;
                border: 1px solid var(--client-ip-border, #ddd);
                border-radius: var(--client-ip-radius, 8px);
                background: var(--client-ip-bg, #f9f9f9);
                box-sizing: border-box;
            }
            .loading {
                text-align: center;
                color: var(--client-ip-loading-color, #666);
                padding: 1rem;
            }
            .error {
                color: var(--client-ip-error-color, #d32f2f);
                text-align: center;
                padding: 1rem;
                background: var(--client-ip-error-bg, #ffebee);
                border-radius: 4px;
            }
            p {
                margin: 0.5rem 0;
                word-break: break-word;
                font-size: 0.9rem;
            }
            strong {
                color: var(--client-ip-label-color, #333);
                font-weight: 600;
            }
            small {
                display: block;
                margin-top: 1rem;
                color: var(--client-ip-note-color, #666);
                font-size: 0.75rem;
                text-align: center;
            }
            @media (min-width: 600px) {
                :host {
                    max-width: 400px;
                    padding: 1.5rem;
                }
                p {
                    font-size: 1rem;
                }
            }
        `)

        this.shadowRoot.adoptedStyleSheets = [sheet]
        this.shadowRoot.innerHTML = `
            <div class="loading">Loading IP info...</div>
        `;

        this._fetchIPInfo();
    }

    async _fetchIPInfo() {
        try {
            const res = await fetch(this.apiUrl);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            this._renderData(data);
        } catch (err) {
            this._renderError(err);
        }
    }

    _renderData(data) {
        this.shadowRoot.innerHTML = `
            <div role="status" aria-live="polite">
                ${this._renderIPInfo(data)}
                <small role="note" style="color: #666; font-size: 0.8em;">
                    IP information provided by ipinfo.io
                </small>
            </div>
        `;
    }

    _renderError(err) {
        let message = 'Unable to fetch IP information';
        if (!navigator.onLine) {
            message = 'No internet connection';
        } else if (err.name === 'TypeError') {
            message = 'Network error - please try again';
        }

        this.shadowRoot.innerHTML = `
            <div role="alert" class="error">${message}</div>
        `;
        console.error('ClientIP fetch error:', err);
    }

    _renderIPInfo(data) {
        const { ip, city, region, country, org, loc } = data;
        return `
            <p><strong>IP Address:</strong> ${this._escapeHTML(ip)}</p>
            <p><strong>Location:</strong> ${this._escapeHTML(city)}, ${this._escapeHTML(region)}, ${this._escapeHTML(country)}</p>
            ${this.showCoords ? `<p><strong>Coordinates:</strong> ${this._escapeHTML(loc)}</p>` : ''}
            ${this.showOrg ? `<p><strong>ISP / Org:</strong> ${this._escapeHTML(org)}</p>` : ''}
        `;
    }

    _escapeHTML(str) {
        return String(str || '')
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    refresh() {
        this.shadowRoot.innerHTML = `<div class="loading">Loading IP info...</div>`;
        this._fetchIPInfo();
    }
}

customElements.define('client-ip', ClientIP)
