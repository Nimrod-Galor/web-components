class WeatherWidget extends HTMLElement {
    constructor() {
        super()
    }

    static get observedAttributes() {
        return ['latitude', 'longitude', 'unit']
    }

    get latitude() {
        return this.getAttribute('latitude')
    }

    set latitude(value) {
        this.setAttribute('latitude', value)
    }

    get longitude() {
        return this.getAttribute('longitude')
    }

    set longitude(value) {
        this.setAttribute('longitude', value)
    }

    get unit() {
        return this.getAttribute('unit') || 'celsius' //fahrenheit
    }

    set unit(value) {
        this.setAttribute('unit', value)
    }

    connectedCallback() {
        this.attachShadow({ mode: "open" })
        this.apiUrl = "https://api.open-meteo.com/v1/forecast"
    
        if (this.latitude && this.longitude) {
            this._fetchWeather()
        }else{
            this._getUserLocation()
        }

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
            this.renderError("Geolocation not supported")
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


    async _fetchWeather() {
        const url = `${this.apiUrl}?latitude=${this.latitude}&longitude=${this.longitude}&current=temperature_2m,weather_code&temperature_unit=${this.unit}`
        try {
            const res = await fetch(url)
            const data = await res.json()
            const temp = data.current.temperature_2m
            const code = data.current.weather_code

            this._renderWeather(temp, code)
        } catch (error) {
            this._renderError("Failed to fetch weather")
        }
    }

    _renderWeather(temp, code) {
        const description = this._weatherCodeToText(code)
        const unitSymbol = this.unit === 'celsius' ? '°C' : '°F'
        this.shadowRoot.innerHTML = `
            <style>
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
            </style>
            <div aria-live="polite">
                <strong>Temperature:</strong> ${temp}<span class="unitSymbol">${unitSymbol}</span><br>
                <strong>Condition:</strong> ${description}
            </div>
        `
    }

    _renderError(message) {
        this.shadowRoot.innerHTML = `<p style="color:red">${message}</p>`
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