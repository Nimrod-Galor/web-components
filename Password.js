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
    }

    #visible = false;

    #toggleVisibility() {
        this.#visible = !this.#visible;
        this._input.type = this.#visible ? 'text' : 'password';
        const btn = this.shadowRoot.querySelector('.toggle');
        btn.classList.toggle('showing', this.#visible);
        btn.setAttribute('aria-label', 
            this.#visible ? 'Hide password' : 'Show password'
        )
    }

    static get observedAttributes() {
        return ['value', 'placeholder', 'required', 'disabled', 'minlength', 'maxlength', 'title']
    }

    get value() {
        return this.getAttribute('value') || ''
    }

    set value(v) {
        // Sync internal input first
        if (this._input) {
            this._input.value = v;
        }
        
        // sync the FACE “submitted” value:
        this._internals.setFormValue(v)

        // if the value is not already set as an attribute, set it
        if (this.getAttribute('value') !== v) {
            // sync the attribute
            this.setAttribute('value', v)
        }

        // handle validation
        if (this.required && this._input.value === '') {
            this._internals.setValidity(
                { valueMissing: true }, 
                "Password is required", 
                this._input
            )
        }else if(this._input.value.length < this.minlength) {
            this._internals.setValidity(
                { tooShort: true }, 
                `Password must be at least ${this.minlength} characters long`, 
                this._input
            )
        }else if(this._input.value.length > this.maxlength) {
            this._internals.setValidity(
                { tooLong: true }, 
                `Password must be no more than ${this.maxlength} characters long`, 
                this._input
            )
        }else{
            this._internals.setValidity({})
        }
    }

    get required() {
        return this.hasAttribute('required')
    }

    get disabled() {
        return this.hasAttribute('disabled')
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

        // Create a shadow root
        const shadow = this.attachShadow({ mode: "open", delegatesFocus: true })

        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(`
            :host {
                --password-border-color: #666;
                --password-border-radius: 2px;
                --button-size: 32px;
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
            `)

        shadow.adoptedStyleSheets = [sheet]

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
        
        input.addEventListener('input', (e) => {
            // Prevent infinite loops
            if (e.isTrusted) {
                this.value = this._input.value;
            }
        })
        this._input = input
        wrapper.appendChild(input)
        
        const btn = document.createElement("button")
        btn.type = "button"
        btn.setAttribute("aria-label", "Toggle password visibility")
        btn.setAttribute("title", "Toggle password visibility")
        btn.className = "toggle"
        btn.addEventListener('click', this.#toggleVisibility.bind(this))
        wrapper.appendChild(btn)
        
        // Append the wrapper to the shadow root
        shadow.appendChild(wrapper)
        // set input attributes
        // this.value = input.value
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal && oldVal !== newVal) {
            switch (name) {
                case 'required':
                case 'disabled':
                    this._input[name] = this.hasAttribute(name) // sync required/disabled
                break
                case 'minlength':
                case 'maxlength':
                    this._input[name] = newVal ? Number(newVal) : '' // sync minlength/maxlength
                break
                case 'value':
                    this.value = newVal; // sync value
                default:
                    this._input[name] = newVal; // sync other attributes
                break
            }
            this.value = newVal;
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

    
}

customElements.define("input-password", PasswordToggle)