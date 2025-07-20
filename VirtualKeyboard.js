/**
 * VirtualKeyboard Web Component
 * Creates an on-screen keyboard with multi-language support and physical keyboard sync
 * 
 * @customElement virtual-keyboard
 * @extends HTMLElement
 * @csspart keyboard - The keyboard container
 * @csspart lang-switcher - The language selection dropdown
 * @csspart keys - The keys container
 * 
 * @property {string} language - Current keyboard language (en|fr|de|he|ar)
 * @property {string} target - ID of input/textarea to receive keyboard input
 * @property {boolean} langSwitcher - Whether to show language switcher
 * @property {boolean} shift - Current shift key state
 * @property {boolean} caps - Current caps lock state
 * @property {Object.<string, Array>} customLayouts - Custom keyboard layouts
 * 
 * @attr {string} language - Keyboard language code (default: 'en')
 * @attr {string} target - Target input element ID
 * @attr {boolean} langswitcher - Show/hide language switcher
 * 
 * @fires input - When a key is pressed with character and current value
 * @fires change - When input value changes
 * @fires error - When character insertion fails
 * 
 * @cssprop --key-bg-color - Key background color (default: #f7f7f7)
 * @cssprop --key-border-color - Key border color (default: #ccc)
 * @cssprop --key-text-color - Key text color (default: inherit)
 * @cssprop --key-hover-bg - Key hover background (default: #e6e6e6)
 * @cssprop --key-active-bg - Key active background (default: #add8e6)
 * 
 * @example
 * <!-- Basic usage -->
 * <virtual-keyboard target="input1"></virtual-keyboard>
 * 
 * <!-- With language switcher -->
 * <virtual-keyboard 
 *   target="input1" 
 *   language="fr" 
 *   langswitcher>
 * </virtual-keyboard>
 */
class VirtualKeyboard extends HTMLElement {
    constructor() {
        super()
    }

    static get observedAttributes() {
        return ['language', 'target', 'langswitcher']
    }

    get language() {
        return this.getAttribute('language') || 'en'
    }

    set language(value) {
        this.setAttribute('language', value)
    }

    get target() {
        return this.getAttribute('target') || null
    }

    set target(value) {
        this.setAttribute('target', value)
    }

    get langSwitcher() {
        return this.hasAttribute('langswitcher') && this.getAttribute('langswitcher') !== 'false'
    }

    set langSwitcher(value) {
        this.setAttribute('langswitcher', value)
    }

    get targetElement() {
        return this._targetElement || null
    }

    set targetElement(el) {
        if (el && el instanceof HTMLElement) {
            this._targetElement = el
        }
    }

    get shift() {
        return this._shift || false
    }
    
    set shift(value) {
        this._shift = Boolean(value)
    }

    get caps() {
        return this._caps || false
    }

