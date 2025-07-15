class InputKnob extends HTMLElement {
  static formAssociated = true;

  constructor() {
    super();
    
  }

  connectedCallback() {
    this.min = parseFloat(this.getAttribute('min')) || 0;
    this.max = parseFloat(this.getAttribute('max')) || 100;
    this.step = parseFloat(this.getAttribute('step')) || 1;
    this.sweep = parseFloat(this.getAttribute('sweep')) || 270;
    this.direction = this.getAttribute('direction') || 'top';
    this.value = parseFloat(this.getAttribute('value')) || this.min;

    this._internals = this.attachInternals();

    this.shadow = this.attachShadow({ mode: 'open' });
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
    `;

    this.svg = this.shadow.querySelector('svg');
    this.input = document.createElement('input');
    this.input.type = 'hidden';
    this.appendChild(this.input);

    this.pointer = this.shadow.querySelector('#pointer');
    this.text = this.shadow.querySelector('text');
    this.highlight = this.shadow.querySelector('#highlight');

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);

    this.svg.addEventListener('mousedown', (e) => {
      this._dragging = true;
      window.addEventListener('mousemove', this._onMouseMove);
      window.addEventListener('mouseup', this._onMouseUp);
      this._onMouseMove(e);
    });


    this._updateVisuals();
  }

  _onMouseMove(event) {
    const rect = this.svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    const dirAngle = {
      right: 0,
      top: -Math.PI / 2,
      left: Math.PI,
      bottom: Math.PI / 2
    }[this.direction];

    const sweepRad = this.sweep * Math.PI / 180;
    const offset = dirAngle - (sweepRad / 2);
    angle -= offset;
    angle = (angle + 2 * Math.PI) % (2 * Math.PI); // Normalize to [0, 2π)
    const epsilon = 0.000001;

    // Exit early if angle is outside arc range
    if (angle < -epsilon || angle > sweepRad + epsilon){
        return;
    }

    const ratio = angle / sweepRad;
    const rawValue = ratio * (this.max - this.min) + this.min;
    const stepped = Math.round(rawValue / this.step) * this.step;
    const clamped = Math.max(this.min, Math.min(this.max, stepped));
    this.value = clamped;
    this._updateVisuals();
  }

  _onMouseUp() {
    this._dragging = false;
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
  }

  _updateVisuals() {
    this.input.value = this.value;
    this._internals.setFormValue(this.value);
    this.setAttribute('value', this.value);
    this.text.textContent = this.value;

    // Rotate pointer
    const dirAngle = {
      right: 0,
      top: -Math.PI / 2,
      left: Math.PI,
      bottom: Math.PI / 2
    }[this.direction];
    const sweepRad = this.sweep * Math.PI / 180;
    const startDeg = dirAngle * 180 / Math.PI - this.sweep / 2;
    const ratio = (this.value - this.min) / (this.max - this.min);
    const angleDeg = startDeg + ratio * this.sweep;

    this.pointer.style.transform = `rotate(${angleDeg}deg)`;

    // Update arc highlight
    const r = 40;
    const circumference = 2 * Math.PI * r;
    const arcLength = ratio * (this.sweep / 360);
    this.highlight.setAttribute('stroke-dasharray', circumference.toFixed(1));
    this.highlight.setAttribute('stroke-dashoffset', (circumference * (1 - arcLength)).toFixed(1));
    this.highlight.setAttribute('transform', `rotate(${startDeg} 50 50)`);
  }

  formAssociatedCallback() {}
  formDisabledCallback() {}
  formResetCallback() {
    this.value = this.min;
    this._updateVisuals();
  }
  formStateRestoreCallback(value) {
    this.value = parseFloat(value);
    this._updateVisuals();
  }
}

customElements.define('input-knob', InputKnob);