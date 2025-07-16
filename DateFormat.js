class DateFormat extends HTMLElement {
    constructor() {
        super()
    }

    #_render = true

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
        window.addEventListener('locale-change', (e) => {
            this.locale = e.detail.locale
        })
    }

    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect()
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
        return this.getAttribute('locale') || getComputedStyle(document.body).getPropertyValue('--locale').trim() || 'en-US'
    }

    set locale(value) {
        this.setAttribute('locale', value)
    }

    get dateStyle() {
        return this.getAttribute('date-style')
    }

    set dateStyle(value) {
        this.setAttribute('date-style', value)
    }

    get timeStyle() {
        return this.getAttribute('time-style')
    }

    set timeStyle(value) {
        this.setAttribute('time-style', value)
    }

    get timeZone() {
        return this.getAttribute('time-zone')
    }

    set timeZone(value) {
        this.setAttribute('time-zone', value)
    }

    _format() {

        if(!this.value){
            this.value = this.textContent.trim()
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

        if (isNaN(date)){
            return
        }

        // const locale = this.getAttribute('locale') || undefined

        // const options = {
        //     dateStyle: this.getAttribute('date-style') || undefined,
        //     timeStyle: this.getAttribute('time-style') || undefined,
        //     timeZone: this.getAttribute('time-zone') || undefined
        // }

        // const formatted = new Intl.DateTimeFormat(locale, options).format(date)

        this.#_render = false

        const formatted = this._formatter.format(date)

        this.textContent = formatted
        this.setAttribute('aria-label', formatted)
        this.setAttribute('title', formatted)
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
