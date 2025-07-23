/**
 * @fileoverview WorldClock Web Component - A customizable world clock displaying time for multiple cities
 * @version 1.0.0
 * @author Nimrod Galor
 */

/**
 * WorldClock web component that displays current time for multiple cities around the world.
 * 
 * @class WorldClock
 * @extends HTMLElement
 * 
 * @example
 * // Basic usage
 * <world-clock></world-clock>
 * 
 * @example
 * // Custom cities and locale
 * <world-clock cities="New York, London, Tokyo" locale="en-US"></world-clock>
 * 
 * @example
 * // With CSS custom properties
 * <world-clock 
 *   cities="Paris, Berlin, Rome"
 *   style="--world-clock-bg: #fff; --world-clock-border-color: #007bff;">
 * </world-clock>
 */
/**
 * @typedef {Object} WorldClockAttributes
 * @property {string} cities - Comma-separated list of city names to display
 * @property {string} locale - BCP 47 language tag for time formatting
 */

/**
 * @typedef {Object} CSSCustomProperties
 * @property {string} --world-clock-font - Font family for the component
 * @property {string} --world-clock-border-color - Border color
 * @property {string} --world-clock-bg - Background color
 * @property {string} --world-clock-padding - Internal padding
 * @property {string} --world-clock-radius - Border radius
 * @property {string} --world-clock-max-width - Maximum width
 */
class ImageLightbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        ::slotted(img) {
          cursor: pointer;
          max-width: 100px;
          margin: 5px;
          border: 2px solid transparent;
          transition: border 0.3s;
        }

        ::slotted(img:hover) {
          border: 2px solid #007bff;
        }

        .overlay {
          position: fixed;
          display: none;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          top: 0; left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.9);
          z-index: 1000;
          color: white;
          text-align: center;
          padding: 20px;
          overflow: hidden;
          transition: opacity 0.3s ease;
          opacity: 0;
        }

        .overlay.active {
          display: flex;
          opacity: 1;
        }

        .image-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          max-width: 100%;
          max-height: 80vh;
          transform: scale(0.95);
          transition: transform 0.3s ease;
          touch-action: pan-y pinch-zoom;
          perspective: 1000px;
        }

        .overlay.active .image-container {
          transform: scale(1);
        }

        .overlay img {
          max-width: 100%;
          max-height: 80vh;
          transition: transform 0.3s ease, opacity 0.3s ease;
          will-change: transform, opacity;
          cursor: zoom-in;
          transform: translateZ(0); /* Force hardware acceleration */
        }

        .zoomed {
          cursor: zoom-out;
          transform: scale(2);
        }

        .caption {
          margin-top: 1rem;
          font-size: 1.1rem;
          background-color: #000;
          padding: 10px 20px;
        }

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          font-size: 2rem;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem 1rem;
          z-index: 10;
        }

        .arrow.left {
          left: 10px;
        }

        .arrow.right {
          right: 10px;
        }

        .magnifier {
          position: absolute;
          pointer-events: none;
          border: 2px solid white;
          border-radius: 50%;
          width: 150px;
          height: 150px;
          background-repeat: no-repeat;
          background-size: 800% 800%;
          display: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5); /* Add shadow for better visibility */
        }

        .loading {
          opacity: 0.5;
          cursor: wait !important;
        }

        .swipe-hint {
          position: absolute;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .swiping .swipe-hint {
          opacity: 0.5;
        }

        @media (hover: hover) and (pointer: fine) {
          .overlay img:hover + .magnifier {
            display: block;
          }
        }

        .slide-left {
          transform: translateX(-100%) scale(0.8);
          opacity: 0;
        }

        .slide-right {
          transform: translateX(100%) scale(0.8);
          opacity: 0;
        }
      </style>

      <slot></slot>

      <div class="overlay" id="lightboxOverlay" role="dialog" aria-modal="true" tabindex="-1">
        <div class="image-container" id="imageContainer">
          <button class="arrow left" id="prevBtn" aria-label="Previous image">&#8592;</button>
          <img id="lightboxImage" src="" alt="">
          <div class="magnifier" id="magnifier"></div>
          <button class="arrow right" id="nextBtn" aria-label="Next image">&#8594;</button>
        </div>
        <div class="caption" id="lightboxCaption" aria-live="polite"></div>
      </div>
    `;

    this.currentIndex = -1;
    this.thumbnails = [];
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._trapFocus = this._trapFocus.bind(this);
    this._startX = 0;
    this.zoomed = false;
    this._opened = false;
    this._initialPinchDistance = 0;
    this._currentScale = 1;
    this._thumbnailObserver = null;

    // Fix: Move this to connectedCallback since lightboxImage/magnifier don't exist yet
    this._debouncedMagnifier = null;
  }

  _debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        window.cancelAnimationFrame(timeoutId);
      }
      timeoutId = window.requestAnimationFrame(() => {
        fn.apply(this, args);
      });
    };
  }

  connectedCallback() {
    // Get DOM references first
    const lightboxImage = this.shadowRoot.getElementById('lightboxImage');
    const magnifier = this.shadowRoot.getElementById('magnifier');

    // Then create debounced function
    this._debouncedMagnifier = this._debounce((e) => {
      if (!lightboxImage.src || this.zoomed) {
        magnifier.style.display = 'none';
        return;
      }
      const rect = lightboxImage.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      magnifier.style.left = `${rect.left - containerRect.left + x - 75}px`;
      magnifier.style.top = `${rect.top - containerRect.top + y - 75}px`;
      magnifier.style.backgroundImage = `url('${lightboxImage.src}')`;
      magnifier.style.backgroundPosition = `${percentX}% ${percentY}%`;
      magnifier.style.display = 'block';
    }, 16); // ~60fps

    const slot = this.shadowRoot.querySelector('slot');
    const overlay = this.shadowRoot.getElementById('lightboxOverlay');
    const lightboxCaption = this.shadowRoot.getElementById('lightboxCaption');
    const prevBtn = this.shadowRoot.getElementById('prevBtn');
    const nextBtn = this.shadowRoot.getElementById('nextBtn');
    const container = this.shadowRoot.getElementById('imageContainer');

    const preloadAdjacentImages = (index) => {
      [-1, 1].forEach(offset => {
        const adjacentIndex = index + offset;
        if (adjacentIndex >= 0 && adjacentIndex < this.thumbnails.length) {
          const img = new Image();
          img.src = this.thumbnails[adjacentIndex].getAttribute('src').replace('thumbs/', 'large/');
        }
      });
    };

    const updateLightbox = (index) => {
      const direction = index > this.currentIndex ? 'right' : 'left';
      lightboxImage.classList.add(`slide-${direction}`);
      
      requestAnimationFrame(() => {
        lightboxImage.classList.remove(`slide-${direction}`);
        
        const img = this.thumbnails[index];
        const srcset = img.getAttribute('data-srcset');
        const sizes = img.getAttribute('data-sizes');
        const fallbackSrc = img.getAttribute('src').replace('thumbs/', 'large/');
        const alt = img.getAttribute('alt') || 'Image';

        lightboxImage.removeAttribute('srcset');
        lightboxImage.removeAttribute('sizes');
        lightboxImage.src = ''; // force reload
        if (srcset) lightboxImage.setAttribute('srcset', srcset);
        if (sizes) lightboxImage.setAttribute('sizes', sizes);

        // Add loading state
        lightboxImage.classList.add('loading');
        lightboxImage.onload = () => {
          lightboxImage.classList.remove('loading');
        };

        lightboxImage.onerror = () => {
          lightboxCaption.textContent = 'Failed to load image';
          this.dispatchEvent(new CustomEvent('lightbox-error', {
            detail: { index, src: fallbackSrc }
          }));
        };

        lightboxImage.src = fallbackSrc;
        lightboxImage.alt = alt;
        lightboxCaption.textContent = alt;

        this.currentIndex = index;
        prevBtn.disabled = index <= 0;
        nextBtn.disabled = index >= this.thumbnails.length - 1;

        // Reset zoom scale when switching images
        this._currentScale = 1;
        lightboxImage.style.transform = 'scale(1)';
        lightboxImage.style.cursor = 'zoom-in'; // Reset cursor
        this.zoomed = false;
        lightboxImage.classList.remove('zoomed');
        magnifier.style.display = '';

        // Focus image for accessibility
        setTimeout(() => lightboxImage.focus(), 0);

        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('lightbox-change', {
          detail: { index, src: fallbackSrc, alt }
        }));

        preloadAdjacentImages(index);
      });
    };

    const closeLightbox = () => {
      overlay.classList.remove('active');
      lightboxImage.classList.remove('zoomed');
      this.zoomed = false;
      magnifier.style.display = 'none';
      // Reset zoom scale when closing
      this._currentScale = 1;
      lightboxImage.style.transform = 'scale(1)';
      document.removeEventListener('keydown', this._onKeyDown);
      container.removeEventListener('touchstart', this._onTouchStart);
      container.removeEventListener('touchend', this._onTouchEnd);
      overlay.removeEventListener('focusin', this._trapFocus);
      this._opened = false;
      // Dispatch custom event
      this.dispatchEvent(new CustomEvent('lightbox-close'));
    };

    slot.addEventListener('slotchange', () => {
      this.thumbnails = slot.assignedElements().filter(el => el.tagName === 'IMG');
    });

    slot.addEventListener('click', (e) => {
      const img = e.target;
      if (img.tagName === 'IMG') {
        this.thumbnails = slot.assignedElements().filter(el => el.tagName === 'IMG');
        const index = this.thumbnails.indexOf(img);
        if (index !== -1) {
          updateLightbox(index);
          overlay.classList.add('active');
          this._opened = true;
          // Focus overlay for accessibility
          overlay.focus();
          document.addEventListener('keydown', this._onKeyDown);
          container.addEventListener('touchstart', this._onTouchStart, { passive: true });
          container.addEventListener('touchend', this._onTouchEnd);
          overlay.addEventListener('focusin', this._trapFocus);
          // Dispatch custom event
          this.dispatchEvent(new CustomEvent('lightbox-open', {
            detail: { index, src: img.src, alt: img.alt }
          }));
        }
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox();
    });

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.currentIndex > 0) updateLightbox(this.currentIndex - 1);
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.currentIndex < this.thumbnails.length - 1) updateLightbox(this.currentIndex + 1);
    });

    lightboxImage.addEventListener('click', () => {
      this.zoomed = !this.zoomed;
      lightboxImage.classList.toggle('zoomed', this.zoomed);
      // Hide magnifier when zoomed
      magnifier.style.display = this.zoomed ? 'none' : '';
    });

    // Robust magnifier display logic
    container.addEventListener('mousemove', (e) => {
      this._debouncedMagnifier(e);
    });

    container.addEventListener('mouseleave', () => {
      magnifier.style.display = 'none';
    });

    // Hide magnifier on touch devices
    container.addEventListener('touchstart', () => {
      magnifier.style.display = 'none';
    });

    container.addEventListener('touchstart', (e) => {
      magnifier.style.display = 'none';
      if (e.touches.length === 2) {
        e.preventDefault();
        this._initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const scale = (currentDistance / this._initialPinchDistance) * this._currentScale;
        this._currentScale = Math.min(Math.max(1, scale), 3);
        lightboxImage.style.transform = `scale(${this._currentScale})`;
      }
    });

    // Add mouse wheel zoom support
    container.addEventListener('wheel', (e) => {
      // Only zoom if overlay is open and mouse is over the image
      if (!this._opened) return;
      e.preventDefault();
      // Adjust zoom scale
      const zoomStep = 0.2;
      if (e.deltaY < 0) {
        // Zoom in
        this._currentScale = Math.min(this._currentScale + zoomStep, 3);
      } else {
        // Zoom out
        this._currentScale = Math.max(this._currentScale - zoomStep, 1);
      }
      lightboxImage.style.transform = `scale(${this._currentScale})`;
      // Hide magnifier if zoomed in
      if (this._currentScale > 1) {
        this.zoomed = true;
        lightboxImage.classList.add('zoomed');
        magnifier.style.display = 'none';
      } else {
        this.zoomed = false;
        lightboxImage.classList.remove('zoomed');
      }
    }, { passive: false });

    this._updateLightbox = updateLightbox;
    this._closeLightbox = closeLightbox;

    this._observeThumbnails();
}

_observeThumbnails() {
    // Clean up existing observer
    if (this._thumbnailObserver) {
        this._thumbnailObserver.disconnect();
    }
    
    const options = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };
    
    this._thumbnailObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const dataSrc = img.getAttribute('data-src');
                if (dataSrc) {
                    img.src = dataSrc;
                    img.removeAttribute('data-src');
                }
                this._thumbnailObserver.unobserve(img);
            }
        });
    }, options);
    
    this.thumbnails.forEach(img => {
        if (img.hasAttribute('data-src')) {
            this._thumbnailObserver.observe(img);
        }
    });
}

  disconnectedCallback() {
    // Clean up event listeners if component is removed while open
    const overlay = this.shadowRoot.getElementById('lightboxOverlay');
    const container = this.shadowRoot.getElementById('imageContainer');
    document.removeEventListener('keydown', this._onKeyDown);
    if (overlay) overlay.removeEventListener('focusin', this._trapFocus);
    if (container) {
      container.removeEventListener('touchstart', this._onTouchStart);
      container.removeEventListener('touchend', this._onTouchEnd);
    }
    if (this._thumbnailObserver) {
        this._thumbnailObserver.disconnect();
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') {
        this._closeLightbox();
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        if (this.currentIndex > 0) this._updateLightbox(this.currentIndex - 1);
    } else if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
        if (this.currentIndex < this.thumbnails.length - 1) this._updateLightbox(this.currentIndex + 1);
    } else if (e.key === 'z' && !e.ctrlKey && !e.altKey) {
        this.zoomed = !this.zoomed;
        const lightboxImage = this.shadowRoot.getElementById('lightboxImage');
        const magnifier = this.shadowRoot.getElementById('magnifier');
        lightboxImage.classList.toggle('zoomed', this.zoomed);
        magnifier.style.display = this.zoomed ? 'none' : '';
    } else if (e.key === 'f' && !e.ctrlKey && !e.altKey) {
        this._toggleFullscreen();
    } else if (e.key === 'Tab' && this._opened) {
      // Trap focus inside overlay
      this._trapFocus(e);
    }
  }

  _toggleFullscreen() {
    const overlay = this.shadowRoot.getElementById('lightboxOverlay');
    if (!document.fullscreenElement) {
        overlay.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

  _trapFocus(e) {
    const overlay = this.shadowRoot.getElementById('lightboxOverlay');
    const focusable = overlay.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  _onTouchStart(e) {
    this._startX = e.changedTouches[0].clientX;
    const container = this.shadowRoot.getElementById('imageContainer');
    container.classList.add('swiping');
  }

  _onTouchEnd(e) {
    const container = this.shadowRoot.getElementById('imageContainer');
    container.classList.remove('swiping');
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - this._startX;

    if (Math.abs(deltaX) > 50) {
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      if (deltaX > 50 && this.currentIndex > 0) {
        this._updateLightbox(this.currentIndex - 1);
      } else if (deltaX < -50 && this.currentIndex < this.thumbnails.length - 1) {
        this._updateLightbox(this.currentIndex + 1);
      }
    }
  }
}

customElements.define('image-lightbox', ImageLightbox);