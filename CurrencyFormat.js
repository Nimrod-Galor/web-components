/**
 * CurrencyFormat Web Component
 * Automatically formats and converts currency values with locale awareness
 * 
 * @customElement currency-format
 * @extends HTMLElement
 * @fires locale-change - When the display locale changes
 * 
 * @property {string} value - The numeric value to format
 * @property {string} currency - Currency code (e.g., 'USD')
 * @property {string} locale - Locale identifier for formatting
 * @property {number} minimumFractionDigits - Minimum number of decimal places
 * @property {number} maximumFractionDigits - Maximum number of decimal places
 * 
 * @attr {string} value - Numeric value to format
 * @attr {string} currency - Currency code (default: based on locale)
 * @attr {string} locale - Locale identifier (default: from CSS --locale or 'en-US')
 * @attr {number} minimum-fraction-digits - Minimum decimal places
 * @attr {number} maximum-fraction-digits - Maximum decimal places
 * 
 * @csspart currency - The currency symbol/code
 * @csspart fraction - The decimal portion of the number
 * 
 * @example
 * <currency-format value="1234.56" currency="USD" locale="en-US">
 * </currency-format>
 */
class CurrencyFormat extends HTMLElement {
    constructor() {
        super();
    }
    
    #_render = true
        
    static get observedAttributes() {
        return ['value', 'currency', 'locale', 'minimum-fraction-digits', 'maximum-fraction-digits']
    }

    get value() {
        return this.getAttribute('value')
    }

    set value(value) {
        const num = Number(value);
        if (isNaN(num)) {
            console.error('invalid-value! Value must be a number.');
            return;
        }
        this.setAttribute('value', String(num));
    }

    get currency() {
        return this.getAttribute('currency') || this.#LOCAL_TO_CURRENCY[this.locale] || 'USD'
    }

    set currency(value) {
        const code = String(value).toUpperCase();
        if (!/^[A-Z]{3}$/.test(code)) {
            console.error('invalid-currency! Currency must be a 3-letter code');
            return;
        }
        this.setAttribute('currency', code);
    }

    get locale() {
        return this.getAttribute('locale') || getComputedStyle(document.body).getPropertyValue('--locale').trim() || 'en-US'
    }

    set locale(value) {
        this.setAttribute('locale', value)
        // update to locale default currency
        this.currency = this.#LOCAL_TO_CURRENCY[value] || 'USD'
    }

    get minimumFractionDigits() {
        return this.getAttribute('minimum-fraction-digits')
    }

    set minimumFractionDigits(value) {
        this.setAttribute('minimum-fraction-digits', value)
    }

    get maximumFractionDigits() {
        return this.getAttribute('maximum-fraction-digits')
    }

    set maximumFractionDigits(value) {
        this.setAttribute('maximum-fraction-digits', value)
    }

    connectedCallback() {
        requestAnimationFrame(() => {
            this._convertValue = true
            this._initIntlNF()
            this.observer = new MutationObserver(() => {
                if(this.#_render){
                    this.value = this.textContent.replace(/[^\d.-]/g, '').trim()
                }else{
                    this.#_render = true
                }
            })
            this.observer.observe(this, { childList: true, characterData: true, subtree: true })
            this._format()
        })

        this._onLocaleChange = (e) => {
                this.locale = e.detail.locale;
            };

        // listen to language select change event
        window.addEventListener('locale-change', this._onLocaleChange)
    }

    disconnectedCallback() {
        if (this.observer){
            this.observer.disconnect()
            this.observer = null
        }
        window.removeEventListener('locale-change', this._onLocaleChange)
    }

