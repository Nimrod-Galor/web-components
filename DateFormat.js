/**
 * DateFormat Web Component
 * Automatically formats dates with locale awareness and time zone support
 * 
 * @customElement date-format
 * @extends HTMLElement
 * @fires locale-change - When the display locale changes
 * 
 * @property {string} value - The date value to format (timestamp or date string)
 * @property {string} locale - Locale identifier for formatting
 * @property {string} dateStyle - Date formatting style (full|long|medium|short)
 * @property {string} timeStyle - Time formatting style (full|long|medium|short)
 * @property {string} timeZone - IANA time zone identifier
 * 
 * @attr {string} value - Date value to format
 * @attr {string} date-style - Date formatting style
 * @attr {string} time-style - Time formatting style
 * @attr {string} time-zone - Time zone identifier
 * 
 * @example
 * <date-format 
 *   value="2023-12-25T15:00:00" 
 *   locale="en-US" 
 *   date-style="full" 
 *   time-style="short"
 *   time-zone="America/New_York">
 * </date-format>
 */
class DateFormat extends HTMLElement {
    constructor() {
        super()
    }

    #_render = true
    #VALID_STYLES = ['full', 'long', 'medium', 'short'];
    
    static get observedAttributes() {
        return ['value', 'locale', 'date-style', 'time-style', 'time-zone']
    }

    get value() {
        return this.getAttribute('value')
    }

    set value(value) {
        this.setAttribute('value', value)
    }
    
    get locale() {
        return this.getAttribute('locale') || document.body.getAttribute('data-locale') || 'en-US'
    }

    set locale(value) {
        this.setAttribute('locale', value)
    }

    get dateStyle() {
        return this.getAttribute('date-style')
    }

    set dateStyle(value) {
        
        if (value && !this.#VALID_STYLES.includes(value)) {
            throw new Error(`Invalid date-style: ${value}. Must be one of: ${this.#VALID_STYLES.join(', ')}`);
        }
        this.setAttribute('date-style', value);
    }

    get timeStyle() {
        return this.getAttribute('time-style')
    }

    set timeStyle(value) {
        
        if (value && !this.#VALID_STYLES.includes(value)) {
            throw new Error(`Invalid time-style: ${value}. Must be one of: ${this.#VALID_STYLES.join(', ')}`);
        }
        this.setAttribute('time-style', value)
    }

    get timeZone() {
        return this.getAttribute('time-zone')
    }

    set timeZone(value) {
        try {
            // Test if time zone is valid
            Intl.DateTimeFormat('en', { timeZone: value });
            this.setAttribute('time-zone', value);
        } catch (e) {
            throw new Error(`Invalid time-zone: ${value}. Must be a valid IANA time zone identifier.`);
        }
    }

    connectedCallback() {
        requestAnimationFrame(() => {
            this._initIntlNF()
            this.observer = new MutationObserver(() => {
                if(this.#_render){
                    this.value = this.textContent.trim()
                }else{
                    this.#_render = true
                }
            })
            this.observer.observe(this, { childList: true, characterData: true, subtree: true, })
            this._format()
        })

        // listen to language select change event
        window.addEventListener('locale-change', this._onLocaleChange)
    }
    
    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect()
            this.observer = null
        }
        window.removeEventListener('locale-change', this._onLocaleChange)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if(name != 'value'){
                this._initIntlNF()
            }
            this.#_render = true
            requestAnimationFrame(() => this._format())
        }
    }

    _format() {
        if(!this.value){
            this.value = this.textContent.trim()
        }

        if (!this.value || !this.value.trim()) {
            console.error('No date provided')
            return
        }
        
        let date
        if (/^\d+$/.test(this.value)) {
            // If it's only digits, treat as timestamp
            const num = Number(this.value)
            // If it's in seconds range, convert to milliseconds
            date = new Date(num < 1e12 ? num * 1000 : num)
        } else {
            date = new Date(this.value)
        }

        if (isNaN(date)) {
            console.error('Invalid date')
            return
        }

        this.#_render = false

        const formatted = this._formatter.format(date)

        this.textContent = formatted
        this.setAttribute('aria-label', formatted)
        this.setAttribute('title', formatted)
        this.setAttribute('role', 'text')
    }

    _onLocaleChange = (e) => {
        this.locale = e.detail.locale;
    }

    _initIntlNF(){
        const options = {
            dateStyle: this.dateStyle || undefined,
            timeStyle: this.timeStyle || undefined,
            timeZone: this.timeZone || undefined
        }

        this._formatter =  new Intl.DateTimeFormat(this.locale, options)
    }

}

customElements.define('date-format', DateFormat)
