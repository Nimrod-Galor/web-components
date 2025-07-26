/**
 * GeoLocation Web Component
 * Displays the user's current geographic coordinates using the Geolocation API
 * 
 * @customElement geo-location
 * @extends HTMLElement
 * @csspart status - The container showing location or error status
 * 
 * @property {GeolocationPosition} position - The last retrieved position
 * 
 * @attr {boolean} watch - Enable continuous position tracking
 * @attr {boolean} high-accuracy - Request high accuracy positioning
 * @attr {number} timeout - Timeout in milliseconds (default: 5000)
 * @attr {number} maximum-age - Maximum age of cached position in milliseconds
 * 
 * @cssprop --geo-font-family - Font family (default: Arial, sans-serif)
 * @cssprop --geo-success-color - Color for successful location (default: inherit)
 * @cssprop --geo-error-color - Color for error messages (default: #ff0000)
 * 
 * @example
 * <geo-location></geo-location>
 * <geo-location watch high-accuracy timeout="10000"></geo-location>
 */
class GeoLocation extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this._render();
        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(`
            :host {
                display: inline-block;
                font-family: var(--geo-font-family, Arial, sans-serif);
            }
            #status {
                color: var(--geo-success-color, inherit);
            }
            :host([data-error]) #status {
                color: var(--geo-error-color, #ff0000);
            }
        `)
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this._setupGeolocation();
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <span id="status" part="status" role="status">Locating…</span>
        `;
    }

    static get observedAttributes() {
        return ['watch', 'high-accuracy', 'timeout', 'maximum-age'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'watch':
                case 'high-accuracy':
                case 'timeout':
                case 'maximum-age':
                    this._setupGeolocation();
                    break;
            }
        }
    }

    _getGeolocationOptions() {
        return {
            enableHighAccuracy: this.hasAttribute('high-accuracy'),
            timeout: parseInt(this.getAttribute('timeout')) || 5000,
            maximumAge: parseInt(this.getAttribute('maximum-age')) || 0
        };
    }

    _setupGeolocation() {
        if (!navigator.geolocation) {
            this._error({ code: 0, message: 'Geolocation not supported' });
            return;
        }

        // Clear existing watch if any
        if (this._watchId) {
            navigator.geolocation.clearWatch(this._watchId);
            this._watchId = null;
        }

        const options = this._getGeolocationOptions();

        if (this.hasAttribute('watch')) {
            this._watchId = navigator.geolocation.watchPosition(
                this._success.bind(this),
                this._error.bind(this),
                options
            );
        } else {
            navigator.geolocation.getCurrentPosition(
                this._success.bind(this),
                this._error.bind(this),
                options
            );
        }
    }

    _success(position) {
        this.position = position;
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const status = this.shadowRoot.getElementById('status')
        status.innerHTML = `<strong>Latitude:</strong> ${latitude} °, <strong>Longitude:</strong> ${longitude} °`
    }

    _getErrorMessage(error) {
        const messages = {
            1: 'Permission denied',
            2: 'Position unavailable',
            3: 'Request timeout'
        };
        return messages[error.code] || 'Unable to retrieve your location';
    }

    _error(error) {
        const status = this.shadowRoot.getElementById('status');
        status.textContent = this._getErrorMessage(error);
    }

    disconnectedCallback() {
        if (this._watchId) {
            navigator.geolocation.clearWatch(this._watchId);
        }
    }

    get position() {
        return this._position;
    }

    set position(value) {
        this._position = value;
    }
}

customElements.define('geo-location', GeoLocation);