/**
 * Image Carousel Web Component
 * @customElement image-carousel
 * @attr {string} autoplay - Autoplay delay in milliseconds
 * @attr {boolean} loop - Enable infinite loop
 * @attr {boolean} hide-controls - Hide navigation controls
 * @attr {boolean} hide-dots - Hide dot indicators
 * @attr {boolean} hide-arrows - Hide arrow buttons
 * @fires slide-change - When active slide changes
 */
class ImageCarousel extends HTMLElement {
  static #carouselStyles = new CSSStyleSheet();
  
  static {
    this.#carouselStyles.replaceSync(`
      :host {
        display: block;
        position: relative;
        overflow: hidden;
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }

      .carousel-wrapper {
        position: relative;
        width: 100%;
        height: 300px;
        background: #f5f5f5;
      }

      .carousel-container {
        display: flex;
        height: 100%;
        transition: transform 0.5s ease-in-out;
        touch-action: pan-y;
      }

      ::slotted(*) {
        flex: 0 0 100%;
        height: 100%;
        box-sizing: border-box;
      }

      ::slotted(img) {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        object-position: center center !important;
        display: block !important;
      }

      .nav-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        background: rgba(0, 0, 0, 0.6);
        border: none;
        color: white;
        font-size: 1.5rem;
        width: 44px;
        height: 44px;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: background 0.3s ease;
        opacity: 0.8;
      }

      .nav-button:hover {
        background: rgba(0, 0, 0, 0.8);
        opacity: 1;
      }

      .nav-button:focus {
        outline: 2px solid #007bff;
        outline-offset: 2px;
      }

      .nav-button.prev {
        left: 12px;
      }

      .nav-button.next {
        right: 12px;
      }

      .dots-container {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        background: rgba(0, 0, 0, 0.4);
        padding: 8px 12px;
        border-radius: 20px;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0;
      }

      .dot:hover {
        background: rgba(255, 255, 255, 0.8);
        transform: scale(1.2);
      }

      .dot.active {
        background: white;
        transform: scale(1.2);
      }

      .dot:focus {
        outline: 2px solid #007bff;
        outline-offset: 2px;
      }

      .swipe-hint {
        position: absolute;
        bottom: 50px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 0.9rem;
        background: rgba(0, 0, 0, 0.6);
        padding: 4px 12px;
        border-radius: 16px;
        opacity: 0.7;
        pointer-events: none;
        animation: fadeInOut 3s ease-in-out;
      }

      @keyframes fadeInOut {
        0%, 100% { opacity: 0; }
        50% { opacity: 0.7; }
      }

