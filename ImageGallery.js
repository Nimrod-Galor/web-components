/**
 * Image Gallery Web Component
 * @customElement image-gallery
 * @attr {string} thumbnails-orientation - Position of thumbnails (left|right|top|bottom)
 * @slot default - Thumbnails to display in the gallery
 *
 * @fires preview-change-complete - Fired when the preview image successfully changes. Event detail: { src, alt, thumbnail }
 * @fires preview-error - Fired when the preview image fails to load. Event detail: { thumbnail, error, fallbackUsed }
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
        return ['thumbnails-orientation', 'preload-images'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'thumbnails-orientation' && this.shadowRoot) {
            // this.updateOrientation();
        }
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });

        // Mobile-first, responsive styles using CSS Grid for orientation
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                --gallery-max-width: 100vw;
                --gallery-gap: 0.5rem;
                --thumbnail-size: 72px;
                --thumbnail-border-radius: 6px;
                --preview-border-radius: 8px;
                --focus-color: #007bff;
                --selected-color: #007bff;
                --selected-border-width: 3px;
                display: block;
                font-family: system-ui, sans-serif;
                max-width: var(--gallery-max-width);
                margin: 0 auto;
                box-sizing: border-box;
                padding: 0.5rem;
            }
            .gallery-layout {
                display: grid;
                gap: var(--gallery-gap);
                grid-template-areas:
                    "thumbs"
                    "preview";
            }
            .thumbs {
                grid-area: thumbs;
                display: flex;
                gap: var(--gallery-gap);
                overflow-x: auto;
                padding: 0.35rem;
            }
            .preview-wrapper {
                grid-area: preview;
                position: relative;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 180px;
            }
            /* Orientation grid overrides */
            :host([thumbnails-orientation="top"]) .gallery-layout {
                grid-template-areas:
                    "thumbs"
                    "preview";
                grid-template-rows: auto 1fr;
            }
            :host([thumbnails-orientation="bottom"]) .gallery-layout {
                grid-template-areas:
                    "preview"
                    "thumbs";
                grid-template-rows: 1fr auto;
            }
            :host([thumbnails-orientation="left"]) .gallery-layout {
                grid-template-areas: "thumbs preview";
                grid-template-columns: auto 1fr;
            }
            :host([thumbnails-orientation="right"]) .gallery-layout {
                grid-template-areas: "preview thumbs";
                grid-template-columns: 1fr auto;
            }
            :host([thumbnails-orientation="left"]) .thumbs,
            :host([thumbnails-orientation="right"]) .thumbs {
                flex-direction: column;
                overflow-x: unset;
                overflow-y: auto;
                max-height: 400px;
            }
            :host([thumbnails-orientation="top"]) .thumbs,
            :host([thumbnails-orientation="bottom"]) .thumbs {
                flex-direction: row;
                overflow-x: auto;
                overflow-y: unset;
                max-width: 100%;
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
            .preview {
                width: 100%;
                max-width: 100vw;
                height: auto;
                margin-bottom: 1rem;
                border-radius: var(--preview-border-radius);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                flex: 1 1 auto;
                background: #f8f9fa;
                object-fit: contain;
                aspect-ratio: 16/9;
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
                background: #f1f3f4;
                flex-shrink: 0;
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
                background: #fff5f5; // Add subtle background
                position: relative;
            }
            .preview.error::after {
                content: '⚠️ Image failed to load';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 68, 68, 0.9);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                font-size: 0.9rem;
                pointer-events: none;
            }
            @media (min-width: 600px) {
                :host {
                    --gallery-max-width: 600px;
                }
                .preview {
                    aspect-ratio: 16/9;
                }
            }
            @media (min-width: 900px) {
                :host {
                    --gallery-max-width: 900px;
                }
            }
        `);
        this.shadowRoot.adoptedStyleSheets = [sheet];

        this.shadowRoot.innerHTML = `
            <div class="gallery-layout">
                <div class="thumbs" part="thumbnails"><slot></slot></div>
                <div class="preview-wrapper">
                    <img class="preview" id="previewImage" aria-live="polite" />
                    <div class="spinner" id="spinner" aria-hidden="true"></div>
                </div>
            </div>
        `;

        const preview = this.shadowRoot.getElementById('previewImage');
        this._spinner = this.shadowRoot.getElementById('spinner');
        const slot = this.shadowRoot.querySelector('slot');
        // this.updateOrientation();

        // Helper to remove all old listeners
        const cleanup = () => {
            this._cleanupFns.forEach(fn => fn());
            this._cleanupFns = [];
        };

        const updatePreview = () => {
            cleanup();
            const thumbnails = slot.assignedElements().filter(el => el.tagName === 'IMG');
            if (!thumbnails.length) {
                // Show a placeholder or message if no thumbnails are present
                preview.src = '';
                preview.srcset = '';
                preview.sizes = '';
                preview.alt = 'No images available';
                preview.classList.remove('loading', 'error');
                preview.setAttribute('aria-live', 'polite');
                preview.style.background = '#f1f3f4';
                preview.style.display = 'block';
                preview.style.minHeight = '180px';
                preview.style.objectFit = 'contain';
                preview.style.textAlign = 'center';
                // Optionally, you could overlay a message visually as well:
                if (!this._noImagesMsg) {
                    this._noImagesMsg = document.createElement('div');
                    this._noImagesMsg.textContent = 'No images available';
                    this._noImagesMsg.style.position = 'absolute';
                    this._noImagesMsg.style.left = '50%';
                    this._noImagesMsg.style.top = '50%';
                    this._noImagesMsg.style.transform = 'translate(-50%, -50%)';
                    this._noImagesMsg.style.color = '#888';
                    this._noImagesMsg.style.fontSize = '1.1rem';
                    this._noImagesMsg.style.pointerEvents = 'none';
                    this._noImagesMsg.style.zIndex = '3';
                    this.shadowRoot.querySelector('.preview-wrapper').appendChild(this._noImagesMsg);
                }
                return;
            } else if (this._noImagesMsg) {
                this._noImagesMsg.remove();
                this._noImagesMsg = null;
            }
            this.copyImageAttributes(thumbnails[0], preview);
            thumbnails.forEach(thumb => {
                thumb.setAttribute('tabindex', '0');
                thumb.setAttribute('role', 'button');
                const clickHandler = () => this.copyImageAttributes(thumb, preview);
                const keyHandler = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.copyImageAttributes(thumb, preview);
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const thumbnails = Array.from(slot.assignedElements().filter(el => el.tagName === 'IMG'));
                        const currentIndex = thumbnails.indexOf(thumb);
                        let nextIndex;
                        
                        // Handle different orientations for arrow keys
                        const orientation = this.getAttribute('thumbnails-orientation') || 'top';
                        const isHorizontal = ['top', 'bottom'].includes(orientation);
                        
                        if ((isHorizontal && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
                            (!isHorizontal && (e.key === 'ArrowUp' || e.key === 'ArrowDown'))) {
                            nextIndex = (e.key === 'ArrowRight' || e.key === 'ArrowDown') 
                                ? (currentIndex + 1) % thumbnails.length 
                                : (currentIndex - 1 + thumbnails.length) % thumbnails.length;
                            thumbnails[nextIndex].focus();
                        }
                    } else if (e.key === 'Home') {
                        e.preventDefault();
                        thumbnails[0].focus();
                    } else if (e.key === 'End') {
                        e.preventDefault();
                        thumbnails[thumbnails.length - 1].focus();
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

        // Conditional preloading based on attribute
        if (this.hasAttribute('preload-images')) {
            this._preloadImages();
        }
    }

    /**
     * Holds the "no images" message element for when there are no thumbnails.
     * @private
     */
    _noImagesMsg = null;

    disconnectedCallback() {
        if (this._cleanupFns) {
            this._cleanupFns.forEach(fn => fn());
            this._cleanupFns = [];
        }
    }

    /**
     * Responsive, mobile-first image logic.
     * Uses srcset/sizes for best performance.
     */
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
        if (this._spinner){
            this._spinner.classList.add('active');
        }

        // Responsive image logic
        const largeSrcset = source.getAttribute('data-large-srcset');
        const largeSrc = source.getAttribute('data-large');
        const largeSizes = source.getAttribute('data-large-sizes') || source.getAttribute('sizes') || '(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 900px';

        if (largeSrcset) {
            target.srcset = largeSrcset;
            // Set src to the SMALLEST image in the srcset (first entry)
            const firstSrc = largeSrcset.split(',')[0].trim().split(' ')[0];
            target.src = firstSrc;
            target.sizes = largeSizes;
        } else if (largeSrc) {
            target.src = largeSrc;
            target.srcset = '';
            target.sizes = '';
        } else {
            target.src = source.src;
            target.srcset = source.getAttribute('srcset') || '';
            target.sizes = source.getAttribute('sizes') || '';
        }

        target.alt = source.getAttribute('alt') || '';

        target.onload = () => {
            target.classList.remove('loading');
            if (this._spinner) this._spinner.classList.remove('active');
            this.dispatchEvent(new CustomEvent('preview-change-complete', {
                detail: {
                    src: target.currentSrc || target.src,
                    alt: target.alt,
                    thumbnail: source
                }
            }));
        };

        target.onerror = () => {
            target.classList.remove('loading');
            target.classList.add('error');
            if (this._spinner) this._spinner.classList.remove('active');
            // Try fallback to original thumbnail
            target.src = source.src;
            target.srcset = '';
            target.sizes = '';

            // Provide an error message for screen readers
            target.setAttribute('alt', 'Failed to load preview image. Showing thumbnail.');

            // Return focus to the thumbnail for accessibility
            source.focus();

            this.dispatchEvent(new CustomEvent('preview-error', {
                detail: {
                    thumbnail: source,
                    error: 'Failed to load large image',
                    fallbackUsed: true
                }
            }));
        };
    }

    _preloadImages() {
        const thumbnails = this.shadowRoot.querySelector('slot').assignedElements().filter(el => el.tagName === 'IMG');
        thumbnails.forEach(thumb => {
            const largeSrc = thumb.getAttribute('data-large') || thumb.getAttribute('data-large-srcset');
            if (largeSrc) {
                const img = new Image();
                img.src = largeSrc.split(',')[0].trim().split(' ')[0]; // First image from srcset
            }
        });
    }
}

customElements.define('image-gallery', ImageGallery);