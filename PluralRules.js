class PluralRules extends HTMLElement{
    constructor(){
        super()
    }

    static get observedAttributes() {
        return ['locale', 'value']
    }

    get locale() {
        return this.getAttribute('locale') || getComputedStyle(document.body).getPropertyValue('--locale').trim() || 'en-US'
    }

    set locale(value) {
        this.setAttribute('locale', value)
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
        window.addEventListener('locale-change', (e) => {
            console.log('locale-change', e.detail.locale)
            this.locale = e.detail.locale
        })
    }

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
            this.value = this.innerText.trim()
        }
        
        const rawNumber = Number(this.value)
        if(isNaN(rawNumber)){
            return
        }

        const suffixData = this._localeOrdinalSuffix[this.locale.split('-')[0]]
        let formatted

        if (!suffixData){
            // fallback to plain number
            formatted = `${rawNumber}`
        }else if (suffixData.prefix){
            // Handle prefix
            formatted = `${suffixData.prefix}${rawNumber}`
        }else{
            // Handle suffix categories (e.g., one, two, few, other)
            let pluralCategory = 'other'
    
            // Try Intl.PluralRules if available
            if (Object.keys(suffixData).length > 1) {
                pluralCategory = this._formatter.select(rawNumber)
            }
    
            const suffix = suffixData[pluralCategory] || suffixData.other || ''
            formatted =  `${rawNumber}${suffix}`
        }

        this.#_render = false
        this.innerText = formatted
        this.setAttribute('aria-label', formatted)
        this.setAttribute('title', formatted)
    }

    _initIntlNF(){
        this._formatter = new Intl.PluralRules(this.locale, { type: "ordinal" })
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
            other: '.',
        },
        'bg': {
            other: '.',
        },
        'uk': {
            other: '.',
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
            other: '.',
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
        'ns-ZA': {},
        'xh': {},
        'zu': {},
        'ga': {
            one: 'ᵃᵇ',
            other: 'ᵃᵈ',
        }
    }

}

customElements.define('plural-rules', PluralRules)