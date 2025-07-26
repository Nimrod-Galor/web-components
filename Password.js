/**
 * PasswordToggle Web Component
 * A form-associated custom element that provides a password input with show/hide functionality
 * 
 * @customElement input-password
 * @extends HTMLElement
 * @csspart wrapper - The container element for input and toggle button
 * @csspart password - The password input field
 * @csspart toggle - The show/hide toggle button
 * 
 * @property {string} value - The current password value
 * @property {boolean} required - Whether the password is required
 * @property {boolean} disabled - Whether the input is disabled
 * @property {string} placeholder - Placeholder text
 * @property {number} minlength - Minimum password length
 * @property {number} maxlength - Maximum password length
 * 
 * @attr {string} value - Password value
 * @attr {boolean} required - Makes the password required
 * @attr {boolean} disabled - Disables the input
 * @attr {string} placeholder - Sets placeholder text
 * @attr {number} minlength - Sets minimum length
 * @attr {number} maxlength - Sets maximum length
 * @attr {string} title - Sets the input title/tooltip
 * 
 * @fires input - When the password value changes
 * @fires change - When the password value is committed
 * 
 * @cssprop --password-border-color - Border color (default: #666)
 * @cssprop --password-border-radius - Border radius (default: 2px)
 * @cssprop --button-size - Size of toggle button (default: 32px)
 * 
 * @example
 * <input-password
 *   required
 *   minlength="8"
 *   maxlength="32"
 *   placeholder="Enter password">
 * </input-password>
 */
class PasswordToggle extends HTMLElement {
    // enable form association
    static formAssociated = true

    constructor() {
        super()
        this.attachShadow({ mode: "open", delegatesFocus: true })
        this._onInputHandler = this._onInputHandler.bind(this)
        this._onChangeHandler = this._onChangeHandler.bind(this)
        this._toggleVisibility = this._toggleVisibility.bind(this)
    }

    #visible = false;

    static get observedAttributes() {
        return ['value', 'placeholder', 'required', 'disabled', 'minlength', 'maxlength', 'title', 'pattern']
    }

    get value() {
        return this.getAttribute('value') || ''
    }

    set value(v) {
        if (this._input) {
            this._input.value = v;
        }
        this._internals.setFormValue(v);
        if (this.getAttribute('value') !== v) {
            this.setAttribute('value', v);
        }
        this._validateInput(); // Add this line
    }

    get required() {
        return this.hasAttribute('required')
    }

    set required(value) {
        if (value) {
            this.setAttribute('required', '');
        } else {
            this.removeAttribute('required');
        }
        if (this._input) {
            this._input.required = value;
        }
    }

    get disabled() {
        return this.hasAttribute('disabled')
    }

    set disabled(value) {
        if (value) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
        if (this._input) {
            this._input.disabled = value;
        }
    }

    get placeholder() {
        return this.getAttribute('placeholder') || ''
    }

    set placeholder(value) {
        this.setAttribute('placeholder', value)
    }

    get minlength() {
        return this.getAttribute('minlength') || ''
    }

    set minlength(value) {
        this.setAttribute('minlength', value)
    }

    get maxlength() {
        return this.getAttribute('maxlength') || ''
    }

    set maxlength(value) {
        this.setAttribute('maxlength', value)
    }
    
    get pattern() {
        return this.getAttribute('pattern') || '';
    }

    set pattern(value) {
        this.setAttribute('pattern', value);
        if (this._input) {
            this._input.pattern = value;
        }
    }

    checkValidity() {
        return this._internals.checkValidity()
    }

    reportValidity() {
        return this._internals.reportValidity()
    }

    //  make focus() behave
    focus() {
        this._input.focus()
    }
    
