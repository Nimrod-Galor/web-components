/**
 * CurrencyConverter Web Component
 * A custom element that converts amounts between currencies using the Frankfurter API
 * 
 * @customElement currency-converter
 * @extends HTMLElement
 * @csspart amount - The input field for the source amount
 * @csspart output - The container showing converted amounts
 * 
 * @property {string} locale - Locale for number formatting
 * @property {string} source - Source currency code (e.g., 'USD')
 * @property {string[]} target - Array of target currency codes
 * @property {number} amount - Amount to convert
 * 
 * @attr {string} locale - Locale identifier (default: from CSS --locale or 'en-US')
 * @attr {string} source - Source currency code (default: 'USD')
 * @attr {string} target - Space-separated list of target currencies (default: 'EUR')
 * @attr {number} amount - Amount to convert (default: 1)
 * 
 * @fires input - When the amount changes
 * 
 * @example
 * <currency-converter
 *   source="USD"
 *   target="EUR GBP JPY"
 *   amount="100">
 * </currency-converter>
 */
class CurrencyConverter extends HTMLElement {
    
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
    }
    
    static get observedAttributes() {
      return ['locale', 'source', 'target', 'amount']
    }

    get locale() {
        return this.getAttribute('locale') || getComputedStyle(document.body).getPropertyValue('--locale').trim() || 'en-US'
    }

    set locale(value) {
        this.setAttribute('locale', value)
    }

    get source() {
        return this.getAttribute('source') || 'USD'
    }

    set source(value) {
        this.setAttribute('source', value.toUpperCase())
    }

    get target() {
        return this.getAttribute('target') ? this._parseTargets(this.getAttribute('target')) : ['EUR']
    }

    set target(value) {
        this.setAttribute('target', value.toUpperCase())
    }

    get amount() {
        if(!this.hasAttribute('amount')) {
            //initialize amount from text content if not set
            this.amount = this.textContent.trim() || 1
        }
        return this.getAttribute('amount')
    }

    set amount(value) {
        this.setAttribute('amount', value)
    }

    connectedCallback() {
        this._renderLoading()
        this._fetchConversionRate()
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal && oldVal !== newVal){
            if (name === 'source' || name === 'target') {
                this._renderLoading()
                this._fetchConversionRate()
            }else if( name === 'amount') {
                this._renderConverted()
            }
        }
    }

    async _fetchConversionRate() {
        if (!this.source || this.target.length === 0){
            this._renderError('Source or target currency missing')
            return
        }

        const symbols = this.target.join(',')

        const url = `https://api.frankfurter.app/latest?from=${this.source}&symbols=${symbols}`
        
        try {
            fetch(url)
            .then(res => {
                if (!res.ok) {
                    this._renderError(`API error: ${res.status} ${res.statusText}`);
                    return
                }
                return res.json()
            })
            .then(data => {
                if (data && data.rates != null) {
                    this._rates = data.rates
                    this._render()
                } else {
                    this._renderError('Invalid API response')
                }
            })
        } catch (err) {
            this._renderError('Network error. Failed to fetch rate')
        }
    }

    _renderLoading() {
        this.shadowRoot.innerHTML = `<span>Loading...</span>`
    }

    _renderError(msg) {
        this.shadowRoot.innerHTML = `<span style="color:red">Error: ${msg}</span>`
    }

    _render() {
        // const converted = (this.amount * this.rate).toFixed(2)
        const convertedList = this._parseRates()
        const summary = this._summary()

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: flex;
                gap:10px;
            }
            #amount {
                justify-items: end;
                height: fit-content;
            }
        </style>
        <input type='number' id="amount" value="${this.amount}" min="1" aria-label="Amount in ${this.source}" />
        <label for="amount"> ${this.source}</label> = 
        <div class="output" aria-label="${summary}" title="${summary}">${convertedList}</div>`
        this.shadowRoot.querySelector('#amount').addEventListener('input', this._onAmountChange.bind(this))
    }

    _onAmountChange(e) {
        const newValue = parseFloat(e.target.value)
        if (!isNaN(newValue)) {
            this.amount = newValue
        }
    }

    _renderConverted() {
        const output = this.shadowRoot.querySelector('.output');
        if (!output) {
            return
        }

        const summary = this._summary()
        output.innerHTML = this._parseRates()
        output.setAttribute('aria-label', summary)
        output.setAttribute('title', summary)
    }

    _parseRates(){
        const output = this.target.map(target => {
                const rate = this._rates[target]
                if (!rate) {
                    return `<span style="color:red">No rate for ${target}</span>`
                }
                const amount = (Number(this.amount) * rate).toFixed(2);
                return `<div>${amount} ${target}</div>`;
            }).join('')

        return output || `<span style="color:red">No rates available</span>`
    }

    _summary(){
        return `${this.amount} ${this.source} = ${this.target.map(t => {
            const rate = this._rates?.[t];
            return rate ? `${(Number(this.amount) * rate).toFixed(2)} ${t}` : `No rate for ${t}`;
        }).join(', ')}`
    }

    _parseTargets(targetAttr) {
        return (targetAttr || '')
        .split(' ')
        .map(t => t.trim().toUpperCase())
        .filter(Boolean)
    }
}

customElements.define('currency-converter', CurrencyConverter)