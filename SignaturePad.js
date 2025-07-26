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
    static get MIN_STROKE_COUNT() { return 2; }

    /** @private */
    #ctx
    #drawing = false
    #strokeCount = 0

    constructor() {
        super()
        this._drawFrame = null // Add this initialization
        this.#strokeCount = 0   // Initialize stroke count
    }

    static get observedAttributes() {
        return ['required', 'line-width', 'line-color', 'debounce-delay']
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

    get debounceDelay() {
        return Number(this.getAttribute('debounce-delay')) || 500
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
        this._internals = this.attachInternals()
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
        this._debounceDelay = this.debounceDelay


        // Add accessible label before the canvas
        const canvasLabel = document.createElement('label')
        canvasLabel.setAttribute('for', 'signature-canvas')
        canvasLabel.textContent = 'Signature area. Draw your signature below.'
        canvasLabel.style.display = 'block'
        canvasLabel.style.marginBottom = '4px'
        shadow.appendChild(canvasLabel)

        this.canvas = document.createElement('canvas')
        this.canvas.id = 'signature-canvas'
        this.canvas.width = 400
        this.canvas.height = 200
        this.canvas.tabIndex = 0
        this.canvas.setAttribute('aria-label', 'Signature drawing area')
        
        // Add willReadFrequently for better performance with frequent getImageData calls
        this.#ctx = this.canvas.getContext('2d', { willReadFrequently: true })
        
        // Set initial drawing styles
        this.#ctx.lineWidth = this.lineWidth
        this.#ctx.lineCap = 'round'
        this.#ctx.lineJoin = 'round'
        this.#ctx.strokeStyle = this.lineColor

        shadow.appendChild(this.canvas)

        this._clearBtn = document.createElement('button')
        this._clearBtn.innerText = 'Clear'
        this._clearBtn.setAttribute('aria-disabled', 'true')
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

            let imageData = null
            let oldWidth = this.canvas.width
            let oldHeight = this.canvas.height
            if (oldWidth > 0 && oldHeight > 0) {
                try {
                    imageData = this.#ctx.getImageData(0, 0, oldWidth, oldHeight)
                } catch (e) {
                    console.warn('Failed to get image data during resize:', e)
                }
            }

            this.canvas.width = width
            this.canvas.height = height

            this.#ctx.lineWidth = this.lineWidth
            this.#ctx.lineCap = 'round'
            this.#ctx.lineJoin = 'round'
            this.#ctx.strokeStyle = this.lineColor

            // Scale image data if needed
            if (imageData && (oldWidth !== width || oldHeight !== height)) {
                try {
                    // Create a temporary canvas to scale the image
                    const tempCanvas = document.createElement('canvas')
                    tempCanvas.width = oldWidth
                    tempCanvas.height = oldHeight
                    tempCanvas.getContext('2d').putImageData(imageData, 0, 0)
                    this.#ctx.drawImage(tempCanvas, 0, 0, width, height)
                } catch (e) {
                    console.warn('Failed to scale image data during resize:', e)
                }
            } else if (imageData) {
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

    _updateCanvasSize(width, height) {
        const dpr = window.devicePixelRatio || 1
        
        // Save existing content before resize
        let imageData = null
        if (this.canvas.width > 0 && this.canvas.height > 0) {
            try {
                imageData = this.#ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
            } catch (e) {
                console.warn('Failed to save canvas content:', e)
            }
        }
        
        // Update canvas dimensions
        this.canvas.width = width * dpr
        this.canvas.height = height * dpr
        this.canvas.style.width = width + 'px'
        this.canvas.style.height = height + 'px'
        
        // Scale context for high DPI
        this.#ctx.scale(dpr, dpr)
        this._restoreDrawingContext()
        
        // Restore content if it existed
        if (imageData) {
            this._restoreScaledImage(imageData, width, height)
        }
    }

    _restoreDrawingContext() {
        this.#ctx.lineWidth = this.lineWidth
        this.#ctx.lineCap = 'round'
        this.#ctx.lineJoin = 'round'
        this.#ctx.strokeStyle = this.lineColor
    }

    /**
     * Restores and scales image data to fit new canvas dimensions
     * @private
     * @param {ImageData} imageData - The original image data
     * @param {number} newWidth - New canvas width
     * @param {number} newHeight - New canvas height
     */
    _restoreScaledImage(imageData, newWidth, newHeight) {
        try {
            // Create temporary canvas with original dimensions
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = imageData.width
            tempCanvas.height = imageData.height
            const tempCtx = tempCanvas.getContext('2d')
            
            // Put original image data on temp canvas
            tempCtx.putImageData(imageData, 0, 0)
            
            // Draw scaled image onto main canvas
            // Note: newWidth/newHeight are already in CSS pixels, not device pixels
            this.#ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight)
            
            // Clean up temp canvas
            tempCanvas.width = tempCanvas.height = 0
        } catch (e) {
            console.warn('Failed to restore scaled image:', e)
        }
    }

    disconnectedCallback() {
        // Cancel any pending animation frames
        if (this._drawFrame) {
            cancelAnimationFrame(this._drawFrame)
            this._drawFrame = null
        }
        
        // Clear timeouts
        if (this._debounceTimeout) {
            clearTimeout(this._debounceTimeout)
            this._debounceTimeout = null
        }
        
        // Disconnect observers
        this._resizeObserver?.disconnect()
        this._resizeObserver = null
        
        // Remove event listeners (existing code is good)
        this._clearBtn?.removeEventListener('click', this._clearCanvas);
        this.canvas?.removeEventListener('mousedown', this._start);
        this.canvas?.removeEventListener('mousemove', this._move);
        this.canvas?.removeEventListener('mouseup', this._stop);
        this.canvas?.removeEventListener('mouseout', this._stop);
        this.canvas?.removeEventListener('touchstart', this._touchStartHandler);
        this.canvas?.removeEventListener('touchmove', this._touchMoveHandler);
        this.canvas?.removeEventListener('touchend', this._stop);
        
        // Clear all references
        this.#ctx = null
        this.canvas = null
        this._clearBtn = null
        this.signatureFile = null
        this._internals = null
    }

    /** @private Reset the canvas state */
    _resetCanvas = () => {
        this.#ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.signatureFile = null
        this._internals.setFormValue(null)
        this.#strokeCount = 0  // Reset stroke count

        // handle validation
        if (this.required) {
            this._internals.setValidity({ valueMissing: true }, "Signature is required", this.canvas)
        } else {
            this._internals.setValidity({})
        }

        this._clearBtn.disabled = true
        this._clearBtn.setAttribute('aria-disabled', 'true')

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
        if (!this.#ctx){
            return;
        }
        
        this.#drawing = true
        this.#strokeCount++
        const { x, y } = this._getPos(e)
        this.#ctx.beginPath()
        this.#ctx.moveTo(x, y)
    }

    _move = (e) => {
        if (!this.#drawing || !this.#ctx){
            return;
        }
    
        if (!this._drawFrame) {
            this._drawFrame = requestAnimationFrame(() => {
                try {
                    const { x, y } = this._getPos(e)
                    this.#ctx.lineTo(x, y)
                    this.#ctx.stroke()
                    this._drawFrame = null
                } catch (error) {
                    console.error('Drawing error:', error)
                    this._drawFrame = null
                }
            })
        }
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
    try {
        if (this._debounceTimeout) clearTimeout(this._debounceTimeout)

        const saveSignature = () => new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (!blob) reject(new Error("Failed to convert canvas to image"));
                else resolve(blob);
            });
        });

        this._debounceTimeout = setTimeout(async () => {
            try {
                const blob = await saveSignature();
                const file = new File([blob], "signature.png", { type: "image/png" });
                this._updateValidation(file, canvas);
                this._dispatchSignatureReady(file);
            } catch (error) {
                this._handleError(error);
            }
        }, this._debounceDelay);
    } catch (error) {
        this._handleError(error);
    }
}

