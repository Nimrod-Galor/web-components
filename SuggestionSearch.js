/**
 * SuggestionSearch web component - A form-associated custom element that provides
 * autocomplete functionality with API integration, local caching, and accessibility support.
 * 
 * @extends HTMLElement
 * @example
 * <suggestion-search 
 *   api-endpoint="https://api.example.com/search?q=" 
 *   min-length="2" 
 *   max-results="5"
 *   required>
 * </suggestion-search>
 */
class SuggestionSearch extends HTMLElement {
    static formAssociated = true

    static {
        this.CACHE_SIZE = 20
        this.DEBOUNCE_DELAY = 300
        this.MIN_QUERY_LENGTH = 1
        this.MAX_RESULTS = 10
    }

    constructor() {
        super()
        // Bind once in constructor
        // _handleInput = this._handleInput.bind(this)
        // _handleKeydown = this._handleKeydown.bind(this)
        // _handleClick = this._handleClick.bind(this)
    }

    get value() {
        return this.input?.value || ''
    }

    set value(val) {
        if (this.input){
            this.input.value = val
        }

        this._updateFormValue(val)
    }

    get form() {
        return this._internals?.form
    }

    get name() {
        return this.getAttribute('name')
    }

    get type() {
        return 'text'
    }

    get validity() {
        return this._internals?.validity
    }

    get validationMessage() {
        return this._internals?.validationMessage
    }

    get willValidate() {
        return this._internals?.willValidate
    }

    
    set loading(value) {
        this._loading = Boolean(value)
        this._showSpinner(this._loading)
        this.input.setAttribute('aria-busy', String(this._loading))
    }

    get loading() {
        return this._loading
    }

    get cache() {
        try {
            const stored = JSON.parse(localStorage.getItem(this.cacheKey)) || []
            const oneDay = 24 * 60 * 60 * 1000
            return stored.filter(item => Date.now() - item.timestamp < oneDay)
        } catch (e) {
            console.warn('Cache read error:', e)
            return []
        }
    }

