/**
 * GeoLocation Web Component
 * Displays the user's current geographic coordinates using the Geolocation API
 * 
 * @customElement geo-location
 * @extends HTMLElement
 * @csspart status - The container showing location or error status
 * 
 * @fires geo-success - When location is successfully retrieved
 * @fires geo-error - When location retrieval fails
 * 
 * @property {GeolocationPosition} position - The last retrieved position
 * 
 * @cssprop --geo-font-family - Font family (default: Arial, sans-serif)
 * @cssprop --geo-success-color - Color for successful location (default: inherit)
 * @cssprop --geo-error-color - Color for error messages (default: #ff0000)
 * 
 * @example
 * <geo-location></geo-location>
 */
class GeoLocation extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        
        let status = ''
        if (!navigator.geolocation) {
            status = "Geolocation is not supported by your browser"
        } else {
            status = "Locating…"
            navigator.geolocation.getCurrentPosition(this._success.bind(this), this._error.bind(this))
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    font-family: Arial, sans-serif;
                }
            </style>
            <span id="status">${status}</span>
        `;
    }

    _success(position) {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const status = this.shadowRoot.getElementById('status')
        status.innerHTML = `<strong>Latitude:</strong> ${latitude} °, <strong>Longitude:</strong> ${longitude} °`
    }

    _error() {
        const status = this.shadowRoot.getElementById('status')
        status.textContent = "Unable to retrieve your location"
    }

}

customElements.define('geo-location', GeoLocation);