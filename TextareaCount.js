/**
 * TextareaCount Web Component
 * 
 * A custom textarea element that displays a live character count and alerts when the maxlength is reached.
 * 
 * @customElement textarea-count
 * @extends HTMLTextAreaElement
 * 
 * @property {HTMLElement} countElement - The element displaying the current character count.
 * @property {HTMLElement} alertElement - The element displaying the alert message when maxlength is reached.
 * 
 * @attr {number} maxlength - The maximum number of characters allowed.
 * 
 * @event countchange - Fired whenever the character count changes.
 *   @property {string} textareaId - The ID of the textarea.
 *   @property {number} count - The current character count.
 *   @property {number} max - The maxlength value (if set).
 *   @property {number} remaining - The number of characters remaining before reaching maxlength.
 * 
 * @example
 * <textarea is="textarea-count" maxlength="100"></textarea>
 */
class TextareaCount extends HTMLTextAreaElement {
    #countWrapper
    #countElement
    #alertElement
    #maxElement
    #resetHandler
    
    constructor() {
        super()
        this._updateCount = this._updateCount.bind(this)
    }
    
    
    static get observedAttributes() {
        return ['maxlength']
    }

    // get countElement() {
    //     return this.#countElement
    // }

    // get alertElement() {
    //     return this.#alertElement
    // }

    static #sheet = new CSSStyleSheet()

    static {
        this.#sheet.replaceSync(`
            .textarea-count {
                font-size: 0.95em;
                color: #444;
                margin-bottom: 2px;
            }
            .textarea-count .max {
                color: #888;
                margin-left: 4px;
            }
            .alert {
                color: #d32f2f;
                font-size: 0.95em;
                margin-top: 2px;
                min-height: 1em;
                transition: color 0.2s;
            }
            .error {
                border-color: #d32f2f !important;
                background: #ffebee !important;
            }
        `)
    }

    connectedCallback() {
        // Generate unique ID if none exists
        this.id = this.id || `textarea-count-${Math.random().toString(36).slice(2)}`

        // Use a deterministic ID for aria-describedby and alert
        const alertId = `${this.id}-alert`

        const countWrapper = document.createElement('div')
        countWrapper.setAttribute('data-for', this.id)
        countWrapper.style.marginTop = 0
        countWrapper.innerHTML = `
                <div class="textarea-count">
                    Character count: <span class="count">0</span>
                    ${this.getAttribute('maxlength') ? 
                        `<span class="max">/ ${this.getAttribute('maxlength')}</span>` : 
                        ''
                    }
                </div>
                <div class="alert" id="${alertId}" role="alert" aria-live="polite"></div>
            `
        
        this.after(countWrapper)

        
        this.addEventListener('input', this._updateCount)
        
        // Listen for form reset
        if (this.form) {
            this._resetHandler = () => setTimeout(this._updateCount)
            this.form.addEventListener('reset', this._resetHandler)
        }
        
        // Set aria-describedby to deterministic alertId
        this.setAttribute('aria-describedby', alertId)
        
        this.#countWrapper = countWrapper
        this.#countElement = this.#countWrapper.querySelector('.count')
        this.#alertElement = this.#countWrapper.querySelector('.alert')
        this.#maxElement = this.#countWrapper.querySelector('.max')
        // Initial count
        this._updateCount()

        document.adoptedStyleSheets = [...document.adoptedStyleSheets, TextareaCount.#sheet]
    }

    disconnectedCallback() {
        // Clean up DOM elements
        if (this.#countWrapper) {
            this.#countWrapper.remove()
            this.#countWrapper = null
        }
        
        // Clean up event listeners
        if (this.form && this.#resetHandler) {
            this.form.removeEventListener('reset', this.#resetHandler)
            this.#resetHandler = null
        }
        this.removeEventListener('input', this._updateCount)
        
        // Clear references
        this.#countElement = null
        this.#alertElement = null
        this.#maxElement = null
    }


    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'maxlength' && this.#countWrapper) {
            if (newValue) {
                if (!this.#maxElement) {
                    const max = document.createElement('span')
                    max.className = 'max'
                    max.textContent = `/ ${newValue}`
                    this.#countElement.after(max)
                    this.#maxElement = max
                } else {
                    this.#maxElement.textContent = `/ ${newValue}`
                }
            } else if (this.#maxElement) {
                this.#maxElement.remove()
                this.#maxElement = null
            }
        }
    }

    _updateCount() {
        try {
            const count = this.value.length
            this.#countElement.textContent = count
            const maxlength = this.getAttribute('maxlength')
            if (maxlength && count >= maxlength) {
                this.#alertElement.textContent = 
                    `Reached maximum length of ${maxlength} characters!`
                this.classList.add('error')
            } else {
                this.#alertElement.textContent = ''
                this.classList.remove('error')
            }

            this.dispatchEvent(new CustomEvent('countchange', {
                detail: { 
                    textareaId: this.id,
                    count: this.value.length,
                    max: this.getAttribute('maxlength'),
                    remaining: this.getAttribute('maxlength') - this.value.length
                }
            }))
        } catch (error) {
            console.error('Error updating character count:', error)
            // Optionally reset to safe state
            this.#alertElement.textContent = 'Error updating character count'
        }
    }
}

customElements.define('textarea-count', TextareaCount, { extends: 'textarea' })