/**
 * DateFormat Web Component
 * Automatically formats dates with locale awareness and time zone support
 * 
 * @customElement date-format
 * @extends HTMLElement
 * @fires locale-change - When the display locale changes
 * 
 * @property {string} value - The date value to format (timestamp or date string)
 * @property {string} locale - Locale identifier for formatting
 * @property {string} dateStyle - Date formatting style (full|long|medium|short)
 * @property {string} timeStyle - Time formatting style (full|long|medium|short)
 * @property {string} timeZone - IANA time zone identifier
 * 
 * @attr {string} value - Date value to format
 * @attr {string} locale - Locale identifier (default: from CSS --locale or 'en-US')
 * @attr {string} date-style - Date formatting style
 * @attr {string} time-style - Time formatting style
 * @attr {string} time-zone - Time zone identifier
 * 
 * @example
 * <date-format 
 *   value="2023-12-25T15:00:00" 
 *   locale="en-US" 
 *   date-style="full" 
 *   time-style="short"
 *   time-zone="America/New_York">
 * </date-format>
 */
class DurationFormat extends HTMLElement{
    constructor(){
        super()
    }

    static get observedAttributes() {
        return ['locale', 'fstyle', 'years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds', 'microseconds', 'nanoseconds', 'fractionalDigits']
    }

    get locale() {
        return this.getAttribute('locale')|| getComputedStyle(document.body).getPropertyValue('--locale').trim() || 'en-US'
    }

    set locale(value) {
        this.setAttribute('locale', value)
    }

    get fstyle() {
        return this.getAttribute('fstyle') || 'short' // long, short, narrow
    }

    set fstyle(value) {
        this.setAttribute('fstyle', value)
    }

    get years() {
        return this.getAttribute('years')
    }

    set years(value) {
        this.setAttribute('years', value)
    }

    get months() {
        return this.getAttribute('months')
    }

    set months(value) {
        this.setAttribute('months', value)
    }

    get weeks() {
        return this.getAttribute('weeks')
    }

    set weeks(value) {
        this.setAttribute('weeks', value)
    }

    get days() {
        return this.getAttribute('days')
    }

    set days(value) {
        this.setAttribute('days', value)
    }

    get hours() {
        return this.getAttribute('hours')
    }

    set hours(value) {
        this.setAttribute('hours', value)
    }

    get minutes() {
        return this.getAttribute('minutes')
    }

    set minutes(value) {
        this.setAttribute('minutes', value)
    }

    get seconds() {
        return this.getAttribute('seconds')
    }

    set seconds(value) {
        this.setAttribute('seconds', value)
    }

    get milliseconds() {
        return this.getAttribute('milliseconds')
    }

    set milliseconds(value) {
        this.setAttribute('milliseconds', value)
    }

    get microseconds() {
        return this.getAttribute('microseconds')
    }

    set microseconds(value) {
        this.setAttribute('microseconds', value)
    }

    get nanoseconds() {
        return this.getAttribute('nanoseconds')
    }

    set nanoseconds(value) {
        this.setAttribute('nanoseconds', value)
    }

    get fractionalDigits() {
        return this.getAttribute('fractionalDigits')
    }

    set fractionalDigits(value) {
        this.setAttribute('fractionalDigits', value)
    }

    connectedCallback() {
        requestAnimationFrame(() => {
            this._initIntlNF()
            this._format()
        })

        // listen to language select change event
        window.addEventListener('locale-change', (e) => {
            this.locale = e.detail.locale
        })
    }

    disconnectedCallback() {
        window.removeEventListener('locale-change', this._onLocaleChange)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(oldValue !== newValue){
            if(name ==='locale'){
                this.locale = newValue
                this._initIntlNF()
            }else if(name === 'fstyle'){
                this.fstyle = newValue
                this._initIntlNF()
            }
            
            requestAnimationFrame(() => this._format())
        }
    }

    _format(){
        const duration = {
            years: this.years,
            months: this.months,
            weeks: this.weeks,
            days: this.days,
            hours: this.hours,
            minutes: this.minutes,
            seconds: this.seconds,
            milliseconds: this.milliseconds,
            microseconds: this.microseconds,
            nanoseconds: this.nanoseconds,
            fractionalDigits: this.fractionalDigits
        }

        const formatted = this._formatter.format(duration)

        this.innerText = formatted
        this.setAttribute('aria-label', formatted)
        this.setAttribute('title', formatted)
    }

    _initIntlNF(){
        this._formatter = new Intl.DurationFormat(this.locale, { style: this.fstyle })
    }
}

customElements.define('duration-format', DurationFormat)