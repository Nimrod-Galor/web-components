/**
 * SelectLocale Web Component
 * 
 * Renders a dropdown for selecting a display locale from a curated list of supported BCP 47 locale codes.
 * Uses Intl.NumberFormat and Intl.DisplayNames for filtering and human-friendly display.
 * Dispatches a 'locale-change' event when the selection changes.
 * 
 * @customElement select-locale
 * @extends HTMLElement
 * 
 * @property {string} displayLocale - The currently selected locale code (e.g. 'en-US')
 * 
 * @attr {string} displayLocale - The selected locale code
 * 
 * @fires locale-change - Fired when the user selects a new locale. Event detail: { locale: string }
 * 
 * @example
 * <select-locale displayLocale="fr-FR"></select-locale>
 * 
 * @csspart select - The <select> element
 * 
 * Supported ARIA attributes:
 * - aria-label
 * - aria-labelledby
 * - aria-describedby
 */
class SelectLocale extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._onSelectChange = this._onSelectChange.bind(this);
    }

    static get observedAttributes() {
        return ['displayLocale'];
    }

    set displayLocale(value) {
        if (!value) return;
        
        // Validate locale
        const supported = Intl.NumberFormat.supportedLocalesOf([value]);
        if (supported.length === 0) {
            console.warn(`Locale ${value} not supported, falling back to en-US`);
            value = 'en-US';
        }
        
        this.setAttribute('displayLocale', value);
    }

    get displayLocale() {
        // Return internal property if available, otherwise attribute
        const systemLocale = navigator.languages  ? navigator.languages.length ? navigator.languages[0] : navigator.language : undefined;
        return this.getAttribute('displayLocale') || document.body.getAttribute('data-locale') || systemLocale || 'en-US';
    }

    connectedCallback() {
        this._isConnected = true;
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
        ];

        this._supported = Intl.NumberFormat.supportedLocalesOf(locales);
        this._renderSelect();
        // Add styles
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: inline-block;
            }
            select {
                padding: 0.5em;
                border-radius: 4px;
                border: 1px solid #ccc;
                font-size: 1em;
                min-width: 200px;
            }
            select:focus {
                outline: 2px solid #007bff;
                outline-offset: 2px;
            }
        `);
        this.shadowRoot.adoptedStyleSheets = [sheet];
    }

    disconnectedCallback() {
        this._isConnected = false;
        if (this._select) {
            this._select.removeEventListener('change', this._onSelectChange);
            this._select = null;
        }
        this._optionsCache = null;
        this._supported = null;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this._isConnected || oldValue === newValue) return;
        if (name === 'displayLocale') {
            this._updateSelectedOption();
        }
    }

    _initializeOptions() {
        if (!this._optionsCache) {
            this._optionsCache = this._supported.sort().map(locale => {
                const option = document.createElement('option');
                option.value = locale;
                option.textContent = this._getLocaleName(locale, locale.split('-')[0]);
                return option;
            });
        }
        return this._optionsCache.map(opt => opt.cloneNode(true));
    }

    _renderSelect() {
        // Use Shadow DOM for encapsulation
        const select = document.createElement('select');
        select.id = "select-display-locals";
        select.setAttribute('aria-label', 'Select display locale');
        select.setAttribute('aria-labelledby', 'select-display-locals-label');
        select.setAttribute('aria-describedby', 'select-display-locals-description');
        select.part = "select";

        // Remove previous event listener if exists
        if (this._select) {
            this._select.removeEventListener('change', this._onSelectChange);
        }

        // Use cached options
        const options = this._initializeOptions();
        const _displayLocale = this.displayLocale;
        options.forEach(option => {
            option.selected = _displayLocale === option.value;
            select.appendChild(option);
        });

        select.value = _displayLocale;
        select.addEventListener('change', this._onSelectChange);

        // Clear shadow root and append select
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(select);

        this._select = select;
    }

    _onSelectChange(e) {
        const newLocale = e.currentTarget.value;
        this.displayLocale = newLocale;

        this.dispatchEvent(new CustomEvent('locale-change', {
            detail: { locale: newLocale },
            bubbles: true,
            composed: true // necessary for shadow DOM!
        }));
    }

    _updateSelectedOption() {
        // Only update selected option, do not re-render select
        if (this._select) {
            const _displayLocale = this.displayLocale;
            this._select.value = _displayLocale;
            Array.from(this._select.options).forEach(opt => {
                opt.selected = opt.value === _displayLocale;
            });
        }
    }

    _getLocaleName(localeCode, displayLocale = 'en-US') {
        try {
            const [langCode, regionCode] = localeCode.split('-');
            const langName = new Intl.DisplayNames([displayLocale], { type: 'language' }).of(langCode);
            const regionName = regionCode ? new Intl.DisplayNames([displayLocale], { type: 'region' }).of(regionCode) : '';
            return regionCode ? `${langName} (${regionName})` : langName;
        } catch (error) {
            console.warn(`Failed to get locale name for ${localeCode}:`, error);
            return localeCode; // Fallback to code itself
        }
    }
}

customElements.define('select-locale', SelectLocale);