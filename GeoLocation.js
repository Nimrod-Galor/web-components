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
        status.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`
    }

    _error() {
        const status = this.shadowRoot.getElementById('status')
        status.textContent = "Unable to retrieve your location"
    }

}

customElements.define('geo-location', GeoLocation);