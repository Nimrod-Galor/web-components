/**
 * InputKnob - A circular range input control
 * @customElement input-knob
 * @extends HTMLElement
 * @fires input - When value changes during interaction
 * @fires change - When interaction ends (mouseup/touchend)
 * 
 * @csspart circle - The base circle
 * @csspart pointer - The indicator line
 * @csspart highlight - The progress arc
 * 
 * @cssprop --stroke-color - Color of the base circle
 * @cssprop --stroke-width - Width of the base circle
 * @cssprop --pointer-stroke-color - Color of the pointer
 * @cssprop --pointer-stroke-width - Width of the pointer
 * @cssprop --highlight-stroke-color - Color of the progress arc
 * @cssprop --highlight-stroke-width - Width of the progress arc
 */
class InputKnob extends HTMLElement {
  static formAssociated = true

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._onSvgMouseDown = this._onSvgMouseDown.bind(this)
    this._onSvgTouchStart = this._onSvgTouchStart.bind(this)
    this._onMouseMove = this._onMouseMove.bind(this)
    this._onMouseUp = this._onMouseUp.bind(this)
    this._onTouchMove = this._onTouchMove.bind(this)
    this._onTouchEnd = this._onTouchEnd.bind(this)
  }

  static get observedAttributes() {
    return ['min', 'max', 'step', 'sweep', 'direction', 'value', 'disabled']
  }

  get min() {
    return Number(this.getAttribute('min')) || 0
  }

  set min(value) {
    const num = Number(value);
    if (isNaN(num)) {
        console.warn(`Invalid min value: ${value}`);
        return;
    }
    this.setAttribute('min', num);
    // Re-validate current value
    if (this.value < num) {
        this.value = num;
    }
  }

  get max() {
    return Number(this.getAttribute('max')) || 100
  }

  set max(value) {
    const num = Number(value);
    if (isNaN(num)) {
        console.warn(`Invalid max value: ${value}`);
        return;
    }
    this.setAttribute('max', num);
    // Re-validate current value
    if (this.value > num) {
        this.value = num;
    }
  }

  get step() {
    return Number(this.getAttribute('step')) || 1
  }

  set step(value) {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
        console.warn(`Step must be a positive number. Received: ${value}`);
        return;
    }
    this.setAttribute('step', num);
    // Re-validate current value
    if ((this.value - this.min) % num !== 0) {
        // Snap to nearest valid step
        const stepped = Math.round((this.value - this.min) / num) * num + this.min;
        this.value = Math.max(this.min, Math.min(this.max, stepped));
    }
  }

  get sweep() {
    return Number(this.getAttribute('sweep')) || 270
  }

  set sweep(value) {
    const num = Number(value)
    if (isNaN(num) || num <= 0 || num > 360) {
        console.warn('Sweep must be between 0 and 360 degrees')
        return
    }
    this.setAttribute('sweep', value)
  }

  get direction() {
    return this.getAttribute('direction') || 'top'
  }

  set direction(value) {
    this.setAttribute('direction', value)
  }

  get value() {
    const val = Number(this.getAttribute('value'));
    return isNaN(val) ? this.min : Math.max(this.min, Math.min(this.max, val));
}

  set value(value) {
    const num = Number(value);
    if (isNaN(num)) {
        console.warn(`Invalid value: ${value}`);
        return;
    }
    const clamped = Math.max(this.min, Math.min(this.max, num));
    if (clamped !== num) {
        console.warn(`Value ${num} clamped to ${clamped}`);
    }
    if (this.value !== clamped) {
        this.setAttribute('value', clamped);
        this._updateVisuals();
        this.dispatchEvent(new Event('input', { bubbles: true }));
        this.setAttribute('aria-valuenow', clamped);
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
}

set disabled(value) {
    if (value) {
        this.setAttribute('disabled', '');
        this.setAttribute('aria-disabled', 'true');
    } else {
        this.removeAttribute('disabled');
        this.removeAttribute('aria-disabled');
    }
}

  attributeChangedCallback(name, oldValue, newValue) {
    if(oldValue && oldValue !== newValue) {
      if (name !== 'value') {
        // Clamp value if min/max/step/sweep/direction changed
        this.value = Math.max(this.min, Math.min(this.max, Math.round(this.value / this.step) * this.step))
      }else if(this.shadow) {
        this._updateVisuals()
      }
    }
  }

  connectedCallback() {
    this._internals = this.attachInternals()

    this.shadowRoot.innerHTML = `
      <svg viewBox="0 0 100 100">
        <circle id="circle" cx="50" cy="50" r="40" stroke="#eee" stroke-width="8" fill="none" />
        <circle id="highlight" cx="50" cy="50" r="40" stroke="#00aaff" stroke-width="8" fill="none"
                stroke-dasharray="251.2" stroke-dashoffset="251.2" />
        <line id="pointer" x1="90" y1="50" x2="68" y2="50" stroke="black" stroke-width="3"
              stroke-linecap="round" style="transform-origin: 50% 50%; transform: rotate(0deg);" />
        <text x="50" y="50">0</text>
      </svg>
    `

    const sheet = new CSSStyleSheet();
        sheet.replaceSync(`:host {
          display: inline-block;
          width: 100px;
          height: 100px;
          user-select: none;
        }
        svg {
          width: 100%;
          height: 100%;
        }
        text {
          font-size: 12px;
          text-anchor: middle;
          dominant-baseline: middle;
          fill: #333;
        }
        #circle{
            stroke: var(--stroke-color, #eee);
            stroke-width: var(--stroke-width, 8px);
        }
        #pointer{
            stroke: var(--pointer-stroke-color, #000);
            stroke-width: var(--pointer-stroke-width, 1px);
        }
        #highlight{
            stroke: var(--highlight-stroke-color, #00aaff);
            stroke-width: var(--highlight-stroke-width, 8px);
        }`)
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.svg = this.shadowRoot.querySelector('svg')

    this.pointer = this.shadowRoot.querySelector('#pointer')
    this.text = this.shadowRoot.querySelector('text')
    this.highlight = this.shadowRoot.querySelector('#highlight')

    

    // Mouse events
    this.svg.addEventListener('mousedown', this._onSvgMouseDown)
    // Touch events
    this.svg.addEventListener('touchstart', this._onSvgTouchStart)
    // Keyboard events
    this.addEventListener('keydown', this._onKeyDown)

    this.setAttribute('role', 'slider')
    this.setAttribute('tabindex', '0')
    this.setAttribute('aria-valuemin', this.min)
    this.setAttribute('aria-valuemax', this.max)
    this.setAttribute('aria-valuenow', this.value)
    this.setAttribute('aria-label', 'Input Knob')
    this._updateVisuals()
  }

  _onSvgMouseDown = (e) => {
    if (this.disabled) return;
    this._dragging = true
    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup', this._onMouseUp)
    this._onMouseMove(e)
  }

  _onSvgTouchStart = (e) => {
    this._dragging = true
    window.addEventListener('touchmove', this._onTouchMove, { passive: false })
    window.addEventListener('touchend', this._onTouchEnd)
    this._onTouchMove(e)
  }

  _onKeyDown = (e) => {
    if (this.disabled){
      return;
    }
    let changed = false
    let fireChange = false
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      this.value = Math.min(this.max, this.value + this.step)
      changed = true
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      this.value = Math.max(this.min, this.value - this.step)
      changed = true
    } else if (e.key === 'Home') {
      this.value = this.min
      changed = fireChange = true
    } else if (e.key === 'End') {
      this.value = this.max
      changed = fireChange = true
    }else if (e.key === 'Enter' || e.key === ' ') {
        fireChange = true
    }
    if (changed) {
      this._updateVisuals()
      e.preventDefault()
    }
    if(fireChange){
      this.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  disconnectedCallback() {
    // Cleanup event listeners
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
    window.removeEventListener('touchmove', this._onTouchMove)
    window.removeEventListener('touchend', this._onTouchEnd)

    // Remove bound event listeners
    this.svg.removeEventListener('mousedown', this._onSvgMouseDown)
    this.svg.removeEventListener('touchstart', this._onSvgTouchStart)
    this.removeEventListener('keydown', this._onKeyDown)
  }

  _onMouseMove(event) {
    if (!this._dragging){
      return;
    }
    
    // Cache values that don't change during drag
    if (!this._dragCache) {
        const rect = this.svg.getBoundingClientRect();
        this._dragCache = {
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
            dirAngle: {
                right: 0,
                top: -Math.PI / 2,
                left: Math.PI,
                bottom: Math.PI / 2
            }[this.direction],
            sweepRad: this.sweep * Math.PI / 180
        };
    }
    
    // Use cached values
    const { centerX, centerY, dirAngle, sweepRad } = this._dragCache;

    let angle = Math.atan2(event.clientY - centerY, event.clientX - centerX)
    angle -= dirAngle - (sweepRad / 2)
    angle = (angle + 2 * Math.PI) % (2 * Math.PI) // Normalize to [0, 2π)
    const epsilon = 0.000001

    // Exit early if angle is outside arc range
    if (angle < -epsilon || angle > sweepRad + epsilon){
        return
    }

    const ratio = angle / sweepRad
    const rawValue = ratio * (this.max - this.min) + this.min
    const stepped = Math.round(rawValue / this.step) * this.step
    const clamped = Math.max(this.min, Math.min(this.max, stepped))
    this.value = clamped
    this._updateVisuals()
  }

  _onMouseUp() {
    this._dragging = false
    this._dragCache = null; // Clear cache for next interaction
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  _onTouchMove = (event) => {
    if (!event.touches || event.touches.length === 0) return
    // Prevent scrolling while dragging
    event.preventDefault()
    const touch = event.touches[0]
    // Create a synthetic event object with clientX/clientY for reuse
    this._onMouseMove({ clientX: touch.clientX, clientY: touch.clientY })
  }

  _onTouchEnd = () => {
    this._dragging = false
    this._dragCache = null; // Clear cache for next interaction
    window.removeEventListener('touchmove', this._onTouchMove)
    window.removeEventListener('touchend', this._onTouchEnd)
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  _updateVisuals() {
    // Guard against missing elements
    if (!this.shadowRoot) return;

    // Update form value if available
    if (this._internals) {
        this._internals.setFormValue(this.value);
    }

    // Update attributes and text
    this.setAttribute('value', this.value);
    this.setAttribute('aria-valuenow', this.value); // Ensure aria-valuenow is always in sync
    if (this.text) {
        this.text.textContent = this.value;
    }

    // Early return if required elements are missing
    if (!this.pointer || !this.highlight) {
        console.warn('Required elements missing');
        return;
    }

    // Rotate pointer
    const dirAngle = {
      right: 0,
      top: -Math.PI / 2,
      left: Math.PI,
      bottom: Math.PI / 2
    }[this.direction]
    const startDeg = dirAngle * 180 / Math.PI - this.sweep / 2

    let ratio = 0;
    if (this.max !== this.min) {
      ratio = (this.value - this.min) / (this.max - this.min)
    }
    
    const angleDeg = startDeg + ratio * this.sweep

    this.pointer.style.transform = `rotate(${angleDeg}deg)`
    
    // Update arc highlight
    const r = 40
    const circumference = 2 * Math.PI * r
    const arcLength = ratio * (this.sweep / 360)
    
    this.highlight.setAttribute('stroke-dasharray', circumference.toFixed(1))
    this.highlight.setAttribute('stroke-dashoffset', (circumference * (1 - arcLength)).toFixed(1))
    this.highlight.setAttribute('transform', `rotate(${startDeg} 50 50)`)
    
  }

  formResetCallback() {
    this.value = this.min
  }

  formStateRestoreCallback(value) {
    if (value != null && !isNaN(value)) {
      this.value = parseFloat(value);
    }
  }
}

customElements.define('input-knob', InputKnob)