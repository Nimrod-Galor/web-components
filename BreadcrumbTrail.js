/**
 * @customElement breadcrumb-trail
 * @description Displays a breadcrumb navigation trail based on current URL
 * @attr {string} home-label - Label for the home/root link (default: "Home")
 * @attr {string} separator - Separator between breadcrumb items (default: "/")
 * @example <breadcrumb-trail home-label="Start" separator=">"></breadcrumb-trail>
 */

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
        this._renderFromUrl()
        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            nav {
                font-family: var(--breadcrumb-font, system-ui, sans-serif);
                font-size: var(--breadcrumb-font-size, 0.8rem);
                line-height: 1.5;
            }
            ol {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.25rem;
                list-style: none;
                padding: 0;
                margin: 0;
            }
            a {
                text-decoration: none;
                color: var(--breadcrumb-link-color, #007bff);
            }
            a:hover {
                text-decoration: underline;
            }
            li + li::before {
                content: "${this.separator}";
                padding: 0 0.35em;
                color: var(--breadcrumb-separator-color, #6c757d);
            }
            
            @media (max-width: 600px) {
                nav { font-size: 0.8rem; }
                li + li::before { padding: 0 0.2em; }
            }
            @media (min-width: 600px) {
                nav { 
                    font-size: var(--breadcrumb-font-size, 0.9rem);
                }
                li + li::before { 
                    padding: 0 0.35em; 
                }
            }
        `)
        this.shadowRoot.adoptedStyleSheets = [sheet]

        window.addEventListener('popstate', this._onPopState = () => this._renderFromUrl())
    }

    disconnectedCallback() {
        window.removeEventListener('popstate', this._onPopState);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal && this.shadowRoot) {
            if (name === 'home-label' || name === 'separator') {
                this._renderFromUrl(); // Handle both attributes
            }
        }
    }

    _renderFromUrl() {
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
                    label: this._formatLabel(segment),
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

    _formatLabel(segment) {
        try {
            return segment
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, char => char.toUpperCase());
        } catch (error) {
            console.warn('Error formatting label:', error);
            return segment; // Fallback to original
        }
    }

    _render(trail) {
        // Escape HTML to prevent XSS
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        const template = document.createElement('template');
        template.innerHTML = `
            <nav aria-label="Breadcrumb">
                <ol>
                    ${trail.map(item => `
                        <li>
                            ${item.href
                                ? `<a href="${item.href}">${escapeHtml(item.label)}</a>` 
                                : `<span aria-current="page">${escapeHtml(item.label)}</span>`
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