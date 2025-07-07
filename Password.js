class PasswordToggle extends HTMLElement {
    // tells the UA we’re a FACE
    static formAssociated = true;

    constructor() {
        super()
    }

    // reflect value 
    get value() {           // read like <input>.value
        return this._input.value;
    }

    set value(v) {          // write like <input>.value
        this._input.value = v;
        // sync the FACE “submitted” value:
        this._internals.setFormValue(v);
        // keep attribute <my-text value="..."> in sync (optional)
        this.setAttribute('value', v);
    }
    
    
    connectedCallback() {
        this._internals = this.attachInternals();
        // Create a shadow root
        const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });

        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`.wrapper {display: flex;}
            #password{ border:1px solid #666; border-radius:2px 0 0 2px; border-right:none;}
            #toggle{
                cursor: pointer;
                border:1px solid #666; 
                border-left: 1px solid #999;
                border-radius: 0 2px 2px 0;
            }`)

        shadow.adoptedStyleSheets = [sheet];

        // Create the input and button elements
        const input = document.createElement("input");
        input.type = "password";
        // input.id = "password";
        input.name = "password";
        input.setAttribute("placeholder", this.getAttribute("placeholder") || '');
        input.setAttribute("aria-label", "Password input");
        input.setAttribute("title", this.getAttribute("title") || "Password input");
        input.className = "password";
        input.value = this.getAttribute("value") || '';

        const button = document.createElement("button");
        button.id = "toggle";
        button.setAttribute("aria-label", "Toggle password visibility");
        button.setAttribute("type", "button");
        button.setAttribute("title", "Toggle password visibility");
        button.className = "toggle";
        button.onclick = () => {    
            if (input.type === "password") {
                input.type = "text";
                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
                                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                                            <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                                            </svg>`
            } else {
                input.type = "password";
                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>`
            }
        }
        // Set the initial button content
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/></svg>`;

        // Create a wrapper div
        const wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        wrapper.appendChild(input);
        wrapper.appendChild(button);

        // Append the wrapper to the shadow root
        shadow.appendChild(wrapper);

        this._input = input;
        this._input.addEventListener('input', () => { this.value = this._input.value; });
    }

    // required FACE plumbing
    formDisabledCallback(disabled) {        // sync disabled state
        this._input.disabled = disabled;
    }

    formResetCallback() {                   // behave on <form>.reset()
        this.value = '';
    }

    formStateRestoreCallback(state/*, reason*/) {  // page restore / BF‑cache
        this.value = state;
    }

    //  make focus() behave
    focus() {
        this._input.focus();
    }
}

customElements.define("input-password", PasswordToggle)