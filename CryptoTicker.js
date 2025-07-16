class CryptoTicker extends HTMLElement {
    constructor() {
        super()
    }

    static get observedAttributes() {
        return ['coins', 'currency', 'interval']
    }

    get coins() {
        return this.getAttribute('coins') || 'bitcoin,ethereum'
    }

    set coins(value) {
        this.setAttribute('coins', value)
    }

    get currency() {
        const attr = this.getAttribute('currency')
        if (attr) return attr.toLowerCase()

        const locale = getComputedStyle(document.body).getPropertyValue('--locale').trim()
        return (this.#LOCAL_TO_CURRENCY[locale]?.toLowerCase() || 'usd')
    }

    set currency(value) {
        this.setAttribute('currency', value)
    }

    get interval() {
        return parseInt(this.getAttribute('interval')) || 5 * 60 * 1000; // default 5 minutes
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' })
        this._initIntlNF()
        this._render()
        this._fetchData()
        this._interval = setInterval(() => this._fetchData(), this.interval) // update every 5 minute

        // listen to language select change event
        window.addEventListener('locale-change', (e) => {
            this.currency = this.#LOCAL_TO_CURRENCY[e.detail.locale].toLowerCase()
        })
    }

    disconnectedCallback() {
        clearInterval(this._interval)
        window.removeEventListener('locale-change', this._onLocaleChange)
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal && oldVal !== newVal) {
            if(name === 'currency'){
                this._initIntlNF()
            }
            this._fetchData()
        }
    }

    async _fetchData(retries = 3) {
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${this.coins}&vs_currencies=${this.currency}`;
            const res = await fetch(url);
            if (!res.ok){
                throw new Error(`HTTP error! status: ${res.status}`)
            }
            const data = await res.json()
            this._updateTicker(data)
        } catch (e) {
            console.error('Error fetching crypto prices:', e)
            if (retries > 0) {
                setTimeout(() => this._fetchData(retries - 1), 2000);
            } else {
                const ticker = this.shadowRoot.querySelector('.ticker');
                ticker.textContent = 'Failed to load prices';
                ticker.setAttribute('aria-label', 'Crypto price data unavailable');
            }
        }
    }

    _updateTicker(data) {
        const currency = this.currency.toUpperCase()

        const items = Object.entries(data).map(([coin, price]) => {
            const formatted = this._formatter.format(price[this.currency.toLowerCase()])
            return `${coin.toUpperCase()}: ${formatted}`
        })
        
        const label = `Crypto prices: ${items.join(', ')}`
        const ticker = this.shadowRoot.querySelector('.ticker')
        ticker.textContent = items.join(' | ')
        ticker.setAttribute('aria-label', label)
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>
                .wrapper {
                    color: var(--cticker-color, #0f0);
                    font-size: var(--cticker-font-size, '1rem');
                    padding: 8px;
                    font-family: monospace;
                    overflow: hidden;
                    white-space: nowrap;
                    box-sizing: border-box;
                }
                .ticker {
                    display: inline-block;
                    padding-left: 100%;
                    transform: translateZ(0);
                    will-change: transform;
                    animation: scroll 20s linear infinite;
                }
                @keyframes scroll {
                    from { transform: translateX(0) }
                    to { transform: translateX(-100%) }
                }
            </style>
            <div class="wrapper"><div class="ticker">Loading...</div></div>
        `
    }

    _initIntlNF(){
        this._formatter = new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: this.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 8
        })
    }

    #LOCAL_TO_CURRENCY = {
            "en-US": "USD",
            "en-GB": "GBP",
            "es-ES": "EUR",
            "es-MX": "MXN",
            "fr-FR": "EUR",
            "fr-CA": "CAD",
            "de-DE": "EUR",
            "pt-BR": "BRL",
            "pt-PT": "EUR",
            "it-IT": "EUR",
            "nl-NL": "EUR",
            "ru-RU": "RUB",
            "zh-CN": "CNY",
            "zh-TW": "TWD",
            "ja-JP": "JPY",
            "ko-KR": "KRW",
            "ar-SA": "SAR",
            "he-IL": "ILS",
            "tr-TR": "TRY",
            "pl-PL": "PLN",
            "sv-SE": "SEK",
            "da-DK": "DKK",
            "fi-FI": "EUR",
            "no-NO": "NOK",
            "cs-CZ": "CZK",
            "hu-HU": "HUF",
            "ro-RO": "RON",
            "bg-BG": "BGN",
            "uk-UA": "UAH",
            "el-GR": "EUR",
            "vi-VN": "VND",
            "th-TH": "THB",
            "hi-IN": "INR",
            "id-ID": "IDR",
            "ms-MY": "MYR",
            "fa-IR": "IRR",
            "ur-PK": "PKR",
            "ta-IN": "INR",
            "te-IN": "INR",
            "kn-IN": "INR",
            "ml-IN": "INR",
            "mr-IN": "INR",
            "gu-IN": "INR",
            "bn-BD": "BDT",
            "bn-IN": "INR",
            "sr-RS": "RSD",
            "hr-HR": "EUR",
            "sk-SK": "EUR",
            "sl-SI": "EUR",
            "lt-LT": "EUR",
            "lv-LV": "EUR",
            "et-EE": "EUR",
            "ka-GE": "GEL",
            "hy-AM": "AMD",
            "az-AZ": "AZN",
            "kk-KZ": "KZT",
            "uz-UZ": "UZS",
            "en-CA": "CAD",
            "en-AU": "AUD",
            "en-NZ": "NZD",
            "en-ZA": "ZAR",
            "en-IN": "INR",
            "en-SG": "SGD",
            "es-AR": "ARS",
            "es-CO": "COP",
            "es-CL": "CLP",
            "es-VE": "VES",
            "es-PE": "PEN",
            "fr-BE": "EUR",
            "fr-CH": "CHF",
            "de-CH": "CHF",
            "de-AT": "EUR",
            "it-CH": "CHF",
            "ar-EG": "EGP",
            "ar-MA": "MAD",
            "ar-AE": "AED",
            "ar-IQ": "IQD",
            "ar-JO": "JOD",
            "zh-HK": "HKD",
            "zh-SG": "SGD",
            "tl-PH": "PHP",
            "sw-KE": "KES",
            "af-ZA": "ZAR",
            "am-ET": "ETB",
            "my-MM": "MMK",
            "km-KH": "KHR",
            "lo-LA": "LAK",
            "si-LK": "LKR",
            "ne-NP": "NPR",
            "ps-AF": "AFN",
            "dz-BT": "BTN",
            "bo-CN": "CNY",
            "mn-MN": "MNT",
            "yo-NG": "NGN",
            "ig-NG": "NGN",
            "ha-NE": "XOF",
            "nso-ZA": "ZAR",
            "xh-ZA": "ZAR",
            "zu-ZA": "ZAR",
            "ga-IE": "EUR"
        }
}

customElements.define('crypto-ticker', CryptoTicker)