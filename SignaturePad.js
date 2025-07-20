/**
 * SignaturePad Web Component
 * A form-associated custom element that captures handwritten signatures
 * 
 * @customElement signature-pad
 * @extends HTMLElement
 * @csspart canvas - The signature drawing area
 * @csspart clear-button - The clear signature button
 * 
 * @fires signature-ready - When signature is captured and processed
 * @fires signature-cleared - When signature is cleared
 * 
 * @property {File} signatureFile - The captured signature as a PNG file
 * @property {HTMLCanvasElement} canvas - The drawing canvas element
 * @property {boolean} required - Whether a signature is required
 * 
 * @attr {boolean} required - Makes the signature required for form validation
 * 
 * @example
 * <!-- Basic usage -->
 * <signature-pad></signature-pad>
 * 
 * <!-- Required in a form -->
 * <form>
 *   <signature-pad required></signature-pad>
 *   <button type="submit">Submit</button>
 * </form>
 */
class SignaturePad extends HTMLElement {
    // enable form association
    static formAssociated = true

    /** Minimum number of non-empty pixels required for a valid signature */
    static MIN_PIXEL_COUNT = 350

    /** @private */
    #ctx
    #drawing = false

    constructor() {
        super()
    }

    static get observedAttributes() {
        return ['required', 'line-width', 'line-color']
    }
    
    get required() {
        return this.hasAttribute('required')
    }

    get lineWidth() {
        return Number(this.getAttribute('line-width')) || 2
    }

    get lineColor() {
        return this.getAttribute('line-color') || '#000'
    }

    checkValidity() {
        return this._internals.checkValidity()
    }

    reportValidity() {
        return this._internals.reportValidity()
    }

    focus() {
        this.canvas?.focus()
    }

    connectedCallback() {
        this._internals = this.attachInternals() // required to interact with forms
        this.tabIndex = 0

        // Create a shadow root
        const shadow = this.attachShadow({ mode: "open", delegatesFocus: true })

        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(`
            :host {
                display: block;
                width: 100%;
                max-width: 400px;
            }
            canvas { 
                border: 1px solid var(--border-color, #ccc) ;
                touch-action: none ;
                display: block ;
                width: 100%;
                background: var(--canvas-bg, white);
                cursor: auto;
            }
            canvas:focus {
                outline: 2px solid var(--focus-color, #0066cc);
                outline-offset: 2px;
            }
            button { 
                margin-top: 8px;
                padding: 8px 16px;
                border: 1px solid var(--button-border, #ccc);
                background: var(--button-bg, white);
                cursor: pointer;
            }
            button:disabled { 
                opacity: 0.4;
                cursor: not-allowed;
            }
            button:hover:not(:disabled) {
                background: var(--button-hover-bg, #f0f0f0);
            }
        `)

        shadow.adoptedStyleSheets = [sheet]

        this._debounceTimeout = null
        this._debounceDelay = 500


        this.canvas = document.createElement('canvas')
        this.canvas.width = 400
        this.canvas.height = 200
        this.canvas.tabIndex = 0
        this.#ctx = this.canvas.getContext('2d')
        
        // Set initial drawing styles
        this.#ctx.lineWidth = this.lineWidth
        this.#ctx.lineCap = 'round'
        this.#ctx.lineJoin = 'round'
        this.#ctx.strokeStyle = this.lineColor

        shadow.appendChild(this.canvas)

        this._clearBtn = document.createElement('button')
        this._clearBtn.innerText = 'Clear'
        shadow.appendChild(this._clearBtn)

        this.#drawing = false

        // handle validation
        if (this.required) {
            this._internals.setValidity({ valueMissing: true }, "Signature is required", this.canvas)
        }

        this._clearBtn.disabled = true

        
        this._clearBtn.addEventListener('click', this._clearCanvas)

        this.canvas.addEventListener('mousedown', this._start)
        this.canvas.addEventListener('mousemove', this._move)
        this.canvas.addEventListener('mouseup', this._stop)
        this.canvas.addEventListener('mouseout', this._stop)

        this.canvas.addEventListener('touchstart', this._touchStartHandler)
        this.canvas.addEventListener('touchmove', this._touchMoveHandler)
        this.canvas.addEventListener('touchend', this._stop)

        // Create and setup resize observer
        this._resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect
            
            // Only preserve if canvas has content
            let imageData = null
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                try {
                    imageData = this.#ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
                } catch (e) {
                    console.warn('Failed to get image data during resize:', e)
                }
            }
            
            // Update canvas dimensions
            this.canvas.width = width
            this.canvas.height = height
            
            // Restore drawing context properties
            this.#ctx.lineWidth = this.lineWidth
            this.#ctx.lineCap = 'round'
            this.#ctx.lineJoin = 'round'
            this.#ctx.strokeStyle = this.lineColor
            
