class RelativeTimeFormat extends HTMLElement{
    constructor(){
        super()
    }

    static get observedAttributes() {
        return ['value', 'locale', 'unit', 'fstyle']
    }

    get value() {
        return this.getAttribute('value')
    }

    set value(value) {
        this.setAttribute('value', value)
    }

    get locale() {
        return this.getAttribute('locale') || getComputedStyle(document.body).getPropertyValue('--locale').trim() || 'en-US'
    }

    set locale(value) {
        this.setAttribute('locale', value)
    }

    // "year", "quarter", "month", "week", "day", "hour", "minute", "second"
    get unit() {
        return this.getAttribute('unit')
    }

    set unit(value) {
        this.setAttribute('unit', value)
    }

    get fstyle() {
        return this.getAttribute('fstyle') || 'short' // long, short, narrow
    }

    set fstyle(value) {
        this.setAttribute('fstyle', value)
    }

    connectedCallback() {
        requestAnimationFrame(() => {
            this._connected = true
            this._initIntlNF()
            this._format()
        })
        
        // listen to language select change event
        window.addEventListener('locale-change', (e) => {
            this.locale = e.detail.locale
        })
    }

    disconnectedCallback() {
        window.removeEventListener('locale-change', this._onLocaleChange)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(this._connected && oldValue !== newValue){
            switch(name){
                case 'locale':
                    this.locale = newValue
                    this._initIntlNF()
                break
                case 'fstyle':
                    this.fstyle = newValue
                    this._initIntlNF()
                break
            }

            requestAnimationFrame(() => this._format())
        }
    }

    _format(){
        if (!this.value || !this.unit){
            return
        }
        const formatted = this._formatter.format(Number(this.value), this.unit)

        this.innerText = formatted
        this.setAttribute('aria-label', formatted)
        this.setAttribute('title', formatted)
    }

    _initIntlNF(){
        this._formatter = new Intl.RelativeTimeFormat(this.locale, { style: this.fstyle, numeric: 'auto' })
    }
}

customElements.define('relativetime-format', RelativeTimeFormat)