    // This will be called when any of the observed attributes change
    async attributeChangedCallback(name, oldValue, newValue) {
        if(oldValue && oldValue !== newValue){
            if(name === 'currency'){
                if(this._convertValue){
                    // If the currency attribute changes, get exchange rate and calculate new value
                    this._fetchExchangeRate(oldValue, newValue)
                    .then(rate => {
                        const num = Number(this.value) * rate
                        // initialize the formatter with the new currency
                        this._initIntlNF()
                        // Set the new value. this will trigger new formatting
                        this.value = num
                    })
                    .catch(error => {
                        console.error('Error fetching exchange rate:', error);
                        // Show error to user
                        this.innerHTML = `<span style="color: var(--error-color, #d32f2f)">Exchange rate error</span>`;
                        this.setAttribute('aria-label', 'Exchange rate error');
                        this.setAttribute('title', 'Exchange rate error');
                        // we need revert back to the old currency without converting the value
                        this._convertValue = false
                        this.currency = oldValue
                    })
                }else{
                    this._convertValue = true
                }
            } else if(name != 'value'){
                this._initIntlNF()
            }
            this.#_render = true
            // Reformat the number when attributes change
            requestAnimationFrame(() => this._format())
        }
    }

    _format() {
        if(!this.value){
            // If no value is set, try to get it from the text content
            this.value = this.textContent.replace(/[^\d.-]/g, '').trim()
        }
        // Convert to a number
        const num = Number(this.value)

        if (isNaN(num)){
            // Do not format if invalid number
            this.innerHTML = `<span style="color: var(--error-color, #d32f2f)">Invalid number</span>`;
            this.setAttribute('aria-label', 'Invalid number');
            this.setAttribute('title', 'Invalid number');
            return
        }

        // set render to false to prevent reformatting while formatting endless loop
        this.#_render = false
        
        let parts;
        try {
            parts = this._formatter.formatToParts(num)
        } catch (err) {
            this.innerHTML = `<span style="color: var(--error-color, #d32f2f)">Formatting error</span>`;
            this.setAttribute('aria-label', 'Formatting error');
            this.setAttribute('title', 'Formatting error');
            console.error('CurrencyFormat: Intl.NumberFormat error:', err);
            return;
        }

        let html = ''
        let title = ''
        
        // format currency Parts
        let fractionBuffer = '';
        for (const part of parts) {
            if (part.type === 'currency') {
                html += `<span class="currency" part="currency">${part.value}</span>`;
            } else if (part.type === 'decimal' || part.type === 'fraction') {
                fractionBuffer += part.value;
            } else {
                // If there's a buffered fraction, flush it before adding other parts
                if (fractionBuffer) {
                    html += `<span class="fraction" part="fraction">${fractionBuffer}</span>`;
                    fractionBuffer = '';
                }
                html += part.value;
            }
            title += part.value;
        }
        // Flush any remaining fraction at the end
        if (fractionBuffer) {
            html += `<span class="fraction" part="fraction">${fractionBuffer}</span>`;
        }

        this.innerHTML = html
        this.setAttribute('aria-label', title)
        this.setAttribute('title', title)
    }

    _initIntlNF(){
        const options = { style: 'currency', currency: this.currency };
        const min = parseInt(this.minimumFractionDigits);
        const max = parseInt(this.maximumFractionDigits);
        if (!isNaN(min)) options.minimumFractionDigits = min;
        if (!isNaN(max)) options.maximumFractionDigits = max;
        this._formatter = new Intl.NumberFormat(this.locale, options)
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

    // Add cache property
    #rateCache = new Map();
    
    async _fetchExchangeRate(from, to) {
        const cacheKey = `${from}-${to}`;
        const now = Date.now();
        
        // Check cache
        if (this.#rateCache.has(cacheKey)) {
            const {rate, expires} = this.#rateCache.get(cacheKey);
            if (expires > now){
                return rate;
            }
        }
        
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const rate = data.rates[to];
        
        // Cache rate for 1 hour
        this.#rateCache.set(cacheKey, {
            rate,
            expires: now + (60 * 60 * 1000) // 1 hour in milliseconds
        });
        
        return rate;
    }
}

customElements.define('currency-format', CurrencyFormat)