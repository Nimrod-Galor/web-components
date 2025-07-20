class BreadcrumbTrail extends HTMLElement {
    constructor() {
        super()
    }

    static get observedAttributes() {
        return ['home-label', 'separator']
    }

    get homeLabel() {
        return this.getAttribute('home-label') || 'Home'
    }

    get separator() {
        return this.getAttribute('separator') || '/';
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' })
        this.renderFromUrl()
        window.addEventListener('popstate', this._onPopState = () => this.renderFromUrl())
    }

    disconnectedCallback() {
        window.removeEventListener('popstate', this._onPopState);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'home-label' && oldVal && oldVal !== newVal) {
            this.renderFromUrl()
        }
    }
    renderFromUrl() {
        try{
            // Parse the current URL path
            // *********** comment out the next line to use the actual URL !!!!!!!!!!!!!!!!!!!
            const segments = 'Web/API/Web_Components'
            // *********** Uncomment the next line to use the actual URL !!!!!!!!!!!!!!!!!!
            // const segments = window.location.pathname
            .split('/')
            .filter(Boolean) // remove empty parts
            .map(decodeURIComponent); // Handle URL-encoded segments

            const trail = [{ label: this.homeLabel, href: '/' }]
            let path = ''

            segments.forEach((segment, index) => {
                path += `/${segment}`
                trail.push({
                    label: this.formatLabel(segment),
                    href: index < segments.length - 1 ? path : null, // only intermediate ones are links
                })
            })

            this._render(trail)
        } catch (error) {
            console.error('Error parsing URL:', error);
            // Fallback to simple home link
            this._render([{ label: this.homeLabel, href: '/' }]);
        }
    }

    formatLabel(segment) {
        // Convert kebab-case or snake_case to Title Case
        return segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
    }

    _render(trail) {
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                nav {
                    font-family: sans-serif;
                    font-size: 0.9rem;
                }
                ol {
                    display: flex;
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                li + li::before {
                    content: "${this.separator}";
                    padding: 0 0.35em;
                    color: #999;
                }
                a {
                    text-decoration: none;
                    color: blue;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
            <nav aria-label="Breadcrumb">
                <ol>
                    ${trail.map(item => `
                        <li>
                            ${item.href
                                ? `<a href="${item.href}">${item.label}</a>` 
                                : `<span aria-current="page">${item.label}</span>`
                            }
                        </li>
                    `).join('')}
                </ol>
            </nav>
            `
        // Use replaceChildren for better performance than innerHTML
        this.shadowRoot.replaceChildren(template.content.cloneNode(true))
    }
}

  customElements.define('breadcrumb-trail', BreadcrumbTrail)