    connectedCallback() {
        this._internals = this.attachInternals()
        this.tabIndex = 0


        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(`
            :host {
                --password-border-color: #666;
                --password-border-radius: 2px;
                --button-size: 32px;
                --error-color: #dc3545;
                --error-shadow: rgba(220, 53, 69, 0.25);
                display: inline-block;
            }
            
            .wrapper {
                display: flex;
                align-items: stretch;
            }
            .password {
                border: 1px solid var(--password-border-color);
                border-radius: var(--password-border-radius) 0 0 var(--password-border-radius);
                border-right: none;
                padding: 4px 8px;
                min-width: 200px;
            }
            .toggle {
                cursor: pointer;
                border:1px solid #666 ;
                border-left: 1px solid #999;
                border-radius: 0 2px 2px 0;
                width: 32px;
                height: 32px;
                background: no-repeat center/20px;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-eye' viewBox='0 0 16 16'%3E%3Cpath d='M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z'/%3E%3Cpath d='M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0'/%3E%3C/svg%3E");
            }
            .toggle.showing {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-eye-slash' viewBox='0 0 16 16'%3E%3Cpath d='M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z'/%3E%3Cpath d='M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829'/%3E%3Cpath d='M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z'/%3E%3C/svg%3E");
            }
            .password.invalid {
                border-color: var(--error-color);
                box-shadow: 0 0 0 0.2rem var(--error-shadow);
            }
            
            .toggle:hover {
                background-color: #f8f9fa;
            }
            
            .toggle:focus {
                outline: 2px solid #007bff;
                outline-offset: 2px;
            }
            `)

        this.shadowRoot.adoptedStyleSheets = [sheet]

        // Create a wrapper div
        const wrapper = document.createElement("div")
        wrapper.className = "wrapper"

        // Create the input and button elements
        const input = document.createElement("input")
        input.type = "password"
        input.setAttribute("placeholder", this.getAttribute("placeholder") || '')
        input.setAttribute("aria-label", "Password input")
        input.setAttribute("title", this.getAttribute("title") || "Password input")
        input.required = this.hasAttribute("required")
        input.disabled = this.hasAttribute("disabled")
        input.className = "password"
        input.value = this.getAttribute("value") || ''
        
        input.addEventListener('input', this._onInputHandler)
        input.addEventListener('change', this._onChangeHandler)
        this._input = input
        wrapper.appendChild(input)
        
        const btn = document.createElement("button")
        btn.type = "button"
        btn.setAttribute("aria-label", "Show password")
        btn.setAttribute("title", "Show password")
        btn.setAttribute("tabindex", "-1"); // Prevent double tab stop
        btn.className = "toggle"
        btn.addEventListener('click', this._toggleVisibility)
        wrapper.appendChild(btn)
        
        // Append the wrapper to the shadow root
        this.shadowRoot.appendChild(wrapper)
    }

    disconnectedCallback() {
        // Clean up event listeners
        if (this._input) {
            this._input.removeEventListener('input', this._onInputHandler)
            this._input.removeEventListener('change', this._onChangeHandler)
        }
        const btn = this.shadowRoot?.querySelector('.toggle')
        if (btn) {
            btn.removeEventListener('click', this._toggleVisibility)
        }
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (!this._input) return;
        
        // Remove the oldVal check to handle initial attributes
        if (oldVal !== newVal) {
            switch (name) {
                case 'required':
                case 'disabled':
                    this._input[name] = this.hasAttribute(name);
                    break;
                case 'minlength':
                case 'maxlength':
                    this._input[name] = newVal ? Number(newVal) : '';
                    break;
                case 'value':
                    this.value = newVal;
                    break;
                default:
                    this._input[name] = newVal;
            }
            // Remove redundant value update
            if (name !== 'value') {
                this.value = this._input.value;
            }
        }
        if (name === 'required' || name === 'minlength' || name === 'maxlength') {
            this._validateInput();
        }
    }

    // required FACE plumbing
    formDisabledCallback(disabled) {        // sync disabled state
        this._input.disabled = disabled
    }

    formResetCallback() {                   // behave on <form>.reset()
        this.value = ''
    }

    formStateRestoreCallback(state/*, reason*/) {  // page restore / BF‑cache
        this.value = state
    }

    formStateRestore() {                   // return the value to restore
        return this.value
    }

    _validateInput() {
        // Early return if input not initialized
        if (!this._input) return;

        const value = this._input.value;
        const minLen = Number(this.minlength);
        const maxLen = Number(this.maxlength);
        const pattern = this.pattern;

        // Build validation state object
        const validityState = {
            valueMissing: this.required && !value,
            tooShort: minLen && value && value.length < minLen,
            tooLong: maxLen && value && value.length > maxLen,
            patternMismatch: pattern && value && !new RegExp(pattern).test(value)
        };

        // Determine if there are any validation errors
        const hasError = Object.values(validityState).some(Boolean);

        if (hasError) {
            let message = '';
            
            // Generate appropriate error message
            if (validityState.valueMissing) {
                message = 'Password is required';
            } else if (validityState.tooShort) {
                message = `Password must be at least ${minLen} characters`;
            } else if (validityState.tooLong) {
                message = `Password cannot exceed ${maxLen} characters`;
            } else if (validityState.patternMismatch) {
                message = this.getAttribute('title') || 'Password does not match required format';
            }

            // Set validity state with error
            this._internals.setValidity(validityState, message, this._input);
            
            // Update visual feedback
            this._input.classList.add('invalid');
        } else {
            // Clear validity state
            this._internals.setValidity({});
            this._input.classList.remove('invalid');
        }

        return !hasError;
    }

    _onInputHandler = (e) => {
        if (e.isTrusted) {
            this.value = this._input.value;
            this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }
    }

    _onChangeHandler = (e) => {
        if (e.isTrusted) {
            this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        }
    }

    _toggleVisibility() {
        this.#visible = !this.#visible;
        this._input.type = this.#visible ? 'text' : 'password';
        const btn = this.shadowRoot.querySelector('.toggle');
        btn.classList.toggle('showing', this.#visible);
        btn.setAttribute('aria-label', 
            this.#visible ? 'Hide password' : 'Show password'
        )
    }
}

customElements.define("input-password", PasswordToggle)