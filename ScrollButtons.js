/**
 * @customElement scroll-buttons
 * @description
 *   A floating pair of scroll buttons for quickly navigating to the top or bottom of the page.
 *   The buttons are only visible when appropriate (top button after scrolling down, bottom button when not at the bottom).
 *
 * @cssprop --scroll-buttons-right - Distance from the right edge of the viewport (default: 50px)
 * @cssprop --scroll-buttons-z-index - Z-index for the button container (default: 9999)
 * @cssprop --scroll-buttons-bg - Button background color (default: #333)
 * @cssprop --scroll-buttons-bg-hover - Button background color on hover (default: #555)
 * @cssprop --scroll-buttons-color - Button text color (default: #fff)
 *
 * @example
 *   <scroll-buttons></scroll-buttons>
 *
 * @summary
 *   Provides accessible, mobile-friendly scroll-to-top and scroll-to-bottom buttons.
 */
class ScrollButtons extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._toggleButtons = this._toggleButtons.bind(this);
    }

    connectedCallback() {
        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                position: fixed;
                right: var(--scroll-buttons-right, 50px);
                z-index: var(--scroll-buttons-z-index, 9999);
                bottom: 0;
                pointer-events: none;
            }

            .btn {
                background: var(--scroll-buttons-bg, #333);
                color: var(--scroll-buttons-color, #fff);
                border-radius: 50%;
                padding: 12px 14px;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: background 0.3s;
                border: none;
                font-size: 1.3em;
                pointer-events: auto;
                outline: none;
                position: absolute; /* Use absolute instead of fixed */
            }

            .btn:hover, .btn:focus {
                background: var(--scroll-buttons-bg-hover, #555);
                transform: translateY(-2px);
            }

            .btn:active {
                transform: translateY(0);
            }

            .top-btn {
                bottom: 60px;
            }

            .bottom-btn {
                bottom: 10px;
            }

            @media (max-width: 600px) {
                :host {
                    right: 10px;
                }
                .btn {
                    padding: 10px 12px;
                    font-size: 1.1em;
                }
            }

            .btn:focus {
                background: var(--scroll-buttons-bg-hover, #555);
                transform: translateY(-2px);
                outline: 2px solid #fff;
                outline-offset: 2px;
            }
        `);
        this.shadowRoot.adoptedStyleSheets = [sheet];

        this.shadowRoot.innerHTML = `
            <button class="btn top-btn" title="Back to Top" aria-label="Scroll to top" tabindex="0">↑</button>
            <button class="btn bottom-btn" title="Go to Bottom" aria-label="Scroll to bottom" tabindex="0">↓</button>
        `;

        this.topButton = this.shadowRoot.querySelector('.top-btn');
        this.bottomButton = this.shadowRoot.querySelector('.bottom-btn');

        // Click handlers
        this.topButton.addEventListener('click', () => this._scrollToTop());

        this.bottomButton.addEventListener('click', () => this._scrollToBottom());

        // Keyboard accessibility
        // Simplified keyboard handler
        const handleKeydown = (e, action) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                action();
            }
        };

        this.topButton.addEventListener('keydown', (e) => 
            handleKeydown(e, () => this._scrollToTop())
        );
        this.bottomButton.addEventListener('keydown', (e) => 
            handleKeydown(e, () => this._scrollToBottom())
        );
        window.addEventListener('scroll', this._toggleButtons);
        window.addEventListener('resize', this._toggleButtons);
        this._toggleButtons();
    }

    disconnectedCallback() {
        window.removeEventListener('scroll', this._toggleButtons);
        window.removeEventListener('resize', this._toggleButtons);
    }

    _toggleButtons() {
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const docHeight = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
            const nearBottom = window.innerHeight + scrollY >= docHeight - 10;

            const canScroll = docHeight > window.innerHeight + 10;
            this.topButton.style.display = canScroll && scrollY > 300 ? 'inline-block' : 'none';
            this.bottomButton.style.display = canScroll && !nearBottom ? 'inline-block' : 'none';
        });
    };

    _scrollToTop() {
        const supportsSmooth = 'scrollBehavior' in document.documentElement.style;
        window.scrollTo({ 
            top: 0, 
            behavior: supportsSmooth ? 'smooth' : 'auto' 
        });
    }

    _scrollToBottom() {
        const supportsSmooth = 'scrollBehavior' in document.documentElement.style;
        window.scrollTo({ 
            top: document.body.scrollHeight,
            behavior: supportsSmooth ? 'smooth' : 'auto'
        });
    }
}

customElements.define('scroll-buttons', ScrollButtons);