      .loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #666;
        font-size: 1rem;
      }

      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        border: 0 !important;
      }

      /* Mobile Styles */
      @media (max-width: 767px) {
        .carousel-wrapper {
          height: 250px;
        }

        .nav-button {
          width: 40px;
          height: 40px;
          font-size: 1.2rem;
        }

        .nav-button.prev {
          left: 8px;
        }

        .nav-button.next {
          right: 8px;
        }

        .swipe-hint {
          display: block;
        }
      }

      /* Tablet and Desktop */
      @media (min-width: 768px) {
        .nav-button {
          width: 48px;
          height: 48px;
          font-size: 1.8rem;
        }

        .nav-button.prev {
          left: 16px;
        }

        .nav-button.next {
          right: 16px;
        }

        .dot {
          width: 12px;
          height: 12px;
        }

        .swipe-hint {
          display: none;
        }
      }

      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        .carousel-container {
          transition: none !important;
        }

        .dot, .nav-button {
          transition: none !important;
        }

        .swipe-hint {
          animation: none !important;
        }
      }

      /* Hide controls when specified */
      :host([hide-controls]) .nav-button,
      :host([hide-controls]) .dots-container {
        display: none;
      }

      :host([hide-dots]) .dots-container {
        display: none;
      }

      :host([hide-arrows]) .nav-button {
        display: none;
      }
    `);
  }

  static get observedAttributes() {
    return ['autoplay', 'loop', 'hide-controls', 'hide-dots', 'hide-arrows'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Bind methods
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
    this.pauseAutoplay = this.pauseAutoplay.bind(this);
    this.resumeAutoplay = this.resumeAutoplay.bind(this);

    // Initialize properties
    this.currentIndex = 0;
    this.slides = [];
    this.isTransitioning = false;
    this.autoplayInterval = null;
    this.autoplayDelay = 5000;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this._transitionTimeout = null;
  }

  connectedCallback() {
    try {
      this.shadowRoot.adoptedStyleSheets = [ImageCarousel.#carouselStyles];
      this.render();
      this.setupEventListeners();

      // Wait for slot content, then setup slides and autoplay
      requestAnimationFrame(() => {
        this.setupSlides();
      });

      // Show swipe hint on mobile
      if (window.innerWidth <= 767) {
        setTimeout(() => this.showSwipeHint(), 1000);
      }

      // ResizeObserver for responsive layouts
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => {
          try {
            this.updateDisplay();
          } catch (error) {
            console.error('Error in resize observer:', error);
          }
        });
        this.resizeObserver.observe(this);
      }
      
    } catch (error) {
      console.error('Error connecting carousel:', error);
      this.showError('Failed to initialize carousel component');
    }
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.cleanup();
    
    // Remove all event listeners
    const slot = this.shadowRoot.querySelector('slot');
    slot?.removeEventListener('slotchange', this.setupSlides);
    const container = this.shadowRoot.querySelector('.carousel-container');
    container?.removeEventListener('transitionend', this.onTransitionEnd);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'autoplay' && newValue !== oldValue) {
      this.setupAutoplay();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="carousel-wrapper" role="region" aria-label="Image Carousel">
        <div class="carousel-container">
          <slot></slot>
        </div>
        
        <button class="nav-button prev" aria-label="Previous image">
          &#8249;
        </button>
        
        <button class="nav-button next" aria-label="Next image">
          &#8250;
        </button>
        
        <div class="dots-container" role="tablist" aria-label="Image navigation"></div>
        
        <div class="swipe-hint">Swipe to navigate</div>
        
        <div class="sr-only" aria-live="polite" aria-atomic="true" id="status"></div>
      </div>
    `;
  }

  setupEventListeners() {
    const prevBtn = this.shadowRoot.querySelector('.prev');
    const nextBtn = this.shadowRoot.querySelector('.next');
    const container = this.shadowRoot.querySelector('.carousel-container');

    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());
    
    // Keyboard navigation
    this.addEventListener('keydown', this.handleKeydown);
    this.setAttribute('tabindex', '0');

    // Touch events
    this.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.addEventListener('touchend', this.handleTouchEnd, { passive: true });

    // Mouse events for autoplay
    this.addEventListener('mouseenter', this.pauseAutoplay);
    this.addEventListener('mouseleave', this.resumeAutoplay);
    this.addEventListener('focusin', this.pauseAutoplay);
    this.addEventListener('focusout', this.resumeAutoplay);

    // Transition end
    container.addEventListener('transitionend', this.onTransitionEnd);

    // Slot changes - with delay for content to be ready
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      // Small delay to ensure all images are loaded into the slot
      setTimeout(() => {
        this.setupSlides();
      }, 0);
    });
  }

  setupSlides() {
    try {
      const slot = this.shadowRoot.querySelector('slot');
      if (!slot) {
        throw new Error('Shadow DOM slot not found');
      }
      
      this.slides = slot.assignedElements().filter(el =>
        el.tagName === 'IMG' || el.querySelector('img')
      );

      if (this.slides.length === 0) {
        this.showError('No images found in carousel');
        return;
      }

      this.hideLoading();
      this.createDots();
      this.updateDisplay();
      this.announceSlide();
      this.setupLazyLoading();
      this.setupAutoplay();
      this.setupImageErrorHandling();
      
    } catch (error) {
      console.error('Error setting up carousel slides:', error);
      this.showError('Failed to initialize carousel: ' + error.message);
    }
  }

  startAutoplay() {
    try {
      if (this.slides.length > 1 && this.getAttribute('autoplay') !== null) {
        clearInterval(this.autoplayInterval);
        this.autoplayInterval = setInterval(() => {
          this.next();
        }, this.autoplayDelay);
      }
    } catch (error) {
      console.error('Error starting autoplay:', error);
    }
  }

  setupAutoplay() {
    try {
      clearInterval(this.autoplayInterval);

      const autoplayAttr = this.getAttribute('autoplay');
      if (autoplayAttr !== null && this.slides?.length > 1) {
        const delay = parseInt(autoplayAttr);
        if (isNaN(delay) || delay < 1000) {
          throw new Error('Autoplay delay must be at least 1000ms');
        }
        
        this.autoplayDelay = delay;
        this.startAutoplay();
      }
    } catch (error) {
      console.error('Error setting up autoplay:', error);
      this.showError('Autoplay configuration error: ' + error.message);
    }
  }

  updateDisplay() {
    try {
      const container = this.shadowRoot.querySelector('.carousel-container');
      const dots = this.shadowRoot.querySelectorAll('.dot');
      
      if (!container) {
        throw new Error('Carousel container not found');
      }

      // Validate current index
      if (this.currentIndex < 0 || this.currentIndex >= this.slides.length) {
        this.currentIndex = 0;
      }

      // Responsive: use container width for transform
      const slideWidth = this.offsetWidth || 1;
      container.style.transition = 'transform 0.5s ease-in-out';
      container.style.transform = `translateX(-${this.currentIndex * slideWidth}px)`;

      // Fallback for % transform if width is not available
      if (!this.offsetWidth) {
        container.style.transform = `translateX(-${this.currentIndex * 100}%)`;
      }

      // Update dots
      dots.forEach((dot, index) => {
        const isActive = index === this.currentIndex;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', isActive);
        dot.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      
    } catch (error) {
      console.error('Error updating display:', error);
      this.showError('Display update failed');
    }
  }

  createDots() {
    try {
      const dotsContainer = this.shadowRoot.querySelector('.dots-container');
      if (!dotsContainer) {
        throw new Error('Dots container not found');
      }
      
      dotsContainer.innerHTML = '';

      this.slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1');
        dot.setAttribute('type', 'button');
        
        dot.addEventListener('click', () => {
          try {
            this.goToSlide(index);
          } catch (error) {
            console.error('Error navigating to slide:', error);
          }
        });
        
        dot.addEventListener('keydown', (e) => {
          try {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.goToSlide(index);
            }
          } catch (error) {
            console.error('Error handling dot keydown:', error);
          }
        });
        
        dotsContainer.appendChild(dot);
      });
      
    } catch (error) {
      console.error('Error creating dots:', error);
      this.showError('Navigation dots creation failed');
    }
  }

  goToSlide(index) {
    try {
      if (this.isTransitioning) {
        console.warn('Carousel is transitioning, ignoring slide change');
        return;
      }
      
      if (typeof index !== 'number' || isNaN(index)) {
        throw new Error('Slide index must be a valid number');
      }
      
      if (index < 0 || index >= this.slides.length) {
        throw new Error(`Slide index ${index} is out of range (0-${this.slides.length - 1})`);
      }
      
      if (index === this.currentIndex) {
        return; // No change needed
      }

      this.isTransitioning = true;
      this.currentIndex = index;
      this.updateDisplay();
      this.announceSlide();
      this.resetTransitionFlag();

      this.dispatchEvent(new CustomEvent('slide-change', {
        detail: { currentIndex: this.currentIndex, totalSlides: this.slides.length }
      }));
      
    } catch (error) {
      console.error('Error going to slide:', error);
      this.showError('Navigation failed: ' + error.message);
      this.isTransitioning = false; // Reset flag on error
    }
  }

  setupLazyLoading() {
    try {
      if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported, lazy loading disabled');
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          try {
            if (entry.isIntersecting) {
              const img = entry.target.querySelector('img') || entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(entry.target);
              }
            }
          } catch (error) {
            console.error('Error in lazy loading observer:', error);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });

      this.slides.forEach(slide => {
        try {
          observer.observe(slide);
        } catch (error) {
          console.error('Error observing slide for lazy loading:', error);
        }
      });
      
    } catch (error) {
      console.error('Error setting up lazy loading:', error);
      // Don't show user error for lazy loading failure
    }
  }

  pauseAutoplay() {
    clearInterval(this.autoplayInterval);
    this.autoplayInterval = null;
  }

  resumeAutoplay() {
    if (this.getAttribute('autoplay') !== null && !this.autoplayInterval) {
      setTimeout(() => this.startAutoplay(), 3000);
    }
  }

  next() {
    if (this.isTransitioning || this.slides.length <= 1) return;
    
    this.isTransitioning = true;
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.updateDisplay();
    this.announceSlide();
    this.resetTransitionFlag();
    
    this.dispatchEvent(new CustomEvent('slide-change', {
      detail: { currentIndex: this.currentIndex, totalSlides: this.slides.length }
    }));
  }

  prev() {
    if (this.isTransitioning || this.slides.length <= 1) return;
    
    this.isTransitioning = true;
    this.currentIndex = this.currentIndex === 0 ? this.slides.length - 1 : this.currentIndex - 1;
    this.updateDisplay();
    this.announceSlide();
    this.resetTransitionFlag();
    
    this.dispatchEvent(new CustomEvent('slide-change', {
      detail: { currentIndex: this.currentIndex, totalSlides: this.slides.length }
    }));
  }

  resetTransitionFlag() {
    clearTimeout(this._transitionTimeout);
    this._transitionTimeout = setTimeout(() => {
      this.isTransitioning = false;
    }, 600);
  }

  onTransitionEnd() {
    clearTimeout(this._transitionTimeout);
    this.isTransitioning = false;
  }

  handleKeydown(event) {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
      case 'Home':
        event.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        event.preventDefault();
        this.goToSlide(this.slides.length - 1);
        break;
    }
  }

  handleTouchStart(event) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  handleTouchEnd(event) {
    this.touchEndX = event.changedTouches[0].screenX;
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }

  announceSlide() {
    const status = this.shadowRoot.querySelector('#status');
    if (status) {
      status.textContent = `Slide ${this.currentIndex + 1} of ${this.slides.length}`;
    }
  }

  showSwipeHint() {
    const hint = this.shadowRoot.querySelector('.swipe-hint');
    if (hint) {
      hint.style.display = 'block';
      setTimeout(() => {
        hint.style.display = 'none';
      }, 3000);
    }
  }

  showLoading() {
    const wrapper = this.shadowRoot.querySelector('.carousel-wrapper');
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.textContent = 'Loading images...';
    wrapper.appendChild(loading);
  }

  hideLoading() {
    const loading = this.shadowRoot.querySelector('.loading');
    if (loading) {
      loading.remove();
    }
  }

  cleanup() {
    clearInterval(this.autoplayInterval);
    clearTimeout(this._transitionTimeout);
    this.removeEventListener('keydown', this.handleKeydown);
    this.removeEventListener('touchstart', this.handleTouchStart);
    this.removeEventListener('touchend', this.handleTouchEnd);
    this.removeEventListener('mouseenter', this.pauseAutoplay);
    this.removeEventListener('mouseleave', this.resumeAutoplay);
    this.removeEventListener('focusin', this.pauseAutoplay);
    this.removeEventListener('focusout', this.resumeAutoplay);
  }

  setupImageErrorHandling() {
    this.slides.forEach((slide, index) => {
      const img = slide.tagName === 'IMG' ? slide : slide.querySelector('img');
      if (img) {
        img.onerror = () => {
          // Add retry logic
          const originalSrc = img.src;
          const retryCount = img.dataset.retryCount ? parseInt(img.dataset.retryCount) : 0;
          
          if (retryCount < 2) {
            // Retry loading the original image after 2 seconds
            setTimeout(() => {
              if (img.src === originalSrc) {
                img.dataset.retryCount = (retryCount + 1).toString();
                img.src = originalSrc + '?retry=' + Date.now(); // Cache bust
              }
            }, 2000);
          } else {
            // After 2 retries, use fallback image
            const fallbackSrc = img.dataset.fallback || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
            img.src = fallbackSrc;
            img.style.opacity = '0.8';
            img.style.filter = 'grayscale(100%)';
          }
          
          img.alt = `Image ${index + 1} failed to load`;
          
          // Show error message only after all retries failed
          if (retryCount >= 2) {
            this.showError(`Image ${index + 1} could not be loaded`);
          }
        };
        
        // Also handle successful loads to clear retry count
        img.onload = () => {
          img.removeAttribute('data-retry-count');
          img.style.opacity = '';
          img.style.filter = '';
        };
      }
    });
  }

  // Public API methods
  getCurrentSlide() {
    return this.currentIndex;
  }

  getTotalSlides() {
    return this.slides.length;
  }

  play() {
    this.startAutoplay();
  }

  pause() {
    this.pauseAutoplay();
  }

  showError(message) {
    try {
      const wrapper = this.shadowRoot.querySelector('.carousel-wrapper');
      if (!wrapper) {
        console.error('Cannot show error: wrapper not found');
        return;
      }
      
      // Remove existing error messages
      const existingError = wrapper.querySelector('.error');
      if (existingError) {
        existingError.remove();
      }
      
      const error = document.createElement('div');
      error.className = 'error';
      error.textContent = message;
      error.setAttribute('role', 'alert');
      error.setAttribute('aria-live', 'polite');
      wrapper.appendChild(error);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (error.parentNode) {
          error.remove();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error showing error message:', error);
    }
  }
}

customElements.define('image-carousel', ImageCarousel);