    set caps(value) {
        this._caps = Boolean(value)
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' })
        this._resolveTarget()
        
        this.shadowRoot.addEventListener('click', this._virtualKeyClick.bind(this))

        document.addEventListener('keydown', this._onPhysicalKey)
        document.addEventListener('keyup', this._onKeyUp)

        this._render()
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this._onPhysicalKey)
        document.removeEventListener('keyup', this._onKeyUp)
        this.shadowRoot.removeEventListener('click', this._virtualKeyClick.bind(this))
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'target') {
            this.targetId = newVal
            this._resolveTarget()
        } 
        if(oldVal && oldVal != newVal) {
            if (name === 'langswitcher') {
                this._render()
            }
        }
    }

    _virtualKeyClick(e) {
        if (e.target.tagName === 'BUTTON') {
            const key = e.target.dataset.key
            this._handleVirtualKey(key)
        }
    }
    
    _onPhysicalKey = (e) => {
        // Only intercept if the target element is focused
        if (document.activeElement !== this.targetElement) {
            return
        }
        
        const code = e.code
        const layout = this.shift
        ? this.#shiftedCodeToCharMap[this.language] || this.#shiftedCodeToCharMap.en
        : this.#codeToCharMap[this.language] || this.#codeToCharMap.en
        const key = layout[code]

        if (key) {
            e.preventDefault()
            this._handleVirtualKey(key)
            this._highlightVirtualKey(key)
        }
    }

    _onKeyUp = (e) => {
        if (e.key.toLowerCase() === 'shift') {
            this.shift = false
            this._render()
        }
    }

    _resolveTarget() {
        if (this.targetId) {
            this.targetElement = document.getElementById(this.targetId)
            if (!this.targetElement ||  !['INPUT', 'TEXTAREA'].includes(this.targetElement.tagName)) {
                    console.warn('Virtual keyboard target must be an input or textarea')
            }
        }
    }

    _flattenLayoutMap() {
        const layouts = this.customLayouts || this.#baseLayouts
        const layout = layouts[this.language] || layouts.en
        const map = {}
        for (const row of layout) {
            for (const key of row) {
                if (typeof key === 'string') {
                    map[key.toLowerCase()] = key
                } else if (key.key) {
                    map[key.key.toLowerCase()] = key.key
                }
            }
        }
        return map
    }

    _handleVirtualKey(keyName) {
        if (typeof keyName !== 'string') {
            console.warn('Invalid key name:', keyName);
            return
        }
        if (keyName === 'Shift') {
            this.shift = !this.shift
            this._render()
            return
        }
        if (keyName === 'Caps') {
            this.caps = !this.caps
            this._render()
            return
        }
        if (!this.targetElement){
            this._resolveTarget()
        }
        if (!this.targetElement){
            return
        }

        const char = this._getShiftedChar(keyName)

        this._insertAtCursor(char)
        
        this.dispatchEvent(new CustomEvent('input', { 
            detail: { char, value: this.targetElement.value } 
        }))
        this.dispatchEvent(new CustomEvent('change', { 
            detail: { value: this.targetElement.value } 
        }))

        if (this.shift && keyName !== 'Shift') {
            this.shift = false
            this._render()
        }
    }

    _getShiftedChar(key) {
        if (!key){
            return ''
        }

        if (key === 'Space'){
            return ' '
        }
        if (key === 'Backspace'){
            return 'Backspace'
        }
        if (key === 'Enter'){
            return '\n'
        }

        const shiftMap = this.#shiftOverridesMap[this.language] || {}
        const isAlpha = /^[a-zא-תء-ي]$/i.test(key)

        if (this.shift) {
            if (shiftMap[key]){
                return shiftMap[key]
            }
            if (isAlpha){
                return this._transformCase(key, true)
            }
        }

        return this._transformCase(key, false)
    }

    _transformCase(char, forShift = false) {
        if (!char){
            return ''
        }
        if (!/^[a-zא-תء-ي]$/i.test(char)){
            return char
        }

        const upper = this.caps !== forShift
        return upper ? char.toUpperCase() : char.toLowerCase()
    }

    _insertAtCursor(char) {
        const el = this.targetElement
        if (!el || !el.focus){
            return
        }
        el.focus()
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })

        try{
            const start = el.selectionStart
            const end = el.selectionEnd
            const value = el.value

            if (char === 'Backspace') {
                if (start === end && start > 0) {
                    el.value = value.slice(0, start - 1) + value.slice(end)
                    el.setSelectionRange(start - 1, start - 1)
                } else {
                    el.value = value.slice(0, start) + value.slice(end)
                    el.setSelectionRange(start, start)
                }
            } else {
                el.value = value.slice(0, start) + char + value.slice(end)
                el.setSelectionRange(start + char.length, start + char.length)
            }
        } catch (error) {
            console.error('Error inserting character:', error)
            this.dispatchEvent(new CustomEvent('error', { 
                detail: { message: 'Failed to insert character' } 
            }))
        }
    }

    _highlightVirtualKey(char) {
        const btns = this.shadowRoot.querySelectorAll('button')
        for (const btn of btns) {
            if (btn.textContent.toLowerCase() === char.toLowerCase()) {
                btn.classList.add('active')
                setTimeout(() => btn.classList.remove('active'), 150)
                break
            }
        }
    }

    _handleLanguageChange(lang) {
        if (!lang || !(this.#baseLayouts[lang] || (this.customLayouts && this.customLayouts[lang]))){
            return
        }
        this.shift = false
        this.caps = false
        this.language = lang
        const dir = ['he', 'ar'].includes(lang) ? 'rtl' : 'ltr'
        // update target element direction if it exists
        if(this.targetElement){
            this.targetElement.style.direction = dir
        }

        this._render()
    }

    _getLabelForKey(key) {
        // Define default display values for control keys
        const specialLabels = {
            Enter: '⏎',
            Backspace: '⌫',
            Shift: '⇧',
            Caps: '⇪',
            Space: '␣'
        };

        // Return display override or character value
        return specialLabels[key] ?? this._getShiftedChar(key);
    }


    _render() {
        const layouts = this.customLayouts || this.#baseLayouts
        const layout = layouts[this.language] || layouts.en

        const style = `
            :host {
                display: inline-block;
                font-family: sans-serif;
                user-select: none;
                /* direction: ${['he', 'ar'].includes(this.language) ? 'rtl' : 'ltr'}; */
                width: 100%;
                max-width: 600px;
            }
            .row {
                display: flex;
                justify-content: center;
                flex-wrap: nowrap;
                margin: 5px 0;
            }
            button {
                margin: 3px;
                flex: 1 1 auto;
                padding: 16px 0;
                font-size: 1.2rem;
                cursor: pointer;
                border: 1px solid #ccc;
                border-radius: 10px;
                background: #f7f7f7;
                min-width: 40px;
                max-width: 60px;
                transition: background 0.1s ease;
                user-select: none;
                -webkit-user-select: none;
            }
            button.active {
                background: #add8e6;
            }
            button[data-key="Space"] {
                max-width: 100%;
            }
            button[data-key="Backspace"] {
                max-width: fit-content;
                padding: 0 16px;
            }
            button[data-key="Enter"] {
                min-width: 80px;
                font-weight: bold;
            }
            select {
                z-index: 1000;
                margin-bottom: 10px;
                font-size: 1rem;
                padding: 4px 8px;
            }
        `

        let langSwitcherHTML = ''
        if (this.langSwitcher) {
            // Build options for languages available in layouts
            const langs = Object.keys(layouts)
            const options = langs.map(l => `<option value="${l}" ${l === this.language ? 'selected' : ''}>${l.toUpperCase()}</option>`).join('')
            langSwitcherHTML = `
                <select id="lang-switcher" aria-label="Select keyboard language" part="lang-switcher" role="combobox">
                    ${options}
                </select>
            `
        }

        const keyboardHTML = layout.map(row => `
                <div class="row">
                    ${row.map(k => {
                        const key = typeof k === 'string' ? k : k.key
                        return `<button aria-label="${key}" data-key="${key}">${this._getLabelForKey(key)}</button>`
                    }).join('')}
                </div>
            `).join('')

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="keyboard" role="application" aria-label="Virtual Keyboard">
                ${langSwitcherHTML}
                <div class="keys" role="group" aria-label="Keyboard keys">
                    ${keyboardHTML}
                </div>
            </div>
        `
        // Add event listener for language switcher if it exists
        this.shadowRoot.querySelector('#lang-switcher')?.addEventListener('change', (e) => {
            this._handleLanguageChange(e.target.value)
        })
    }

    #baseLayouts = {
        en: [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['q','w','e','r','t','y','u','i','o','p', '[', ']'],
            ['a','s','d','f','g','h','j','k','l', ';', '\'', 'Enter'],
            ['z','x','c','v','b','n','m', ',','.','/'],
            ['Shift','Caps','Space','Backspace']
        ],
        fr: [ // AZERTY
            ['&','é','"',"'",'(','-','è','_','ç','à'],
            ['a','z','e','r','t','y','u','i','o','p', 'm'],
            ['q','s','d','f','g','h','j','k','l','m', 'ù', 'Enter'],
            ['w','x','c','v','b','n','m', ',', '.', '!'],
            ['Shift','Caps','Space','Backspace']
        ],
        de: [ // QWERTZ
            ['1','2','3','4','5','6','7','8','9','0'],
            ['q','w','e','r','t','z','u','i','o','p','ü'],
            ['a','s','d','f','g','h','j','k','l','ö','ä', 'Enter'],
            ['y','x','c','v','b','n','m', ',', '.','-'],
            ['Shift','Caps','Space','Backspace']
        ],
        he: [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['/','\'','ק','ר','א','ט','ו','ן','ם','פ', '[', ']', '\\'],
            ['ש','ד','ג','כ','ע','י','ח','ל','ך', 'ף', ',', 'Enter'],
            ['ז','ס','ב','ה','נ','מ','צ','ת','ץ', '/'],
            ['Shift','Caps','Space','Backspace']
        ],
        ar: [
            ['ض','ص','ث','ق','ف','غ','ع','ه','خ','ح', 'ج','د'],
            ['ش','س','ي','ب','ل','ا','ت','ن','م','ك', 'ط', 'Enter'],
            ['ئ','ء','ؤ','ر','لا','ى','ة','و','ز','ظ', '.','ذ'],
            ['Shift','Caps','Space','Backspace']
        ]
    }

    #shiftOverridesMap = {
        en: {
            '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
            '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
            '`': '~', '-': '_', '=': '+',
            '[': '{', ']': '}', '\\': '|',
            '': ':', '\'': '"',
            ',': '<', '.': '>', '/': '?'
        },
        fr: {
            '&': '1', 'é': '2', '"': '3', '\'': '4', '(': '5',
            '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0',
            ')': '°', '=': '+'
        },
        de: {
            '1': '!', '2': '"', '3': '§', '4': '$', '5': '%',
            '6': '&', '7': '/', '8': '(', '9': ')', '0': '=',
            'ß': '?', '´': '`', '+': '*', ',': '', '.': ':', '-': '_'
        },
        he: {},
        ar: {}
    }

    #codeToCharMap = {
        en: {
            Backquote: '`',
            Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
            Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
            Minus: '-', Equal: '=',

            KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r', KeyT: 't',
            KeyY: 'y', KeyU: 'u', KeyI: 'i', KeyO: 'o', KeyP: 'p',
            BracketLeft: '[', BracketRight: ']', Backslash: '\\',

            KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g',
            KeyH: 'h', KeyJ: 'j', KeyK: 'k', KeyL: 'l',
            Semicolon: ';', Quote: "'",

            KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b',
            KeyN: 'n', KeyM: 'm',
            Comma: ',', Period: '.', Slash: '/',

            Space: 'Space',
            Backspace: 'Backspace',
            ShiftLeft: 'Shift',
            ShiftRight: 'Shift',
            CapsLock: 'Caps',
            Enter: 'Enter'
        },
        he: {
            Backquote: ';',
            Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
            Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
            Minus: '-', Equal: '=',

            KeyQ: '/', KeyW: '\'', KeyE: 'ק', KeyR: 'ר', KeyT: 'א',
            KeyY: 'ט', KeyU: 'ו', KeyI: 'ן', KeyO: 'ם', KeyP: 'פ',
            BracketLeft: ']', BracketRight: '[', Backslash: '\\',

            KeyA: 'ש', KeyS: 'ד', KeyD: 'ג', KeyF: 'כ', KeyG: 'ע',
            KeyH: 'י', KeyJ: 'ח', KeyK: 'ל', KeyL: 'ך',
            Semicolon: 'ף', Quote: '\\',

            KeyZ: 'ז', KeyX: 'ס', KeyC: 'ב', KeyV: 'ה', KeyB: 'נ',
            KeyN: 'מ', KeyM: 'צ',
            Comma: 'ת', Period: 'ץ', Slash: '.', // note: period is hebrew final tzadi

            Space: 'Space',
            Backspace: 'Backspace',
            ShiftLeft: 'Shift',
            ShiftRight: 'Shift',
            CapsLock: 'Caps',
            Enter: 'Enter'
        },
        fr : {
            Backquote: '²',
            Digit1: '&', Digit2: 'é', Digit3: '"', Digit4: "'", Digit5: '(',
            Digit6: '-', Digit7: 'è', Digit8: '_', Digit9: 'ç', Digit0: 'à',
            Minus: ')', Equal: '=',

            KeyA: 'q', KeyZ: 'w', KeyE: 'e', KeyR: 'r', KeyT: 't',
            KeyY: 'y', KeyU: 'u', KeyI: 'i', KeyO: 'o', KeyP: 'p',
            BracketLeft: '^', BracketRight: '$', Backslash: '*',

            KeyQ: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g',
            KeyH: 'h', KeyJ: 'j', KeyK: 'k', KeyL: 'l', Semicolon: 'm', Quote: 'ù',

            KeyW: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b',
            KeyN: 'n', KeyM: ',', Comma: ';', Period: ':', Slash: '!',

            Space: 'Space',
            Backspace: 'Backspace',
            ShiftLeft: 'Shift',
            ShiftRight: 'Shift',
            CapsLock: 'Caps',
            Enter: 'Enter'
        },
        de : {
            Backquote: '^',
            Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
            Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
            Minus: 'ß', Equal: '´',

            KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r', KeyT: 't',
            KeyY: 'z', KeyU: 'u', KeyI: 'i', KeyO: 'o', KeyP: 'p',
            BracketLeft: 'ü', BracketRight: '+', Backslash: '#',

            KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g',
            KeyH: 'h', KeyJ: 'j', KeyK: 'k', KeyL: 'l',
            Semicolon: 'ö', Quote: 'ä',

            KeyZ: 'y', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b',
            KeyN: 'n', KeyM: 'm', Comma: ',', Period: '.', Slash: '-',

            Space: 'Space',
            Backspace: 'Backspace',
            ShiftLeft: 'Shift',
            ShiftRight: 'Shift',
            CapsLock: 'Caps',
            Enter: 'Enter'
        },
        ar : {
            Backquote: 'ذ',
            Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
            Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
            Minus: '-', Equal: '=',

            KeyQ: 'ض', KeyW: 'ص', KeyE: 'ث', KeyR: 'ق', KeyT: 'ف',
            KeyY: 'غ', KeyU: 'ع', KeyI: 'ه', KeyO: 'خ', KeyP: 'ح',
            BracketLeft: 'ج', BracketRight: 'د', Backslash: '\\',

            KeyA: 'ش', KeyS: 'س', KeyD: 'ي', KeyF: 'ب', KeyG: 'ل',
            KeyH: 'ا', KeyJ: 'ت', KeyK: 'ن', KeyL: 'م',
            Semicolon: 'ك', Quote: 'ط',

            KeyZ: 'ئ', KeyX: 'ء', KeyC: 'ؤ', KeyV: 'ر', KeyB: 'ﻻ',
            KeyN: 'ى', KeyM: 'ة', Comma: 'و', Period: 'ز', Slash: 'ظ',

            Space: 'Space',
            Backspace: 'Backspace',
            ShiftLeft: 'Shift',
            ShiftRight: 'Shift',
            CapsLock: 'Caps',
            Enter: 'Enter'
        }
    }

    #shiftedCodeToCharMap = {
        en: {
            Backquote: '~',
            Digit1: '!', Digit2: '@', Digit3: '#', Digit4: '$', Digit5: '%',
            Digit6: '^', Digit7: '&', Digit8: '*', Digit9: '(', Digit0: ')',
            Minus: '_', Equal: '+',

            KeyQ: 'Q', KeyW: 'W', KeyE: 'E', KeyR: 'R', KeyT: 'T',
            KeyY: 'Y', KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P',
            BracketLeft: '{', BracketRight: '}', Backslash: '|',

            KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G',
            KeyH: 'H', KeyJ: 'J', KeyK: 'K', KeyL: 'L',
            Semicolon: ':', Quote: '"',

            KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B',
            KeyN: 'N', KeyM: 'M',
            Comma: '<', Period: '>', Slash: '?',

            Space: ' ',
            Backspace: 'Backspace',
            ShiftLeft: 'Shift',
            ShiftRight: 'Shift',
            CapsLock: 'Caps',
            Enter: 'Enter'
        },
        he : {
            ...this.#codeToCharMap.he,
            Digit1: '!', Digit2: '@', Digit3: '#', Digit4: '$', Digit5: '%',
            Digit6: '^', Digit7: '&', Digit8: '*', Digit9: '(', Digit0: ')'
        },
        fr : {
            Backquote: '',
            Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
            Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
            Minus: '°', Equal: '+',

            KeyA: 'Q', KeyZ: 'W', KeyE: 'E', KeyR: 'R', KeyT: 'T',
            KeyY: 'Y', KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P',
            BracketLeft: '¨', BracketRight: '£', Backslash: 'µ',

            KeyQ: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G',
            KeyH: 'H', KeyJ: 'J', KeyK: 'K', KeyL: 'L',
            Semicolon: 'M', Quote: '%',

            KeyW: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B',
            KeyN: 'N', KeyM: '?',
            Comma: '.', Period: '/', Slash: '§',

            Space: ' ',
            Backspace: 'Backspace',
            ShiftLeft: 'Shift',
            ShiftRight: 'Shift',
            CapsLock: 'Caps',
            Enter: 'Enter'
        },
        de : {
            Backquote: '°',
            Digit1: '!', Digit2: '"', Digit3: '§', Digit4: '$', Digit5: '%',
            Digit6: '&', Digit7: '/', Digit8: '(', Digit9: ')', Digit0: '=',
            Minus: '?', Equal: '`',

            KeyQ: 'Q', KeyW: 'W', KeyE: 'E', KeyR: 'R', KeyT: 'T',
            KeyY: 'Z', KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P',
            BracketLeft: 'Ü', BracketRight: '*', Backslash: "'",

            KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G',
            KeyH: 'H', KeyJ: 'J', KeyK: 'K', KeyL: 'L',
            Semicolon: 'Ö', Quote: 'Ä',

            KeyZ: 'Y', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B',
            KeyN: 'N', KeyM: 'M',
            Comma: ';', Period: ':', Slash: '_',

            Space: ' ',
            Backspace: 'Backspace',
            ShiftLeft: 'Shift',
            ShiftRight: 'Shift',
            CapsLock: 'Caps',
            Enter: 'Enter'
        },
        ar : {
            ...this.#codeToCharMap.ar,
            Digit1: '!', Digit2: '@', Digit3: '#', Digit4: '$', Digit5: '%',
            Digit6: '^', Digit7: '&', Digit8: '*', Digit9: '(', Digit0: ')'
        }
    }
}

customElements.define('virtual-keyboard', VirtualKeyboard)
