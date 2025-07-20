/**
 * SignaturePad Web Component
 * A form-associated custom element that captures handwritten signatures
 * 
 * @customElement signature-pad
 * @extends HTMLElement
 * @csspart canvas - The signature drawing area
 * @csspart clear-button - The clear signature button
 * 
 * @fires signature-ready - When signature is captured and processed
 * @fires signature-cleared - When signature is cleared
 * 
 * @property {File} signatureFile - The captured signature as a PNG file
 * @property {HTMLCanvasElement} canvas - The drawing canvas element
 * @property {boolean} required - Whether a signature is required
 * 
 * @attr {boolean} required - Makes the signature required for form validation
 * 
 * @example
 * <!-- Basic usage -->
 * <signature-pad></signature-pad>
 * 
 * <!-- Required in a form -->
 * <form>
 *   <signature-pad required></signature-pad>
 *   <button type="submit">Submit</button>
 * </form>
 */
class TextareaCount extends HTMLTextAreaElement {
    #countWrapper
    #resetHandler

    get countElement() {
        return this.#countWrapper?.querySelector('.count')
    }

    get alertElement() {
        return this.#countWrapper?.querySelector('.alert')
    }

    constructor() {
        super()
    }

    connectedCallback() {
        // Generate unique ID if none exists
        this.id = this.id || `textarea-count-${Math.random().toString(36).slice(2)}`
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
                <div class="alert" role="alert"></div>
            `
        this.after(countWrapper)


        const updateCount = () => {
            const count = this.value.length
            countWrapper.querySelector('.count').textContent = count
            const maxlength = this.getAttribute('maxlength')
            if (maxlength && count >= maxlength) {
                countWrapper.querySelector('.alert').textContent = `Reached maximum length of ${maxlength} characters!`
                this.classList.add('error')
            } else {
                countWrapper.querySelector('.alert').textContent = ''
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
        }

        // Initial count
        updateCount()

        this.addEventListener('input', updateCount)

        // Listen for form reset
        if (this.form) {
            this._resetHandler = () => setTimeout(updateCount)
            this.form.addEventListener('reset', this._resetHandler)
        }

        countWrapper.querySelector('.alert').setAttribute('aria-live', 'polite')
        this.setAttribute('aria-describedby', 'count-' + Math.random().toString(36).slice(2))
        countWrapper.querySelector('.alert').id = this.getAttribute('aria-describedby')

        this.#countWrapper = countWrapper
    }

    disconnectedCallback() {
        if (this.#countWrapper) this.#countWrapper.remove()
        if (this.form && this.#resetHandler) {
            this.form.removeEventListener('reset', this.#resetHandler)
        }
    }

    static get observedAttributes() {
        return ['maxlength']
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'maxlength' && this.#countWrapper) {
            const maxSpan = this.#countWrapper.querySelector('.max')
            if (newValue) {
                if (!maxSpan) {
                    const count = this.#countWrapper.querySelector('.count')
                    const max = document.createElement('span')
                    max.className = 'max'
                    max.textContent = `/ ${newValue}`
                    count.after(max)
                } else {
                    maxSpan.textContent = `/ ${newValue}`
                }
            } else if (maxSpan) {
                maxSpan.remove()
            }
        }
    }
}

customElements.define('textarea-count', TextareaCount, { extends: 'textarea' })