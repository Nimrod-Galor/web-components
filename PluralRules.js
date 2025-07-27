/**
 * PluralRules Web Component
 * Automatically formats numbers with ordinal indicators based on locale
 * 
 * @customElement plural-rules
 * @extends HTMLElement
 * @fires locale-change - When the display locale changes
 * 
 * @property {string} value - The numeric value to format
 * @property {string} locale - Locale identifier for formatting
 * 
 * @attr {string} value - Numeric value to format
 * 
 * @example
 * <!-- Formats as "1st", "2nd", "3rd", etc. in English -->
 * <plural-rules value="1" locale="en-US"></plural-rules>
 * 
 * <!-- Formats as "1er", "2e", etc. in French -->
 * <plural-rules value="1" locale="fr"></plural-rules>
 */
class PluralRules extends HTMLElement{
    constructor(){
        super()
        this._onLocaleChange = this._onLocaleChange.bind(this);
    }

    static get observedAttributes() {
        return ['locale', 'value']
    }

    get locale() {
        return this.getAttribute('locale') || document.body.getAttribute('data-locale') || 'en-US'
    }

    set locale(value) {
        // Validate locale before setting
        try {
            new Intl.PluralRules(value);
            this.setAttribute('locale', value);
        } catch (error) {
            console.warn(`Invalid locale: ${value}, keeping current locale`);
        }
    }

    get value() {
        return this.getAttribute('value')
    }

    set value(value) {
        this.setAttribute('value', value)
    }

    #_render = true

    connectedCallback() {
        requestAnimationFrame(() => {
            this.#_render = true
            this._initIntlNF()
            this.observer = new MutationObserver(() => {
                if(this.#_render){
                    this.value = this.innerText.trim()
                }else{
                    this.#_render = true
                }
            })
            this.observer.observe(this, { childList: true, characterData: true, subtree: true })
            this._format()
        })

        // listen to language select change event
        window.addEventListener('locale-change', this._onLocaleChange);
    }

    _onLocaleChange = (e) => {
        console.log('locale-change', e.detail.locale);
        this.locale = e.detail.locale;
    };

    disconnectedCallback() {
        if (this.observer){
            this.observer.disconnect()
        }
        window.removeEventListener('locale-change', this._onLocaleChange)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(oldValue !== newValue){
            if(name == 'locale'){
                this._initIntlNF()
            }
            this.#_render = true
            requestAnimationFrame(() => this._format())
        }
    }

    _format(){
        if(!this.value){
            this.value = this.innerText.trim();
        }
        
        const rawNumber = Number(this.value);
        if(isNaN(rawNumber)){
            console.warn(`Invalid number: ${this.value}`);
            return;
        }

        // Cache locale lookup
        const localeKey = this.locale.split('-')[0];
        const suffixData = this._localeOrdinalSuffix[localeKey];
        let formatted;

        if (!suffixData || Object.keys(suffixData).length === 0){
            // Fallback to plain number for unsupported locales
            formatted = `${rawNumber}`;
            console.info(`No ordinal rules for locale: ${localeKey}`);
        } else if (suffixData.prefix){
            // Handle prefix languages (CJK)
            formatted = `${suffixData.prefix}${rawNumber}`;
        } else {
            // Handle suffix languages with plural categories
            let pluralCategory = 'other';

            // Only use PluralRules if we have multiple categories
            if (Object.keys(suffixData).length > 1 && this._formatter) {
                try {
                    pluralCategory = this._formatter.select(rawNumber);
                } catch (error) {
                    console.warn('PluralRules selection failed:', error);
                }
            }

            const suffix = suffixData[pluralCategory] || suffixData.other || '';
            formatted = `${rawNumber}${suffix}`;
        }

        this.#_render = false;
        this.innerText = formatted;
        this.setAttribute('aria-label', `${formatted} (${this.locale})`);
        this.setAttribute('title', `Ordinal number: ${formatted}`);
        
        // Dispatch custom event for external listeners
        this.dispatchEvent(new CustomEvent('formatted', {
            bubbles: true,
            composed: true,
            detail: { value: rawNumber, formatted, locale: this.locale }
        }));
    }

    _initIntlNF(){
        try {
            this._formatter = new Intl.PluralRules(this.locale, { type: "ordinal" });
        } catch (error) {
            console.warn(`Invalid locale: ${this.locale}, falling back to en-US`);
            this._formatter = new Intl.PluralRules('en-US', { type: "ordinal" });
        }
    }

