/**
 * PopupInfo Web Component
 * Creates an information icon with a hoverable/focusable tooltip
 * 
 * @customElement popup-info
 * @extends HTMLElement
 * @csspart wrapper - The container element
 * @csspart icon - The information icon element
 * @csspart info - The tooltip content element
 * 
 * @property {string} data-text - The text to display in the tooltip
 * 
 * @attr {string} data-text - Text content for the tooltip
 * 
 * @cssprop --popup-bg - Background color of tooltip (default: white)
 * @cssprop --popup-border - Border color of tooltip (default: #000)
 * @cssprop --popup-radius - Border radius of tooltip (default: 10px)
 * @cssprop --popup-shadow - Box shadow of tooltip (default: 0 2px 4px rgba(0,0,0,0.2))
 * @cssprop --popup-transition - Transition duration for tooltip (default: 0.6s)
 * 
 * @example
 * <popup-info data-text="More information here"></popup-info>
 */
class PopupInfo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // Store element references
    this._icon = null;
    this._info = null;
    this._wrapper = null;

    // Bind methods
    this._onKeydownHandler = this._onKeydown.bind(this);
    this._onBlurHandler = this._onBlur.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
  }

  static get observedAttributes() {
    return ['data-text', 'position'];
  }

  get position() {
    return this.getAttribute('position') || 'top';
  }
  set position(val) {
    if (val) {
      this.setAttribute('position', val);
    } else {
      this.removeAttribute('position');
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    try {
      if (name === 'data-text' && this._info) {
        const text = (newVal?.trim() || '').replace(/[<>]/g, ''); // Basic sanitization
        this._info.textContent = text;
        // Hide tooltip if text is empty
        if (!text) {
          this._hideTooltip();
        }
      }
      
      if (name === 'position' && this._info) {
        this._updatePosition(newVal);
      }
    } catch (error) {
      console.error('Error updating tooltip:', error);
    }
  }

  static template = document.createElement('template');
  static {
    this.template.innerHTML = `
      <span class="wrapper" part="wrapper">
        <span class="icon" tabindex="0" part="icon"></span>
        <span class="info" role="tooltip" aria-live="polite" part="info"></span>
      </span>
    `;
  }

  connectedCallback() {
    try {
      // Clone template instead of using innerHTML
      const content = PopupInfo.template.content.cloneNode(true);
      const uniqueId = `info-popup-${Math.random().toString(36).slice(2)}`;
      
      const info = content.querySelector('.info');
      const icon = content.querySelector('.icon');
      
      info.id = uniqueId;
      icon.setAttribute('aria-describedby', uniqueId);
      info.textContent = this.getAttribute('data-text') || '';
      
      this.shadowRoot.appendChild(content);

      // Create styles and append them to the shadow root
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`
        :host {
          --popup-bg: white;
          --popup-border: #000;
          --popup-radius: 10px;
          --popup-shadow: 0 2px 4px rgba(0,0,0,0.2);
          --popup-transition: 0.6s;
          display: inline-block;
        }

        :host([disabled]) .icon {
          opacity: 0.5;
          pointer-events: none;
        }

        .wrapper {
          position: relative;
        }

        .info {
          font-size: 0.8rem;
          width: 200px;
          display: inline-block;
          border: 1px solid black;
          padding: 10px;
          background: var(--popup-bg);
          border-radius: var(--popup-radius);
          box-shadow: var(--popup-shadow);
          transition: opacity var(--popup-transition), 
                      transform var(--popup-transition);
          opacity: 0;
          position: absolute;
          z-index: 3;
          pointer-events: none;
        }

        /* Default position: top */
        .info {
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) translateY(10px) scale(0.95);
        }

        .info.visible {
          transform: translateX(-50%) translateY(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        }

        .info::after {
          content: '';
          position: absolute;
          border: 6px solid transparent;
        }

        /* Default arrow: top */
        .info::after {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-top-color: var(--popup-bg);
        }

        /* Bottom position */
        .info.position-bottom {
          top: calc(100% + 8px);
          bottom: auto;
          transform: translateX(-50%) translateY(-10px) scale(0.95);
        }

        .info.position-bottom.visible {
          transform: translateX(-50%) translateY(0) scale(1);
        }

        .info.position-bottom::after {
          top: -12px;
          bottom: auto;
          border-top-color: transparent;
          border-bottom-color: var(--popup-bg);
        }

        /* Left position */
        .info.position-left {
          top: 50%;
          right: calc(100% + 8px);
          bottom: auto;
          left: auto;
          transform: translateY(-50%) translateX(10px) scale(0.95);
        }

        .info.position-left.visible {
          transform: translateY(-50%) translateX(0) scale(1);
        }

        .info.position-left::after {
          top: 50%;
          left: 100%;
          right: auto;
          bottom: auto;
          transform: translateY(-50%);
          border-top-color: transparent;
          border-left-color: var(--popup-bg);
        }

        /* Right position */
        .info.position-right {
          top: 50%;
          left: calc(100% + 8px);
          bottom: auto;
          right: auto;
          transform: translateY(-50%) translateX(-10px) scale(0.95);
        }

        .info.position-right.visible {
          transform: translateY(-50%) translateX(0) scale(1);
        }

        .info.position-right::after {
          top: 50%;
          right: 100%;
          left: auto;
          bottom: auto;
          transform: translateY(-50%);
          border-top-color: transparent;
          border-right-color: var(--popup-bg);
        }

        .icon{
          display: inline-block;
          width: 32px; height: 32px;
          background: no-repeat center/20px;
          background-image: url("data:image/png;base64,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");
        }

        .icon:hover + .info, 
        .icon:focus + .info,
        .info:hover {
          opacity: 1;
        }

        .icon:focus {
          outline: 2px solid #0078d4;
        }

        /* Add support for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .info {
            transition: none;
          }
        }
      `);

      this.shadowRoot.adoptedStyleSheets = [sheet];

      // Store references
      this._wrapper = this.shadowRoot.querySelector('.wrapper');
      this._icon = this.shadowRoot.querySelector('.icon');
      this._icon.addEventListener('keydown', this._onKeydownHandler);
      this._icon.addEventListener('blur', this._onBlurHandler);
      this._icon.addEventListener('touchstart', this._onTouchStart);
      this._info = this.shadowRoot.querySelector('.info');

      // Apply initial position
      this._updatePosition(this.getAttribute('position'));
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      // Fallback rendering
    }
  }

  _updatePosition(position) {
    if (!this._info) return;
    
    // Remove existing position classes
    this._info.classList.remove('position-top', 'position-bottom', 'position-left', 'position-right');
    
    // Add new position class (always add a position class for consistency)
    const validPositions = ['top', 'bottom', 'left', 'right'];
    const pos = validPositions.includes(position) ? position : 'top';
    this._info.classList.add(`position-${pos}`);
  }

  _hideTooltip() {
    if (this._info) {
      this._info.classList.remove('visible');
    }
  }

  disconnectedCallback() {
    if (this._icon) {
      this._icon.removeEventListener('keydown', this._onKeydownHandler);
      this._icon.removeEventListener('blur', this._onBlurHandler);
      this._icon.removeEventListener('touchstart', this._onTouchStart);

      // Clear references
      this._icon = null;
      this._info = null;
      this._wrapper = null;
    }
  }

  _onKeydown(e) {
    const isVisible = this._info.classList.contains('visible');
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._info.classList.add('visible');
        break;
      case 'Escape':
        if (isVisible) {
          this._info.classList.remove('visible');
          e.target.blur();
        }
        break;
      case 'Tab':
        if (isVisible) {
          this._info.classList.remove('visible');
        }
        break;
    }
  }

  _onBlur() {
    this._info.classList.remove('visible');
  }

  _onTouchStart(e) {
    e.preventDefault();
    const isVisible = this._info.classList.contains('visible');
    if (isVisible) {
      this._info.classList.remove('visible');
    } else {
      this._info.classList.add('visible');
    }
  }
}

customElements.define("popup-info", PopupInfo);