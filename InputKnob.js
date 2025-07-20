/**
 * A circular range input control
 * @customElement
 * @extends HTMLElement
 * @fires InputKnob#change
 * @fires InputKnob#input
 * @attr {number} min - Minimum value
 * @attr {number} max - Maximum value
 * @attr {number} step - Step increment
 * @attr {number} sweep - Sweep angle in degrees
 * @attr {string} direction - Starting direction (top|right|bottom|left)
 */
class InputKnob extends HTMLElement {
  static formAssociated = true

  constructor() {
    super()
  }

  static get observedAttributes() {
    return ['min', 'max', 'step', 'sweep', 'direction', 'value']
  }

  get min() {
    return Number(this.getAttribute('min')) || 0
  }

  set min(value) {
    this.setAttribute('min', value)
  }

  get max() {
    return Number(this.getAttribute('max')) || 100
  }

  set max(value) {
    this.setAttribute('max', value)
  }

  get step() {
    return Number(this.getAttribute('step')) || 1
  }

  set step(value) {
    this.setAttribute('step', value)
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
    return Number(this.getAttribute('value')) || this.min
  }

  set value(value) {
    const num = Number(value)
    if (this.value !== num) {
      this.setAttribute('value', num)
      this._updateVisuals()
      this.dispatchEvent(new Event('input', { bubbles: true }))
      this.setAttribute('aria-valuenow', num)
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

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = `
      <style>
        :host {
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
        }
      </style>
      <svg viewBox="0 0 100 100">
        <circle id="circle" cx="50" cy="50" r="40" stroke="#eee" stroke-width="8" fill="none" />
        <circle id="highlight" cx="50" cy="50" r="40" stroke="#00aaff" stroke-width="8" fill="none"
                stroke-dasharray="251.2" stroke-dashoffset="251.2" />
        <line id="pointer" x1="90" y1="50" x2="68" y2="50" stroke="black" stroke-width="3"
              stroke-linecap="round" style="transform-origin: 50% 50%; transform: rotate(0deg);" />
        <text x="50" y="50">0</text>
      </svg>
    `

    this.svg = this.shadow.querySelector('svg')

    this.pointer = this.shadow.querySelector('#pointer')
    this.text = this.shadow.querySelector('text')
    this.highlight = this.shadow.querySelector('#highlight')

    this._onMouseMove = this._onMouseMove.bind(this)
    this._onMouseUp = this._onMouseUp.bind(this)
    this._onTouchMove = this._onTouchMove.bind(this)
    this._onTouchEnd = this._onTouchEnd.bind(this)

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
    let changed = false
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
    const rect = this.svg.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let angle = Math.atan2(event.clientY - centerY, event.clientX - centerX)
    const dirAngle = {
      right: 0,
      top: -Math.PI / 2,
      left: Math.PI,
      bottom: Math.PI / 2
    }[this.direction]

    const sweepRad = this.sweep * Math.PI / 180
    const offset = dirAngle - (sweepRad / 2)
    angle -= offset
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
    window.removeEventListener('touchmove', this._onTouchMove)
    window.removeEventListener('touchend', this._onTouchEnd)
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  _updateVisuals() {
    if (this._internals) {
        this._internals.setFormValue(this.value)
    }
    this.setAttribute('value', this.value)
    this.text.textContent = this.value

    // Rotate pointer
    const dirAngle = {
      right: 0,
      top: -Math.PI / 2,
      left: Math.PI,
      bottom: Math.PI / 2
    }[this.direction]
    const sweepRad = this.sweep * Math.PI / 180
    const startDeg = dirAngle * 180 / Math.PI - this.sweep / 2
    const ratio = (this.value - this.min) / (this.max - this.min)
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

  formAssociatedCallback() {}
  formDisabledCallback() {}
  formResetCallback() {
    this.value = this.min
    this._updateVisuals()
  }
  formStateRestoreCallback(value) {
    this.value = parseFloat(value)
    this._updateVisuals()
  }
}

customElements.define('input-knob', InputKnob)