class CurrencyFormat extends HTMLElement {
    constructor() {
        super();
    }
    
    #_render = true

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

        // listen to language select change event
        window.addEventListener('locale-change', (e) => {
            this.locale = e.detail.locale
        })
    }

    disconnectedCallback() {
        if (this.observer){
            this.observer.disconnect()
        }
    }

    // This will be called when any of the observed attributes change
    async attributeChangedCallback(name, oldValue, newValue) {
        if(oldValue && oldValue !== newValue){
            if(name === 'currency'){
                if(this._convertValue){
                    // If the currency attribute changes, get exchange rate and calculate new value
                    fetch(`https://api.frankfurter.app/latest?from=${oldValue}&to=${newValue}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response;
                    }).then(response => response.json())
                    .then(data => {
                        const rate = data.rates[newValue]
                        const num = Number(this.value) * rate
                        // initialize the formatter with the new currency
                        this._initIntlNF()
                        // Set the new value. this will triget new formatting
                        this.value = num
                    })
                    .catch(error => {
                        console.error('Error fetching exchange rate:', error);
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
    
    static get observedAttributes() {
        return ['value', 'currency', 'locale', 'minimum-fraction-digits', 'maximum-fraction-digits']
    }

    get value() {
        return this.getAttribute('value')
    }

    set value(value) {
        this.setAttribute('value', value)
    }

    get currency() {
        return this.getAttribute('currency') || this.LOCAL_TO_CURRENCY[this.locale] || 'USD'
    }

    set currency(value) {
        this.setAttribute('currency', value)
    }

    get locale() {
        return this.getAttribute('locale') || getComputedStyle(document.body).getPropertyValue('--locale').trim() || 'en-US'
    }

    set locale(value) {
        this.setAttribute('locale', value)
        // update to locale default currency
        this.currency = this.LOCAL_TO_CURRENCY[value] || 'USD'
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

    _format() {
        if(!this.value){
            // If no value is set, try to get it from the text content
            this.value = this.textContent.replace(/[^\d.-]/g, '').trim()
        }
        // Convert to a number
        const num = Number(this.value)

        if (isNaN(num)){
            // Do not format if invalid number
            return
        }

        // set render to false to prevent reformatting while formatting endless loop
        this.#_render = false
        
        const parts = this._formatter.formatToParts(num)
        let html = ''
        let title = ''
        
        // format currency Parts
        let fractionBuffer = '';
        for (const part of parts) {
            if (part.type === 'currency') {
                html += `<span class="currency">${part.value}</span>`;
            } else if (part.type === 'decimal' || part.type === 'fraction') {
                fractionBuffer += part.value;
            } else {
                // If there's a buffered fraction, flush it before adding other parts
                if (fractionBuffer) {
                    html += `<span class="fraction">${fractionBuffer}</span>`;
                    fractionBuffer = '';
                }
                html += part.value;
            }
            title += part.value;
        }
        // Flush any remaining fraction at the end
        if (fractionBuffer) {
            html += `<span class="fraction">${fractionBuffer}</span>`;
        }

        this.innerHTML = html
        this.setAttribute('aria-label', title)
        this.setAttribute('title', title)
    }

    _initIntlNF(){
        const options = {
            minimumFractionDigits: parseInt(this.minimumFractionDigits) || undefined,
            maximumFractionDigits: parseInt(this.maximumFractionDigits) || undefined,
            style: 'currency',
            currency: this.currency,
        };

        this._formatter = new Intl.NumberFormat(this.locale, options)
    }

    LOCAL_TO_CURRENCY = {
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

  customElements.define('currency-format', CurrencyFormat)