            // Restore signature if we had one
            if (imageData) {
                try {
                    this.#ctx.putImageData(imageData, 0, 0)
                } catch (e) {
                    console.warn('Failed to restore image data during resize:', e)
                }
            }
        })
        
        this._resizeObserver.observe(this)

        // Make canvas responsive by default
        this.canvas.style.width = '100%'
        this.canvas.style.height = '200px'
        
        // Set initial pixel dimensions
        this._updateCanvasSize()
    }

    _updateCanvasSize() {
        const rect = this.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        
        // Set actual size in memory (scaled up for high DPI)
        this.canvas.width = rect.width * dpr
        this.canvas.height = rect.height * dpr
        
        // Scale back down using CSS
        this.canvas.style.width = rect.width + 'px'
        this.canvas.style.height = rect.height + 'px'
        
        // Scale the drawing context so everything draws at the correct size
        this.#ctx.scale(dpr, dpr)
        
        // Restore drawing properties
        this.#ctx.lineWidth = this.lineWidth
        this.#ctx.lineCap = 'round'
        this.#ctx.lineJoin = 'round'
        this.#ctx.strokeStyle = this.lineColor
    }

    disconnectedCallback() {
        this._clearBtn.removeEventListener('click', this._clearCanvas)
        this.canvas.removeEventListener('mousedown', this._start)
        this.canvas.removeEventListener('mousemove', this._move)
        this.canvas.removeEventListener('mouseup', this._stop)
        this.canvas.removeEventListener('mouseout', this._stop)
        this.canvas.removeEventListener('touchstart', this._touchStartHandler)
        this.canvas.removeEventListener('touchmove', this._touchMoveHandler)
        this.canvas.removeEventListener('touchend', this._stop)
        this._resizeObserver?.disconnect()
    }

    /** @private Reset the canvas state */
    _resetCanvas = () => {
        this.#ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.signatureFile = null
        this._internals.setFormValue(null)

        // handle validation
        if (this.required) {
            this._internals.setValidity({ valueMissing: true }, "Signature is required", this.canvas)
        } else {
            this._internals.setValidity({})
        }

        this._clearBtn.disabled = true

        this.dispatchEvent(new CustomEvent("signature-cleared", {
            bubbles: true,
            composed: true
        }))
    }

    /** @private Handle clear button click with confirmation */
    _clearCanvas = () => {
        if (window.confirm("Are you sure you want to clear the signature?")) {
            this._resetCanvas()
        }
    }

    /** Public method to reset the signature pad */
    reset() {
        this._resetCanvas()
    }

    _touchStartHandler = (e) => {
        this._start(e.touches[0])
    }

    _touchMoveHandler = (e) => {
        this._move(e.touches[0])
        e.preventDefault()
    }

    _getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect()
        return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
        }
    }

    _start = (e) => {
        this.#drawing = true
        const { x, y } = this._getPos(e)
        this.#ctx.beginPath()
        this.#ctx.moveTo(x, y)
    }

    _move = (e) => {
        if (!this.#drawing) return
        const { x, y } = this._getPos(e)
        this.#ctx.lineTo(x, y)
        this.#ctx.stroke()
    }

    _stop = () => {
        if (!this.#drawing){
            return
        }
        this.#drawing = false
        this._enableClearIfNotEmpty(this.canvas)
        this._debounceSave(this.canvas)
    }

  _debounceSave(canvas) {
    if (this._debounceTimeout) clearTimeout(this._debounceTimeout)

    this._debounceTimeout = setTimeout(() => {
      canvas.toBlob(blob => {
        if (!blob) {
            console.error("Failed to convert canvas to blob")
            this._internals.setValidity({ customError: true }, "Failed to save signature")
            return
        }
        const file = new File([blob], "signature.png", { type: "image/png" })

        // handle input validation
        if (this.required && !file) {
            this._internals.setFormValue(null)
            this._internals.setValidity({ valueMissing: true }, "Signature is required", canvas)
        } else if(this.required && this._isMinLength()){
            this._internals.setFormValue(null)
            this._internals.setValidity({ customError: true }, "Signature is too small. Please try again.", canvas)
        } else {
            this._internals.setValidity({})
        }

        this.signatureFile = file

        //set file as form value
        this._internals.setFormValue(file)

        this.dispatchEvent(new CustomEvent("signature-ready", {
          detail: { file },
          bubbles: true,
          composed: true
        }))
      })
    }, this._debounceDelay)
  }

  _enableClearIfNotEmpty(canvas) {
    const imgData = this.#ctx.getImageData(0, 0, canvas.width, canvas.height).data

    const isEmpty = !Array.from(imgData).some(channel => channel !== 0)
    this._clearBtn.disabled = isEmpty
  }

  _isMinLength() {
    const imageData = this.#ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const pixels = imageData.data

    let nonEmptyPixelCount = 0
    for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3] // 0 = transparent
        if (alpha !== 0){
            nonEmptyPixelCount++
        }
    }

    return nonEmptyPixelCount < SignaturePad.MIN_PIXEL_COUNT
  }

  /** Form reset callback */
  formResetCallback() {
    this._resetCanvas()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.#ctx || oldValue === newValue) return
        
        switch (name) {
            case 'line-width':
                this.#ctx.lineWidth = this.lineWidth
                break
            case 'line-color':
                this.#ctx.strokeStyle = this.lineColor
                break
            case 'required':
                this._updateValidation()
                break
        }
    }

    _updateValidation() {
        if (this.required && (!this.signatureFile || this._isMinLength())) {
            this._internals.setValidity({ valueMissing: true }, "Signature is required", this.canvas)
        } else {
            this._internals.setValidity({})
        }
    }
}

customElements.define('signature-pad', SignaturePad)
