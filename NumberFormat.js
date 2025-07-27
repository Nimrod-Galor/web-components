/**
 * NumberFormat Web Component
 * Formats numbers according to locale and fraction digit settings.
 * 
 * @customElement number-format
 * @extends HTMLElement
 * 
 * @attr {string} value - The number to format
 * @attr {string} locale - BCP 47 language tag (e.g., "en-US")
 * @attr {number} minimum-fraction-digits - Minimum fraction digits to display
 * @attr {number} maximum-fraction-digits - Maximum fraction digits to display
 * 
 * @fires locale-change - When locale changes globally
 * 
 * @example
 * <number-format value="1234.567" locale="de-DE" minimum-fraction-digits="2">
 * </number-format>
 */

class NumberFormat extends HTMLElement {
    constructor() {
        super();
    }
    
    #_render = true
    
    static get observedAttributes() {
        return ['value', 'locale', 'minimum-fraction-digits', 'maximum-fraction-digits']
    }

    get value() {
        return this.getAttribute('value')
    }

    set value(value) {
        if (value === null || value === undefined) {
            this.removeAttribute('value');
            return;
        }
        const num = Number(value);
        if (!isNaN(num)) {
            this.setAttribute('value', num);
        } else {
            console.warn(`Invalid number value: ${value}`);
        }
    }

    get locale() {
        return this.getAttribute('locale') || document.body.getAttribute('data-locale') || 'en-US'
    }

    set locale(value) {
        try {
            // Test if locale is valid
            Intl.NumberFormat(value);
            this.setAttribute('locale', value);
        } catch (e) {
            console.warn(`Invalid locale: ${value}, falling back to default`);
            this.setAttribute('locale', 'en-US');
        }
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
        window.addEventListener('locale-change', this._onLocaleChange)
    }

    _onLocaleChange = (e) => {
        this.locale = e.detail.locale
    }

    disconnectedCallback() {
        if (this.observer){
            this.observer.disconnect()
        }
        window.removeEventListener('locale-change', this._onLocaleChange)
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
    
    _format() {
        if (!this._formatter) {
            console.warn('Formatter not initialized');
            return;
        }

        let valueToFormat = this.value;
        if (!valueToFormat) {
            valueToFormat = this.textContent.replace(/[^\d.-]/g, '').trim();
            if(isNaN(Number(valueToFormat))){
                console.warn(`No valid number to format in text content: ${this.textContent}`);
            }else{
                this.value = valueToFormat; // Update the value attribute
            }
            return;
        }

        const num = Number(valueToFormat);
        // if (isNaN(num)) {
        //     console.warn(`Invalid number: ${valueToFormat}`);
        //     return;
        // }
        
        // Check for extremely large numbers that might cause issues
        if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
            console.warn(`Number ${num} exceeds safe integer range`);
        }
        
        try {
            this.#_render = false;
            const formatted = this._formatter.format(num);
            this.innerText = formatted;
            this.setAttribute('aria-label', `${formatted} (${this.locale})`);
            this.setAttribute('title', `Formatted as: ${formatted}`);
        } catch (error) {
            console.error('Formatting failed:', error);
            // Fallback to basic number display
            this.innerText = num.toString();
        }
    }

    _initIntlNF(){
        const minFD = this.minimumFractionDigits;
        const maxFD = this.maximumFractionDigits;
        
        const options = {
            style: 'decimal'
        };
        
        // Only set if valid positive integers
        if (minFD !== null && !isNaN(minFD) && parseInt(minFD, 10) >= 0) {
            options.minimumFractionDigits = parseInt(minFD, 10);
        }
        
        if (maxFD !== null && !isNaN(maxFD) && parseInt(maxFD, 10) >= 0) {
            options.maximumFractionDigits = parseInt(maxFD, 10);
        }
        
        // Ensure min <= max
        if (options.minimumFractionDigits && options.maximumFractionDigits) {
            if (options.minimumFractionDigits > options.maximumFractionDigits) {
                console.warn('minimumFractionDigits exceeds maximumFractionDigits, swapping values');
                [options.minimumFractionDigits, options.maximumFractionDigits] = 
                [options.maximumFractionDigits, options.minimumFractionDigits];
            }
        }
        
        this._formatter = new Intl.NumberFormat(this.locale, options);
    }

  }

  customElements.define('number-format', NumberFormat)