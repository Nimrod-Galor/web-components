/**
 * RelativeTimeFormat Web Component
 * Formats time differences into human-readable relative strings using Intl.RelativeTimeFormat
 * 
 * @customElement relativetime-format
 * @extends HTMLElement
 * @fires locale-change - When the display locale changes
 * 
 * @property {string} value - The numeric value to format (negative for past, positive for future)
 * @property {string} locale - Locale identifier for formatting
 * @property {string} unit - Time unit (year|quarter|month|week|day|hour|minute|second)
 * @property {string} fstyle - Formatting style (long|short|narrow)
 * 
 * @attr {string} value - Numeric value to format
 * @attr {string} locale - Locale identifier (default: from CSS --locale or 'en-US')
 * @attr {string} unit - Time unit to use
 * @attr {string} fstyle - Format style (default: 'short')
 * 
 * @example
 * <!-- "2 days ago" -->
 * <relativetime-format value="-2" unit="day"></relativetime-format>
 * 
 * <!-- "dans 3 heures" -->
 * <relativetime-format 
 *   value="3" 
 *   unit="hour" 
 *   locale="fr"
 *   fstyle="long">
 * </relativetime-format>
 */
class SelectLocale extends HTMLElement{
    constructor(){
        super()
    }

    static get observedAttributes() {
        return ['displayLocale']
    }

    get displayLocale() {
        return this.getAttribute('displayLocale')
    }

    set displayLocale(value) {
        this.setAttribute('displayLocale', value)
        this._displayLocale = value
    }

    connectedCallback() {
        const locales = [
            "en-US", "en-GB", "es-ES", "es-MX", "fr-FR", "fr-CA", "de-DE", "pt-BR", "pt-PT", "it-IT",
            "nl-NL", "ru-RU", "zh-CN", "zh-TW", "ja-JP", "ko-KR", "ar-SA", "he-IL", "tr-TR", "pl-PL",
            "sv-SE", "da-DK", "fi-FI", "no-NO", "cs-CZ", "hu-HU", "ro-RO", "bg-BG", "uk-UA", "el-GR",
            "vi-VN", "th-TH", "hi-IN", "id-ID", "ms-MY", "fa-IR", "ur-PK", "ta-IN", "te-IN", "kn-IN",
            "ml-IN", "mr-IN", "gu-IN", "bn-BD", "bn-IN", "sr-RS", "hr-HR", "sk-SK", "sl-SI", "lt-LT",
            "lv-LV", "et-EE", "ka-GE", "hy-AM", "az-AZ", "kk-KZ", "uz-UZ", "en-CA", "en-AU", "en-NZ",
            "en-ZA", "en-IN", "en-SG", "es-AR", "es-CO", "es-CL", "es-VE", "es-PE", "fr-BE", "fr-CH",
            "de-CH", "de-AT", "it-CH", "ar-EG", "ar-MA", "ar-AE", "ar-IQ", "ar-JO", "zh-HK", "zh-SG",
            "tl-PH", "sw-KE", "af-ZA", "am-ET", "my-MM", "km-KH", "lo-LA", "si-LK", "ne-NP", "ps-AF",
            "dz-BT", "bo-CN", "mn-MN", "yo-NG", "ig-NG", "ha-NE", "nso-ZA", "xh-ZA", "zu-ZA", "ga-IE"
        ]

        this._supported = Intl.NumberFormat.supportedLocalesOf(locales)
        this._displayLocale = this.getAttribute('displayLocale') || 'en-US'
        this._createSelectDisplayLocales()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(this._isConnected && oldValue !== newValue){
            this._locale = newValue
        }
    }

    _createSelectDisplayLocales(){
        const select = document.createElement('select');
        select.id = "select-display-locals"
        select.setAttribute('aria-label', 'Select display locale')
        select.setAttribute('aria-labelledby', 'select-display-locals-label')
        select.setAttribute('aria-describedby', 'select-display-locals-description')

        select.addEventListener('change', (e) => {
            this.displayLocale = e.currentTarget.value
            this._createSelectDisplayLocales()


            this.dispatchEvent(new CustomEvent('locale-change', {
                detail: { locale: e.currentTarget.value },
                bubbles: true,
                composed: true // necessary for shadow DOM!
            }));
        })

        
        this._supported.sort().forEach(locale => {
            const option = document.createElement('option');
            option.value = locale
            option.textContent = this._getLocaleName(locale, locale.split('-')[0])
            option.selected = this._displayLocale === locale
            select.appendChild(option);
        });
        this.innerHTML = '';
        this.appendChild(select);
    }

    _getLocaleName(localeCode, displayLocale = 'en-US') {
        const [langCode, regionCode] = localeCode.split('-');
        const langName = new Intl.DisplayNames([displayLocale], { type: 'language' }).of(langCode);
        const regionName = regionCode ? new Intl.DisplayNames([displayLocale], { type: 'region' }).of(regionCode) : '';
        return regionCode ? `${langName} (${regionName})` : langName;
    }
}

customElements.define('select-locale', SelectLocale)