    _localeOrdinalSuffix = {
        'en': {
            one: 'st',
            two: 'nd',
            few: 'rd',
            other: 'th',
        },
        'es': {
            other: 'º',
        },
        'fr': {
            one: 'er', // masculine
            other: 'e',
        },
        'de': {
            other: '.',
        },
        'pt': {
            one: '.º',
            other: '.º',
        },
        'it': {
            other: 'º',
        },
        'nl': {
            other: '.',
        },
        'ru': {
            one: '-й',    // 1-й, 21-й, 31-й
            few: '-й',    // 2-й, 3-й, 4-й, 22-й, 23-й, 24-й  
            other: '-й'   // 5-й, 6-й, 7-й, 8-й, 9-й, 10-й, etc.
        },
        'bg': {
            other: '.',
        },
        'uk': {
            one: '-й',    // Ukrainian
            few: '-й',
            other: '-й'
        },
        'cs': {
            other: '.',
        },
        'sk': {
            other: '.',
        },
        'sl': {
            other: '.',
        },
        'zh': {
            prefix: '第',
        },
        'ja': {
            prefix: '第',
        },
        'ko': {
            prefix: '제',
        },
        'ar': {
            other: '‑',
        },
        'tr': {
            other: '.',
        },
        'pl': {
            other: '.',
        },
        'sv': {
            other: '.',
        },
        'da': {
            other: '.',
        },
        'fi': {
            other: '.',
        },
        'no': {
            other: '.',
        },
        'ro': {
            other: '.',
        },
        'hu': {
            other: '.',
        },
        'el': {
            other: 'ος',  // 1ος, 2ος, 3ος (Greek)
        },
        'vi': {},
        'th': {},
        'hi': {},
        'id': {},
        'ms': {},
        'tl': {},
        'sw': {},
        'af': {},
        'am': {},
        'my': {},
        'km': {},
        'lo': {},
        'si': {},
        'ne': {},
        'ps': {},
        'dz': {},
        'bo': {},
        'mn': {},
        'yo': {},
        'ig': {},
        'ha': {},
        'ns': {},
        'xh': {},
        'zu': {},
        'ga': {
            one: 'ᵃᵇ',
            other: 'ᵃᵈ',
        },
        'hi': {
            other: 'वाँ',  // 1वाँ, 2वाँ, 3वाँ (Hindi)
        },
        'bn': {
            other: 'ম',   // 1ম, 2ম, 3ম (Bengali)
        },
        'gu': {
            other: 'મો',  // 1મો, 2મો, 3મો (Gujarati)
        },
        'pa': {
            other: 'ਵਾਂ',  // 1ਵਾਂ, 2ਵਾਂ, 3ਵਾਂ (Punjabi)
        },
        'ta': {
            other: 'வது', // 1வது, 2வது, 3வது (Tamil)
        },
        'te': {
            other: 'వ',   // 1వ, 2వ, 3వ (Telugu)
        },
        'kn': {
            other: 'ನೇ',  // 1ನೇ, 2ನೇ, 3ನೇ (Kannada)
        },
        'ml': {
            other: 'ാം',  // 1ാം, 2ാം, 3ാം (Malayalam)
        },
        'mr': {
            other: 'वा',  // 1वा, 2वा, 3वा (Marathi)
        },
        'or': {
            other: 'ମ',   // 1ମ, 2ମ, 3ম (Odia)
        },
        'as': {
            other: 'ম',   // 1ম, 2ম, 3ম (Assamese)
        },
        'ne': {
            other: 'औं',  // 1औं, 2औं, 3औं (Nepali)
        },
        'si': {
            other: 'වන',  // 1වන, 2වන, 3වන (Sinhala)
        },
        'th': {
            prefix: 'ที่', // ที่1, ที่2, ที่3 (Thai)
        },
        'vi': {
            prefix: 'thứ ', // thứ 1, thứ 2, thứ 3 (Vietnamese)
        },
        'id': {
            prefix: 'ke-', // ke-1, ke-2, ke-3 (Indonesian)
        },
        'ms': {
            prefix: 'ke-', // ke-1, ke-2, ke-3 (Malay)
        },
        'tl': {
            prefix: 'ika-', // ika-1, ika-2, ika-3 (Filipino/Tagalog)
        },
        'my': {
            other: 'မြောက်', // 1မြောက်, 2မြောက်, 3မြောက် (Burmese)
        },
        'km': {
            prefix: 'ទី', // ទី1, ទី2, ទី3 (Khmer)
        },
        'lo': {
            prefix: 'ທີ່ ', // ທີ່ 1, ທີ່ 2, ທີ່ 3 (Lao)
        },
        'sw': {
            prefix: 'wa ', // wa 1, wa 2, wa 3 (Swahili)
        },
        'af': {
            other: 'de',  // 1de, 2de, 3de (Afrikaans)
        },
        'zu': {
            prefix: 'oku-', // oku-1, oku-2, oku-3 (Zulu)
        },
        'xh': {
            prefix: 'oku-', // oku-1, oku-2, oku-3 (Xhosa)
        },
        'yo': {
            prefix: 'ẹ́kọ́ ', // ẹ́kọ́ 1, ẹ́kọ́ 2, ẹ́kọ́ 3 (Yoruba)
        },
        'ig': {
            prefix: 'nke ', // nke 1, nke 2, nke 3 (Igbo)
        },
        'ha': {
            prefix: 'na ', // na 1, na 2, na 3 (Hausa)
        },
        'am': {
            other: 'ኛ',   // 1ኛ, 2ኛ, 3ኛ (Amharic)
        },
        'kk': {
            other: '-ші', // 1-ші, 2-ші, 3-ші (Kazakh)
        },
        'ky': {
            other: '-чи', // 1-чи, 2-чи, 3-чи (Kyrgyz)
        },
        'uz': {
            other: '-chi', // 1-chi, 2-chi, 3-chi (Uzbek)
        },
        'mn': {
            other: '-р',  // 1-р, 2-р, 3-р (Mongolian)
        },
        'mi': {
            prefix: 'tuatahi ', // tuatahi 1, tuarua 2 (Maori - simplified)
        },
        'fj': {
            prefix: 'ni-', // ni-1, ni-2, ni-3 (Fijian)
        },
        'to': {
            prefix: 'hono ', // hono 1, hono 2, hono 3 (Tongan)
        },
        'sm': {
            prefix: 'lona ', // lona 1, lona 2, lona 3 (Samoan)
        }
    }

}

customElements.define('plural-rules', PluralRules)