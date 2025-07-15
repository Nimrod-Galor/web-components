class SignaturePad extends HTMLElement {
    static formAssociated = true; // enable form association
    

    constructor() {
        super();
    }

    checkValidity() {
        return this._internals.checkValidity();
    }

    reportValidity() {
        return this._internals.reportValidity();
    }

    get required() {
        return this.hasAttribute('required');
    }

    focus() {
    // const canvas = this.shadowRoot.querySelector("canvas");
    // canvas?.focus();
        this.canvas?.focus()
    }

    connectedCallback() {
        this._internals = this.attachInternals(); // required to interact with forms
        this.tabIndex = 0

        // Create a shadow root
        const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });

        // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            canvas { border: 1px solid #ccc; touch-action: none; display: block; }
            button { margin-top: 8px; display: flex; gap: 8px; }
            button:disabled { opacity: 0.4; cursor: not-allowed; }
        `)

        shadow.adoptedStyleSheets = [sheet];

        this._debounceTimeout = null;
        this._debounceDelay = 500;


        this.canvas = document.createElement('canvas');
        this.canvas.tabIndex = "0"
        const ctx = this.canvas.getContext('2d');
        shadow.appendChild(this.canvas)


        // this._fileInput = document.createElement('input');
        // this._fileInput.type = 'file'
        // this._fileInput.hidden = true
        // shadow.appendChild(this._fileInput)

        this._clearBtn = document.createElement('button')
        this._clearBtn.innerText = 'Clear'
        shadow.appendChild(this._clearBtn)

        let drawing = false;

        // handel validation
        if (this.required) {
            this._internals.setValidity({ valueMissing: true }, "Signature is required", this.canvas);
        }

        this._clearBtn.disabled = true;


        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const start = (e) => {
            drawing = true;
            const { x, y } = getPos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
        };

        const move = (e) => {
            if (!drawing){
                return;
            }
            const { x, y } = getPos(e);
            ctx.lineTo(x, y);
            ctx.stroke();
        };

        const stop = () => {
            if (!drawing){
                return;
            }
            drawing = false;
            this._enableClearIfNotEmpty(this.canvas);
            this._debounceSave(this.canvas);
        };

        const clearCanvas = () => {
            if (window.confirm("Are you sure you want to clear the signature?")) {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                // this._fileInput.value = '';
                this.signatureFile = null;

                // update input
                this._internals.setFormValue(null);

                // handel validation
                if (this.required) {
                    this._internals.setValidity({ valueMissing: true }, "Signature is required", this.canvas);
                }

                this._clearBtn.disabled = true;

                this.dispatchEvent(new CustomEvent("signature-cleared", {
                    bubbles: true,
                    composed: true
                }));
            }
        };

        this._clearBtn.addEventListener('click', clearCanvas);

        this.canvas.addEventListener('mousedown', start);
        this.canvas.addEventListener('mousemove', move);
        this.canvas.addEventListener('mouseup', stop);
        this.canvas.addEventListener('mouseout', stop);

        this.canvas.addEventListener('touchstart', e => start(e.touches[0]));
        this.canvas.addEventListener('touchmove', e => {
            move(e.touches[0]);
            e.preventDefault();
        });
        this.canvas.addEventListener('touchend', stop);
  }

  _debounceSave(canvas) {
    if (this._debounceTimeout) clearTimeout(this._debounceTimeout);

    this._debounceTimeout = setTimeout(() => {
      canvas.toBlob(blob => {
        const file = new File([blob], "signature.png", { type: "image/png" });

        // handel input validation
        if (this.required && !file) {
            this._internals.setFormValue(null);
            this._internals.setValidity({ valueMissing: true }, "Signature is required", canvas);
        } else if(this.required && this._isMinLength()){
            this._internals.setFormValue(null);
            this._internals.setValidity({ customError: true }, "Signature is too small. Please try again.", canvas);
        } else {
            this._internals.setValidity({});
        }

        this.signatureFile = file;

        //set file as form value
        this._internals.setFormValue(file);

        this.dispatchEvent(new CustomEvent("signature-ready", {
          detail: { file },
          bubbles: true,
          composed: true
        }));
      });
    }, this._debounceDelay);
  }

  _enableClearIfNotEmpty(canvas) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    const isEmpty = !Array.from(imgData).some(channel => channel !== 0);
    this._clearBtn.disabled = isEmpty;
  }

  _isMinLength(){
    const MIN_PIXEL_COUNT = 350
    const ctx = this.canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;

    let nonEmptyPixelCount = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3]; // 0 = transparent
        if (alpha !== 0){
            nonEmptyPixelCount++;
        }
    }
console.log('nonEmptyPixelCount', nonEmptyPixelCount)
    return nonEmptyPixelCount < MIN_PIXEL_COUNT;
  }
}

customElements.define('signature-pad', SignaturePad);