    set cache(value) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(value))
        } catch (e) {
            console.warn('Cache write error:', e)
        }
    }


    get apiEndpoint(){
        return this.getAttribute('api-endpoint') || ''
    }

    get minLength() {
        return parseInt(this.getAttribute('min-length') || SuggestionSearch.MIN_QUERY_LENGTH, 10)
    }

    get maxResults() {
        return parseInt(this.getAttribute('max-results') || SuggestionSearch.MAX_RESULTS, 10)
    }

    checkValidity() {
        return this._internals?.checkValidity()
    }

    reportValidity() {
        return this._internals?.reportValidity()
    }

    static _uuid() {
        if (window.crypto?.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    connectedCallback() {
        this._internals = this.attachInternals?.()
        this.attachShadow({ mode: 'open' })

        this.cacheKey = 'search-queries'
        // this.cache = JSON.parse(localStorage.getItem(this.cacheKey)) || []
        
        this.clearOnSubmit = this.hasAttribute('clear-on-submit')
        this.debounceTimer = null
        this.activeIndex = -1
        this.isLoading = false

        const id = `input-${SuggestionSearch._uuid()}`
        const listId = `suggestions-${SuggestionSearch._uuid()}`

        this.shadowRoot.innerHTML = `
            <style>
            :host {
            --input-bg: white;
            --input-color: black;
            --list-bg: white;
            --list-hover-bg: #f0f0f0;
            --border-color: #ccc;

            position: relative;
            display: inline-block;
            font-family: sans-serif;
            }

            input {
            width: 200px;
            padding: 8px;
            box-sizing: border-box;
            background: var(--input-bg);
            color: var(--input-color);
            border: 1px solid var(--border-color);
            }

            ul {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--list-bg);
            border: 1px solid var(--border-color);
            margin: 0;
            padding: 0;
            list-style: none;
            max-height: 150px;
            overflow-y: auto;
            z-index: 1000;
            }

            li {
            padding: 8px;
            cursor: pointer;
            }

            li.active,
            li:hover {
            background-color: var(--list-hover-bg);
            }

            .spinner {
            position: absolute;
            right: 10px;
            top: 10px;
            width: 16px;
            height: 16px;
            border: 2px solid #ccc;
            border-top-color: #000;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            }

            .spinner.hidden {
            display: none;
            }

            @keyframes spin {
            to { transform: rotate(360deg); }
            }

            noscript {
            display: none;
            }

            // li.cache {
            // color: #000;
            // font-style: italic;
            // background: #f7f7f7;
            // }
            li.cache::before {
                display: inline-block;
                vertical-align: middle;
                margin-right: 4px;
                content: '';
                width: 16px;
                height: 16px;
                background: no-repeat center/contain;
                /* SVG path as data URI */
                background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='16' viewBox='0 0 24 24' width='16' fill='%231f1f1f'><path d='M0 0h24v24H0z' fill='none'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'/><path d='M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z'/></svg>");
            }
        </style>

        <input type="text" id="${id}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${listId}">
        <div class="spinner hidden" aria-hidden="true"></div>
        <ul id="${listId}" role="listbox" hidden></ul>
        `

        this.input = this.shadowRoot.querySelector('input')
        this.list = this.shadowRoot.querySelector('ul')
        this.spinner = this.shadowRoot.querySelector('.spinner')

        // Store bound handlers
        this._boundHandleInput = () => this._handleInput()
        this._boundHandleKeydown = e => this._handleKeydown(e)
        this._boundHandleClick = e => this._handleClick(e)
        
        this.input.addEventListener('input', this._boundHandleInput)
        this.input.addEventListener('keydown', this._boundHandleKeydown)
        this.list.addEventListener('click', this._boundHandleClick)

        this._updateFormValue(this.input.value)

        const form = this.form
        if (form && this.clearOnSubmit) {
            // Store the bound handler so it can be removed later
            this._boundSubmitHandler = this._handleSubmit.bind(this)
            form.addEventListener('submit', this._boundSubmitHandler)
        }
    }

    disconnectedCallback() {
        this.input.removeEventListener('input', this._boundHandleInput)
        this.input.removeEventListener('keydown', this._boundHandleKeydown)
        this.list.removeEventListener('click', this._boundHandleClick)
        if (this.form && this.clearOnSubmit && this._boundSubmitHandler) {
            this.form.removeEventListener('submit', this._boundSubmitHandler)
        }
        clearTimeout(this.debounceTimer)
    }
 
    _updateFormValue(val) {
        if (this._internals) {
            this._internals.setFormValue(val)
        }
    }

    _validateInput() {
        if (!this._internals) return true  // Guard clause
    
        if (this.hasAttribute('required') && !this.value.trim()) {
            this._internals.setValidity(
                { valueMissing: true }, 
                'Please enter a search term',
                this.input  // Reference element for focus
            )
            return false
        }
        this._internals.setValidity({})
        return true
    }

    _handleInput() {
        const val = this.input.value.trim().toLowerCase()
        this._updateFormValue(val)
        if (val.length < this.minLength) {
            this.list.hidden = true
            return
        }

        clearTimeout(this.debounceTimer)
        this.debounceTimer = setTimeout(() => {
            this.fetchSuggestions(val)
        }, SuggestionSearch.DEBOUNCE_DELAY)
    }

  
    _handleKeydown(e) {
        const items = [...this.list.querySelectorAll('li')]
        if (!items.length) return

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault()
                this.activeIndex = (this.activeIndex + 1) % items.length
                break
            case 'ArrowUp':
                e.preventDefault()
                this.activeIndex = (this.activeIndex - 1 + items.length) % items.length
                break
            case 'Home':
                e.preventDefault()
                this.activeIndex = 0
                break
            case 'End':
                e.preventDefault()
                this.activeIndex = items.length - 1
                break
            case 'Tab': // ✅ Add Tab support
                if (this.activeIndex >= 0 && items[this.activeIndex]) {
                    e.preventDefault()
                    this._selectSuggestion(items[this.activeIndex].textContent)
                }
                return
            case 'Enter':
                e.preventDefault()
                if (this.activeIndex >= 0 && items[this.activeIndex]) {
                    this._selectSuggestion(items[this.activeIndex].textContent)
                } else {
                    this._emitSearch(this.value)
                }
                return
            case 'Escape':
                this.list.hidden = true
                this.input.setAttribute('aria-expanded', 'false')
                this.input.removeAttribute('aria-activedescendant')
                this.activeIndex = -1
                return
        }
        
        // Update active state and ARIA
        this._updateActiveState(items)
    }

    _handleClick(e) {
        if (e.target.tagName === 'LI') {
            this._selectSuggestion(e.target.textContent)
        }
    }

    _handleSubmit(){
        this.input.value = ''
        this._updateFormValue('')
    }

    formResetCallback() {
        this.input.value = ''
        this._updateFormValue('')
        this.list.hidden = true
        this.input.setAttribute('aria-expanded', 'false')
        this.input.removeAttribute('aria-activedescendant')
    }

    async fetchSuggestions(query) {
        this._showSpinner(true)

        let apiSuggestions = []
        if (this.apiEndpoint) {
            try {
                const res = await fetch(this.apiEndpoint + encodeURIComponent(query))
                const json = await res.json()
                if (Array.isArray(json)) {
                    apiSuggestions = json
                } else if (Array.isArray(json.results)) {
                    apiSuggestions = json.results
                } else if (typeof this.mapApiResults === 'function') {
                    apiSuggestions = this.mapApiResults(json)
                } else {
                    apiSuggestions = []
                }
            } catch (e) {
                console.warn('API error:', e)
            }
        }

        // Mark API suggestions
        const apiItems = apiSuggestions.map(q => ({ value: q, type: 'api' }))
        // Mark cache suggestions, but exclude duplicates
        const cacheMatches = this.cache
            .map(item => item.query)
            .filter(q => q.toLowerCase().includes(query.toLowerCase()) && !apiSuggestions.includes(q))
            .map(q => ({ value: q, type: 'cache' }))

        // Put cache items before API suggestions
        const combined = [...cacheMatches, ...apiItems].slice(0, this.maxResults)

        this.renderSuggestions(combined)
        this._showSpinner(false)
    }

    _escapeHTML(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
    }

    renderSuggestions(suggestions) {
        this.activeIndex = -1

        if (!suggestions.length) {
            this.list.hidden = true
            this.input.setAttribute('aria-expanded', 'false')
            this.input.removeAttribute('aria-activedescendant')
            return
        }

        this.list.innerHTML = suggestions.map((item, i) =>
          `<li id="option-${i}" role="option" class="${item.type === 'cache' ? 'cache' : ''}" ${i === this.activeIndex ? 'aria-selected="true"' : ''}>
              ${this._escapeHTML(item.value)}
          </li>`
        ).join('')
        this.list.hidden = false
        this.input.setAttribute('aria-expanded', 'true')
        this.input.setAttribute('aria-controls', this.list.id)
    }


    _selectSuggestion(text) {
        this.input.value = text.trim()
        this.activeIndex = -1
        this.input.removeAttribute('aria-activedescendant')
        this._saveQuery(text)
        this._updateFormValue(text)
        this._emitSearch(text)
        this.list.hidden = true
        this.input.setAttribute('aria-expanded', 'false')
    }

    _saveQuery(query) {
        if (!query || this.cache.some(item => item.query.toLowerCase() === query.toLowerCase())) return
    
        const current = this.cache  // Get current cache
        const cacheItem = { query, timestamp: Date.now() }
    
        const updated = [cacheItem, ...current].slice(0, SuggestionSearch.CACHE_SIZE)
        this.cache = updated  // Use setter correctly
    }


    _emitSearch(value) {
        this._saveQuery(value) // Save every search to cache
        this.dispatchEvent(new CustomEvent('search', {
            detail: { value },
            bubbles: true,
            composed: true
        }))
    }

    _showSpinner(show) {
        this.spinner.classList.toggle('hidden', !show)
    }

    focus() {
        this.input?.focus()
    }

    blur() {
        this.input?.blur()
    }

    _getFromCache(query) {
        return this.cache
            .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
            .map(item => item.query)
    }

    _combineSuggestions(apiResults, cacheResults) {
        return [...new Set([...apiResults, ...cacheResults])]
            .slice(0, this.maxResults)
    }

    _updateActiveState(items) {
        items.forEach((li, i) => {
            li.classList.toggle('active', i === this.activeIndex)
        })
        if (this.activeIndex >= 0 && items[this.activeIndex]) {
            this.input.setAttribute('aria-activedescendant', items[this.activeIndex].id)
            // Optionally scroll into view
            items[this.activeIndex].scrollIntoView({ block: 'nearest' })
        } else {
            this.input.removeAttribute('aria-activedescendant')
        }
    }

}

customElements.define('suggestion-search', SuggestionSearch)

