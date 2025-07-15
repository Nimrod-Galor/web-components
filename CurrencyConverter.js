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
        return this.getAttribute('target') || 'EUR'
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
        const url = `https://api.frankfurter.app/latest?from=${this.source}&to=${this.target}`
        
        try {
            fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data && data.rates != null) {
                    this.rate = data.rates[this.target]
                    this._render()
                } else {
                    this._renderError('Invalid API response')
                }
            })
        } catch (err) {
            this._renderError('Failed to fetch rate')
        }
    }

    _renderLoading() {
        this.shadowRoot.innerHTML = `<span>Loading...</span>`
    }

    _renderError(msg) {
        this.shadowRoot.innerHTML = `<span style="color:red">Error: ${msg}</span>`
    }

    _render() {
        const converted = (this.amount * this.rate).toFixed(2)
        this.shadowRoot.innerHTML = `<input type='number' id="amount" value="${this.amount}" onchange="(e) => _amountUpdated()" /><label for="amount"> ${this.source}</label> = <span class="output">${converted}</span><span class="target"> ${this.target}</span>`
        this.shadowRoot.querySelector('#amount').addEventListener('input', this._onAmountChange.bind(this))
    }

    _onAmountChange(e) {
        const newValue = parseFloat(e.target.value)
        if (!isNaN(newValue)) {
            this.amount = newValue
        }
    }

    _renderConverted() {
        const converted = (this.amount * this.rate).toFixed(2)
        // this.shadowRoot.querySelector('span').textContent = `${converted} ${this.target}`
        const output = this.shadowRoot.querySelector('.output');
        if (output) {
            output.textContent = converted
        }
    }
}

customElements.define('currency-converter', CurrencyConverter)