_handleError(error) {
    console.error('Signature pad error:', error);
    this._internals.setValidity({ customError: true }, error.message);
    this.dispatchEvent(new CustomEvent("signature-error", {
        detail: { error },
        bubbles: true,
        composed: true
    }));
}
  _enableClearIfNotEmpty(canvas) {
    const imgData = this.#ctx.getImageData(0, 0, canvas.width, canvas.height).data

    const isEmpty = !Array.from(imgData).some(channel => channel !== 0)
    this._clearBtn.disabled = isEmpty
    this._clearBtn.setAttribute('aria-disabled', isEmpty ? 'true' : 'false')
  }

  _isMinLength() {
    const imageData = this.#ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const pixels = imageData.data
    
    // Early exit optimization
    let nonEmptyPixelCount = 0
    const targetCount = SignaturePad.MIN_PIXEL_COUNT
    
    for (let i = 3; i < pixels.length; i += 4) { // Start at alpha channel
        if (pixels[i] !== 0) {
            nonEmptyPixelCount++
            if (nonEmptyPixelCount >= targetCount) {
                return false; // Has enough pixels
            }
        }
    }
    
    return true; // Too few pixels
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
            case 'debounce-delay':
                this._debounceDelay = this.debounceDelay
                break
        }
    }

    _isValidSignature() {
        return {
            hasMinPixels: !this._isMinLength(),
            hasMinStrokes: this.#strokeCount >= SignaturePad.MIN_STROKE_COUNT,
            // isWithinBounds: this._isWithinBounds()
        };
    }

    _updateValidation(file = null, canvas = null) {
        // If not required and no file to validate, clear validity
        if (!this.required && !file) {
            this._internals.setValidity({});
            return;
        }

        // Check if required but no file
        if (this.required && !file) {
            this._internals.setFormValue(null);
            this._internals.setValidity(
                { valueMissing: true },
                "Signature is required",
                canvas
            );
            return;
        }

        // Validate signature quality
        const validity = this._isValidSignature();
        if (!validity.hasMinPixels) {
            this._internals.setFormValue(null);
            this._internals.setValidity(
                { customError: true },
                "Signature is too small",
                canvas
            );
        } else if (!validity.hasMinStrokes) {
            this._internals.setFormValue(null);
            this._internals.setValidity(
                { customError: true },
                "Please make at least two strokes",
                canvas
            );
        } else {
            // Signature is valid
            this._internals.setValidity({});
            if (file) {
                this.signatureFile = file;
                this._internals.setFormValue(file);
            }
        }
    }


    _dispatchSignatureReady(file) {
        this.dispatchEvent(new CustomEvent("signature-ready", {
            detail: { file },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('signature-pad', SignaturePad)
