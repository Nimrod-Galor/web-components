/**
 * Image Gallery Web Component
 * @customElement image-gallery
 * @attr {string} thumbnails-orientation - Position of thumbnails (left|right|top|bottom)
 * @slot default - Thumbnails to display in the gallery
 * 
 * @example
 * <image-gallery thumbnails-orientation="left">
 *   <img src="thumb1.jpg" data-large="large1.jpg" alt="Image 1">
 *   <img src="thumb2.jpg" data-large="large2.jpg" alt="Image 2">
 * </image-gallery>
 * 
 * @example
 * // Listen for events
 * gallery.addEventListener('preview-change-complete', (e) => {
 *   console.log('Preview changed to:', e.detail.src);
 * });
 */
class ImageGallery extends HTMLElement {
    constructor() {
        super();
        this._cleanupFns = [];
    }

    static get observedAttributes() {
        return ['thumbnails-orientation'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'thumbnails-orientation' && this.shadowRoot) {
            this.updateOrientation();
        }
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });

        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                --gallery-max-width: 900px;
                --gallery-gap: 0.5rem;
                --thumbnail-size: 70px;
                --thumbnail-border-radius: 6px;
                --preview-border-radius: 8px;
                --focus-color: #007bff;
                --selected-color: #007bff;
                --selected-border-width: 3px;
                display: block;
                font-family: sans-serif;
                max-width: var(--gallery-max-width);
                margin: auto;
            }
            .gallery-layout {
                display: flex;
                flex-direction: column;
            }
            .preview-wrapper {
                position: relative;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .spinner {
                display: none;
                position: absolute;
                left: 50%;
                top: 50%;
                width: 36px;
                height: 36px;
                margin-left: -18px;
                margin-top: -18px;
                border: 4px solid #eee;
                border-top: 4px solid var(--focus-color, #007bff);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                z-index: 2;
                pointer-events: none;
            }
            .preview.loading + .spinner,
            .preview-wrapper .spinner.active {
                display: block;
            }
            @keyframes spin {
                0% { transform: rotate(0deg);}
                100% { transform: rotate(360deg);}
            }
            .row {
                flex-direction: row;
            }
            .reverse-row {
                flex-direction: row-reverse;
            }
            .column {
                flex-direction: column;
            }
            .reverse-column {
                flex-direction: column-reverse;
            }
            .preview {
                width: 100%;
                height: auto;
                margin-bottom: 1rem;
                border-radius: var(--preview-border-radius);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                flex: 1 1 auto;
            }
            .thumbs {
                display: flex;
                gap: var(--gallery-gap);
            }
            .thumbs.row, .thumbs.reverse-row {
                flex-direction: row;
                margin-bottom: 0;
                margin-right: 0;
            }
            .thumbs.column, .thumbs.reverse-column {
                flex-direction: column;
                margin-bottom: 0;
                margin-right: 0;
            }
            .thumbs.row, .thumbs.reverse-row {
                margin-top: 1rem;
            }
            .thumbs.column {
                margin-right: 1rem;
            }
            .thumbs.reverse-column {
                margin-left: 1rem;
            }
            ::slotted(img) {
                cursor: pointer;
                margin: 0;
                border-radius: var(--thumbnail-border-radius);
                transition: all 0.2s ease;
                outline: none;
                width: var(--thumbnail-size);
                height: var(--thumbnail-size);
                object-fit: cover;
                border: 2px solid transparent;
            }
            ::slotted(img:hover), ::slotted(img:focus) {
                transform: scale(1.05);
                box-shadow: 0 0 0 2px var(--focus-color);
            }
            ::slotted(img[aria-pressed="true"]) {
                border: var(--selected-border-width) solid var(--selected-color);
                box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.2);
                transform: scale(1.02);
            }
            ::slotted(img[aria-pressed="true"]:hover) {
                transform: scale(1.07);
                box-shadow: 0 0 0 2px var(--focus-color), 0 0 0 1px rgba(0, 123, 255, 0.2);
            }
            .preview.loading {
                opacity: 0.7;
                filter: blur(1px);
            }
            .preview.error {
                border: 2px solid #ff4444;
            }
        `);
        this.shadowRoot.adoptedStyleSheets = [sheet];

        this.shadowRoot.innerHTML = `
            <div class="gallery-layout">
                <div class="thumbs" part="thumbnails"><slot></slot></div>
                <div class="preview-wrapper">
                    <img class="preview" id="previewImage" />
                    <div class="spinner" id="spinner" aria-hidden="true"></div>
                </div>
            </div>
        `;

        const preview = this.shadowRoot.getElementById('previewImage');
        this._spinner = this.shadowRoot.getElementById('spinner'); // <-- store spinner as a property
        const slot = this.shadowRoot.querySelector('slot');
        this.updateOrientation();

        // Helper to remove all old listeners
        const cleanup = () => {
            this._cleanupFns.forEach(fn => fn());
            this._cleanupFns = [];
        };

        const updatePreview = () => {
            cleanup();
            const thumbnails = slot.assignedElements().filter(el => el.tagName === 'IMG');
            if (!thumbnails.length) return;
            this.copyImageAttributes(thumbnails[0], preview);
            thumbnails.forEach(thumb => {
                thumb.setAttribute('tabindex', '0');
                thumb.setAttribute('role', 'button');
                const clickHandler = () => this.copyImageAttributes(thumb, preview);
                const keyHandler = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.copyImageAttributes(thumb, preview);
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        const thumbnails = Array.from(slot.assignedElements().filter(el => el.tagName === 'IMG'));
                        const currentIndex = thumbnails.indexOf(thumb);
                        const nextIndex = e.key === 'ArrowRight' 
                            ? (currentIndex + 1) % thumbnails.length 
                            : (currentIndex - 1 + thumbnails.length) % thumbnails.length;
                        thumbnails[nextIndex].focus();
                    }
                };
                thumb.addEventListener('click', clickHandler);
                thumb.addEventListener('keydown', keyHandler);
                this._cleanupFns.push(() => {
                    thumb.removeEventListener('click', clickHandler);
                    thumb.removeEventListener('keydown', keyHandler);
                });
            });
        };

        slot.addEventListener('slotchange', updatePreview);
        updatePreview();

        // Preload large images for better UX
        const preloadImages = () => {
            const thumbnails = slot.assignedElements().filter(el => el.tagName === 'IMG');
            thumbnails.forEach(thumb => {
                const largeSrc = thumb.getAttribute('data-large');
                if (largeSrc) {
                    const img = new Image();
                    img.src = largeSrc;
                }
            });
        };
        
        // Preload after initial render
        setTimeout(preloadImages, 100);
    }

    disconnectedCallback() {
        if (this._cleanupFns) {
            this._cleanupFns.forEach(fn => fn());
            this._cleanupFns = [];
        }
    }

    /**
     * Updates the orientation of the thumbnails based on the attribute.
     */
    updateOrientation() {
        const layout = this.shadowRoot.querySelector('.gallery-layout');
        const thumbs = this.shadowRoot.querySelector('.thumbs');
        const preview = this.shadowRoot.getElementById('previewImage');
        if (!layout || !thumbs || !preview) return;

        // Remove all orientation classes
        layout.classList.remove('row', 'reverse-row', 'column', 'reverse-column');
        thumbs.classList.remove('row', 'reverse-row', 'column', 'reverse-column');

        // Default is bottom
        let orientation = (this.getAttribute('thumbnails-orientation') || 'bottom').toLowerCase();
        switch (orientation) {
            case 'left':
                layout.style.flexDirection = 'row';
                layout.classList.add('row');
                thumbs.classList.add('column');
                layout.insertBefore(thumbs, preview);
                break;
            case 'right':
                layout.style.flexDirection = 'row';
                layout.classList.add('reverse-row');
                thumbs.classList.add('column');
                layout.appendChild(thumbs);
                break;
            case 'top':
                layout.style.flexDirection = 'column';
                layout.classList.add('reverse-column');
                thumbs.classList.add('row');
                layout.insertBefore(thumbs, preview);
                break;
            case 'bottom':
            default:
                layout.style.flexDirection = 'column';
                layout.classList.add('column');
                thumbs.classList.add('row');
                layout.appendChild(thumbs);
                break;
        }
    }

    
    copyImageAttributes(source, target) {
        // Remove active state from all thumbnails
        const slot = this.shadowRoot.querySelector('slot');
        const thumbnails = slot.assignedElements().filter(el => el.tagName === 'IMG');
        thumbnails.forEach(thumb => thumb.removeAttribute('aria-pressed'));

        // Set active state on current thumbnail
        source.setAttribute('aria-pressed', 'true');
        source.focus();

        target.classList.add('loading');
        target.classList.remove('error');
        if (this._spinner) this._spinner.classList.add('active'); // <-- use this._spinner

        target.src = source.getAttribute('data-large') || (source.src ? source.src.replace('thumbs/', 'large/') : '') || source.src;
        target.srcset = source.getAttribute('data-large-srcset') || source.getAttribute('srcset') || '';
        target.sizes = source.getAttribute('sizes') || '100vw';
        target.alt = source.getAttribute('alt') || '';

        target.onload = () => {
            target.classList.remove('loading');
            if (this._spinner) this._spinner.classList.remove('active'); // <-- use this._spinner
            this.dispatchEvent(new CustomEvent('preview-change-complete', {
                detail: {
                    src: target.src,
                    alt: target.alt,
                    thumbnail: source
                }
            }));
        };

        target.onerror = () => {
            target.classList.remove('loading');
            target.classList.add('error');
            if (this._spinner) this._spinner.classList.remove('active');
            
            // Try fallback to original src
            const fallbackSrc = source.getAttribute('src');
            if (fallbackSrc && target.src !== fallbackSrc) {
                target.src = fallbackSrc;
                target.srcset = '';
            } else {
                // Show placeholder or error message
                target.alt = 'Image failed to load';
            }
            
            this.dispatchEvent(new CustomEvent('preview-error', {
                detail: {
                    thumbnail: source,
                    error: 'Failed to load large image',
                    fallbackUsed: !!fallbackSrc
                }
            }));
        };
    }
}

customElements.define('image-gallery', ImageGallery);