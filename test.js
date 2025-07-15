class Test extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 10px;
                    border: 1px solid #ccc;
                }
            </style>
            <p></p>
        `;
    }
}

customElements.define('test-component', Test);