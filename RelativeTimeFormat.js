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
class RelativeTimeFormat extends HTMLElement{
    constructor(){
        super()
    }

    static get observedAttributes() {
        return ['value', 'locale', 'unit', 'fstyle']
    }

    static VALID_UNITS = ["year", "quarter", "month", "week", "day", "hour", "minute", "second"];
    static VALID_STYLES = ["long", "short", "narrow"];

    get value() {
        return this.getAttribute('value')
    }

    set value(val) {
        // Accept numbers as well as string numbers
        if ((typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) ||
            (typeof val === 'number' && !isNaN(val))) {
            this.setAttribute('value', String(val));
        } else {
            this.removeAttribute('value');
        }
    }

    get locale() {
        return this.getAttribute('locale') || document.body.getAttribute('data-locale') || 'en-US'
    }

    set locale(val) {
        if (typeof val === 'string' && val.trim()) {
            // Check if locale is supported
            const supported = Intl.RelativeTimeFormat.supportedLocalesOf([val]);
            if (supported.length > 0) {
                this.setAttribute('locale', val);
                return;
            }
        }
        this.setAttribute('locale', 'en-US');
    }

    get unit() {
        return this.getAttribute('unit') || 'second'; // Default fallback
    }

    set unit(val) {
        if (RelativeTimeFormat.VALID_UNITS.includes(val)) {
            this.setAttribute('unit', val)
        } else {
            this.removeAttribute('unit')
        }
    }

    get fstyle() {
        return this.getAttribute('fstyle') || 'short'
    }

    set fstyle(val) {
        if (RelativeTimeFormat.VALID_STYLES.includes(val)) {
            this.setAttribute('fstyle', val)
        } else {
            this.setAttribute('fstyle', 'short')
        }
    }

    connectedCallback() {
        // requestAnimationFrame(() => {
            this._connected = true
            this._initIntlNF()
            this._format()
        // })
        
        window.addEventListener('locale-change', this._onLocaleChange)
    }

    _onLocaleChange(e){
        this.locale = e.detail.locale
    }

    disconnectedCallback() {
        window.removeEventListener('locale-change', this._onLocaleChange);
        this._connected = false;
        this._formatter = null; // Clear formatter reference
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(!this._connected || oldValue === newValue) return;
        
        switch(name){
            case 'locale':
            case 'fstyle':
                this[name] = newValue;
                this._initIntlNF();
                break;
            case 'unit':
            case 'value':
                this[name] = newValue;
                break;
        }

        this._format(); // Remove requestAnimationFrame unless needed
    }

    _format(){
        if (!this.value || !this.unit){
            this.innerText = '';
            this.removeAttribute('aria-label');
            this.removeAttribute('title');
            return;
        }
        
        try {
            const formatted = this._formatter.format(Number(this.value), this.unit);
            
            if (this.childNodes.length === 0) {
                this.innerText = formatted;
            }
            this.setAttribute('aria-label', formatted);
            this.setAttribute('title', formatted);
        } catch (error) {
            console.warn(`Failed to format relative time: ${error.message}`);
        }
    }

    _initIntlNF(){
        try {
            this._formatter = new Intl.RelativeTimeFormat(this.locale, { 
                style: this.fstyle, 
                numeric: 'auto' 
            });
        } catch (error) {
            console.warn(`Failed to initialize RelativeTimeFormat: ${error.message}`);
            // Fallback to default locale
            this._formatter = new Intl.RelativeTimeFormat('en-US', {
                style: 'short',
                numeric: 'auto'
            });
        }
    }
}

customElements.define('relativetime-format', RelativeTimeFormat)