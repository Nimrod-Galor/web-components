class NumberFormat extends HTMLElement {
    constructor() {
        super();
    }
    
    #_render = true

    connectedCallback() {
        requestAnimationFrame(() => {
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
    attributeChangedCallback(name, oldValue, newValue) {
        if(oldValue !== newValue){
            if(name != 'value'){
                this._initIntlNF()
            }
            this.#_render = true
            // Reformat the number when attributes change
            requestAnimationFrame(() => this._format())
        }
    }
    
    static get observedAttributes() {
        return ['value', 'locale', 'minimum-fraction-digits', 'maximum-fraction-digits']
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
        
        this.#_render = false
        const formatted = this._formatter.format(num)

        this.innerText = formatted
        this.setAttribute('aria-label', formatted)
        this.setAttribute('title', formatted)
    }

    _initIntlNF(){
        const options = {
            minimumFractionDigits: parseInt(this.minimumFractionDigits) || undefined,
            maximumFractionDigits: parseInt(this.maximumFractionDigits) || undefined,
            style: 'decimal'
        };

        this._formatter =  new Intl.NumberFormat(this.locale, options)
    }

  }

  customElements.define('number-format', NumberFormat)