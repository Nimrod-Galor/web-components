/**
 * WeatherWidget Web Component
 * Displays current weather for a given location using Open-Meteo API.
 *
 * @customElement weather-widget
 * @extends HTMLElement
 * @attr {number} latitude - Latitude for weather data
 * @attr {number} longitude - Longitude for weather data
 * @attr {string} unit - Temperature unit ('celsius' or 'fahrenheit')
 * @fires error - When weather data cannot be fetched
 */

class WeatherWidget extends HTMLElement {
    static #API_URL = "https://api.open-meteo.com/v1/forecast"

    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    static get observedAttributes() {
        return ['latitude', 'longitude', 'unit', 'auto-refresh']
    }

    get latitude() {
        return this.getAttribute('latitude')
    }

    set latitude(value) {
        const num = Number(value)
        if (isNaN(num) || num < -90 || num > 90) {
            throw new Error("Latitude must be a number between -90 and 90.")
        }
        this.setAttribute('latitude', num)
    }

    get longitude() {
        return this.getAttribute('longitude')
    }

    set longitude(value) {
        const num = Number(value)
        if (isNaN(num) || num < -180 || num > 180) {
            throw new Error("Longitude must be a number between -180 and 180.")
        }
        this.setAttribute('longitude', num)
    }

    get unit() {
        const unit = this.getAttribute('unit');
        return (unit === 'fahrenheit') ? 'fahrenheit' : 'celsius';
    }

    set unit(value) {
        const valid = (value === 'celsius' || value === 'fahrenheit')
        if (!valid) {
            throw new Error("Unit must be 'celsius' or 'fahrenheit'.")
        }
        this.setAttribute('unit', value)
    }

    connectedCallback() {
        this._renderInitialState()
        
        if (this.latitude && this.longitude) {
            this._fetchWeather()
        } else {
            this._getUserLocation()
        }
    }

    _renderInitialState() {
        const unitSymbol = this.unit === 'celsius' ? '°C' : '°F'
        this.shadowRoot.innerHTML = `
            <div class="loading">Loading weather data...</div>
            <div id="main" class="hide" aria-live="polite">
                <strong>Temperature:</strong> <span class="temp">--</span><span class="unitSymbol">${unitSymbol}</span><br>
                <strong>Condition:</strong> <span class="description">Loading...</span>
            </div>
        `
        
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                font-family: sans-serif;
                display: inline-block;
                padding: 1em;
                border: 1px solid #ccc;
                border-radius: 8px;
                background: #f0f8ff;
            }
            .unitSymbol{
                font-size: 0.8em;
                vertical-align: super;
                color: #555;
            }
            .loading {
                color: #666;
                padding: 1em;
                text-align: center;
            }
            .hide{
                display:none;
            }
            .error {
                color: #d32f2f;
                padding: 1em;
                text-align: center;
                background: #ffebee;
                border-radius: 4px;
            }
        `)
        this.shadowRoot.adoptedStyleSheets = [sheet]
    }

    // filepath: c:\Users\Nimrod\Documents\html\web components\WeatherWidget.js
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue &&oldValue !== newValue) {
            if (this.latitude && this.longitude) {
                this._fetchWeather();
            }else{
                throw new Error("Latitude and Longitude must be set before fetching weather data.")
            }
        }
    }

    _getUserLocation() {
        if (!navigator.geolocation) {
            this._renderError("Geolocation not supported") // ✅ Fix method name
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.latitude = position.coords.latitude
                this.longitude = position.coords.longitude
                this._fetchWeather()
            },
            (err) => {
                this._renderError("Unable to get location");
            }
        )
    }

    _showLoading() {
        this.shadowRoot.querySelector('.loading').classList.remove('hide')
        this.shadowRoot.querySelector('#main').classList.add('hide')
    }

    async _fetchWeather() {
        this._showLoading()
        const url = `${WeatherWidget.#API_URL}?latitude=${this.latitude}&longitude=${this.longitude}&current=temperature_2m,weather_code&temperature_unit=${this.unit}`
        
        // Add timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        try {
            const res = await fetch(url, { signal: controller.signal })
            clearTimeout(timeoutId)
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`)
            }
            const data = await res.json()
            if (!data.current?.temperature_2m || data.current?.weather_code === undefined) {
                throw new Error('Invalid API response format')
            }
            const temp = data.current.temperature_2m
            const code = data.current.weather_code
            this._renderWeather(temp, code)
        } catch (error) {
            clearTimeout(timeoutId)
            if (error.name === 'AbortError') {
                this._renderError('Request timed out. Please try again.')
            } else {
                this._renderError(`Failed to fetch weather: ${error.message}`)
            }
        }
    }

    _renderWeather(temp, code) {
        const description = this._weatherCodeToText(code)
        this.shadowRoot.querySelector('.temp').textContent = temp
        this.shadowRoot.querySelector('.description').textContent = description
        this.shadowRoot.querySelector('.loading').classList.add('hide')
        this.shadowRoot.querySelector('#main').classList.remove('hide')
    }

    _renderError(message) {
        // Use the CSS class instead of inline styles
        this.shadowRoot.innerHTML = `<div class="error">${message}</div>`
    }

    refresh() {
        if (this.latitude && this.longitude) {
            this._fetchWeather()
        } else {
            this._renderError('No location available for refresh')
        }
    }

    static #WEATHER_DESCRIPTIONS = {
                0: "Clear sky",
                1: "Mainly clear",
                2: "Partly cloudy",
                3: "Overcast",
                45: "Foggy",
                48: "Depositing rime fog",
                51: "Light drizzle",
                53: "Moderate drizzle",
                55: "Dense drizzle",
                61: "Light rain",
                63: "Moderate rain",
                65: "Heavy rain",
                71: "Light snow",
                73: "Moderate snow",
                75: "Heavy snow",
                77: "Snow grains",
                80: "Light rain showers",
                81: "Moderate rain showers",
                82: "Violent rain showers",
                85: "Light snow showers",
                86: "Heavy snow showers",
                95: "Thunderstorm",
                96: "Thunderstorm with light hail",
                99: "Thunderstorm with heavy hail"
            }

    _weatherCodeToText(code) {
        return WeatherWidget.#WEATHER_DESCRIPTIONS[code] || `Unknown weather code: ${code}`
    }
}


customElements.define("weather-widget", WeatherWidget)