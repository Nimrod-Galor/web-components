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
        this._setupStyles()
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
            this.amount = this.textContent.trim() || 1;
        }
        return Number(this.getAttribute('amount'));
    }

    set amount(value) {
        this.setAttribute('amount', value)
    }

    _setupStyles() {
        this._mainSheet = new CSSStyleSheet();
        this._loadingSheet = new CSSStyleSheet();
        this._errorSheet = new CSSStyleSheet();

        // Main component styles
        this._mainSheet.replaceSync(`
            :host {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                font-family: var(--currency-font, system-ui, sans-serif);
                padding: 0.75rem;
                border: 1px solid var(--currency-border, #ddd);
                border-radius: var(--currency-radius, 8px);
                background: var(--currency-bg, #f9f9f9);
                box-sizing: border-box;
                width: 100%;
            }
            .input-group {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.5rem;
            }
            #amount {
                flex: 1;
                min-width: 80px;
                padding: 0.5rem;
                border: 1px solid var(--input-border, #ccc);
                border-radius: 4px;
                font-size: 1rem;
                box-sizing: border-box;
            }
            .currency-label {
                font-weight: 600;
                color: var(--label-color, #333);
                font-size: 0.9rem;
            }
            .output {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .output div {
                padding: 0.5rem;
                background: var(--output-bg, white);
                border-radius: 4px;
                border-left: 3px solid var(--accent-color, #007bff);
                font-weight: 600;
                font-size: 0.9rem;
            }
            @media (min-width: 600px) {
                :host {
                    flex-direction: row;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1rem;
                }
                .output {
                    flex-direction: row;
                    flex-wrap: wrap;
                }
                .output div {
                    font-size: 1rem;
                }
                .currency-label {
                    font-size: 1rem;
                }
            }
        `);

        // Loading styles
        this._loadingSheet.replaceSync(`
            .loading {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 1rem;
                color: var(--loading-color, #666);
            }
            .spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid var(--accent-color, #007bff);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `);

        // Error styles
        this._errorSheet.replaceSync(`
            .error {
                color: var(--error-color, #d32f2f);
                background: var(--error-bg, #ffebee);
                padding: 0.5rem;
                border-radius: 4px;
            }
            .retry-btn {
                margin-left: 1rem;
                padding: 0.25rem 0.5rem;
                background: var(--retry-bg, #007bff);
                color: var(--retry-color, white);
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
        `);
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
        if (!this.source || this.target.length === 0) {
            this._renderError('Source or target currency missing');
            return;
        }

        const symbols = this.target.join(',');
        const cacheKey = `rates-${this.source}-${symbols}`;
        const now = Date.now();
        
        // Check cache first (5-minute expiry)
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { data, expires } = JSON.parse(cached);
                if (expires > now) {
                    this._rates = data;
                    this._render();
                    return;
                }
            } catch (e) {
                // Ignore cache errors
            }
        }

        const url = `https://api.frankfurter.app/latest?from=${this.source}&symbols=${symbols}`;
        
        try {
            const res = await fetch(url);
            if (!res.ok) {
                this._renderError(`API error: ${res.status} ${res.statusText}`);
                return;
            }
            const data = await res.json();
            if (data && data.rates != null) {
                this._rates = data.rates;
                
                // Cache the rates
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: data.rates,
                    expires: now + (5 * 60 * 1000) // 5 minutes
                }));
                
                this._render();
            } else {
                this._renderError('Invalid API response');
            }
        } catch (err) {
            this._renderError('Network error. Failed to fetch rate');
        }
    }

    _renderLoading() {
        this.shadowRoot.adoptedStyleSheets = [this._loadingSheet];
        this.shadowRoot.innerHTML = `
            <div class="loading" aria-live="polite">
                <div class="spinner"></div>
                <span>Loading exchange rates...</span>
            </div>
        `;
    }

    _renderError(msg) {
        this.shadowRoot.adoptedStyleSheets = [this._errorSheet];
        this.shadowRoot.innerHTML = `
            <div class="error" role="alert" aria-live="assertive">
                <strong>Error:</strong> ${msg}
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        this.shadowRoot.querySelector('.retry-btn').addEventListener('click', () => {
            this._fetchConversionRate();
        });
    }

    _render() {
        this.shadowRoot.adoptedStyleSheets = [this._mainSheet];
        this.shadowRoot.innerHTML = `
            <div class="input-group">
                <input type='number' id="amount" value="${this.amount}" min="0" step="0.01" 
                       aria-label="Amount in ${this.source}" part="amount" />
                <span class="currency-label">${this.source}</span>
                <span>=</span>
            </div>
            <div class="output" aria-label="${this._summary()}" title="${this._summary()}" part="output">
                ${this._parseRates()}
            </div>
        `;
    
        this.shadowRoot.querySelector('#amount').addEventListener('input', this._onAmountChange.bind(this));
    }

    _onAmountChange(e) {
        const newValue = parseFloat(e.target.value)
        // Validate input
        if (isNaN(newValue) || newValue < 0) {
            e.target.setCustomValidity('Please enter a valid positive number');
            return;
        }
        
        e.target.setCustomValidity(''); // Clear validation error
        this.amount = newValue;
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

    _parseRates() {
        const formatter = new Intl.NumberFormat(this.locale, {
            style: 'currency',
            currency: 'USD', // Will be overridden per currency
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return this.target.map(target => {
            const rate = this._rates[target];
            if (!rate) {
                return `<div style="color: var(--error-color, #d32f2f)">No rate for ${target}</div>`;
            }
            
            const amount = Number(this.amount) * rate;
            
            try {
                // Format with proper currency
                const formatted = new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: target,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(amount);
                
                return `<div>${formatted}</div>`;
            } catch (e) {
                // Fallback if currency is not supported
                return `<div>${amount.toFixed(2)} ${target}</div>`;
            }
        }).join('') || `<div style="color: var(--error-color, #d32f2f)">No rates available</div>`;
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