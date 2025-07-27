/**
 * DurationFormat Web Component
 * Automatically formats durations with locale awareness using Intl.DurationFormat (if available)
 * 
 * @customElement duration-format
 * @extends HTMLElement
 * @fires locale-change - When the display locale changes
 * 
 * @property {string} locale - Locale identifier for formatting
 * @property {string} fstyle - Formatting style ('long' | 'short' | 'narrow')
 * @property {number} years - Years in the duration
 * @property {number} months - Months in the duration
 * @property {number} weeks - Weeks in the duration
 * @property {number} days - Days in the duration
 * @property {number} hours - Hours in the duration
 * @property {number} minutes - Minutes in the duration
 * @property {number} seconds - Seconds in the duration
 * @property {number} milliseconds - Milliseconds in the duration
 * @property {number} microseconds - Microseconds in the duration
 * @property {number} nanoseconds - Nanoseconds in the duration
 
 * 
 * @attr {string} fstyle - Formatting style ('long' | 'short' | 'narrow', default: 'short')
 * @attr {number} years
 * @attr {number} months
 * @attr {number} weeks
 * @attr {number} days
 * @attr {number} hours
 * @attr {number} minutes
 * @attr {number} seconds
 * @attr {number} milliseconds
 * @attr {number} microseconds
 * @attr {number} nanoseconds
 * @attr {number} fractionalDigits
 * 
 * @example
 * <duration-format
 *   locale="en-US"
 *   fstyle="long"
 *   years="1"
 *   months="2"
 *   days="3"
 *   hours="4"
 *   minutes="5"
 *   seconds="6"
 *   milliseconds="7">
 * </duration-format>
 */
class DurationFormat extends HTMLElement{
    constructor(){
        super()
    }

    static get observedAttributes() {
        return ['locale', 'fstyle', 'years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds', 'microseconds', 'nanoseconds', 'fractionalDigits']
    }

    get locale() {
        return this.getAttribute('locale') || document.body.getAttribute('data-locale') || 'en-US'
    }

    set locale(value) {
        this.setAttribute('locale', value)
    }

    get fstyle() {
        return this.getAttribute('fstyle') || 'short' // long, short, narrow
    }

    set fstyle(value) {
        const validStyles = ['long', 'short', 'narrow'];
        if (value && !validStyles.includes(value)) {
            console.warn(`Invalid style: ${value}. Using 'short'`);
            value = 'short';
        }
        this.setAttribute('fstyle', value);
    }

    get years() {
        return this.getAttribute('years')
    }

    set years(value) {
        const validated = this._validateDurationUnit(value, 'years');
        this.setAttribute('years', validated);
    }

    get months() {
        return this.getAttribute('months')
    }

    set months(value) {
        const validated = this._validateDurationUnit(value, 'months');
        this.setAttribute('months', validated);
    }

    get weeks() {
        return this.getAttribute('weeks')
    }

    set weeks(value) {
        const validated = this._validateDurationUnit(value, 'weeks');
        this.setAttribute('weeks', validated);
    }

    get days() {
        return this.getAttribute('days')
    }

    set days(value) {
        const validated = this._validateDurationUnit(value, 'days');
        this.setAttribute('days', validated);
    }

    get hours() {
        return this.getAttribute('hours')
    }

    set hours(value) {
        const validated = this._validateDurationUnit(value, 'hours');
        this.setAttribute('hours', validated);
    }

    get minutes() {
        return this.getAttribute('minutes')
    }

    set minutes(value) {
        const validated = this._validateDurationUnit(value, 'minutes');
        this.setAttribute('minutes', validated);
    }

    get seconds() {
        return this.getAttribute('seconds')
    }

    set seconds(value) {
        const validated = this._validateDurationUnit(value, 'seconds');
        this.setAttribute('seconds', validated);
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
        const num = Number(value);
        if (isNaN(num) || num < 0 || num > 20) {
            console.warn(`Invalid fractionalDigits: ${value}. Using default.`);
            this.removeAttribute('fractionalDigits');
            return;
        }
        this.setAttribute('fractionalDigits', value);
    }

    connectedCallback() {
        requestAnimationFrame(() => {
            this._initIntlNF()
            this._format()
        })

        // listen to language select change event
        window.addEventListener('locale-change', this._onLocaleChange)
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

    _onLocaleChange = (e) => {
        this.locale = e.detail.locale;
    };

    _format(){
        const duration = {
            years: Number(this.years) || 0,
            months: Number(this.months) || 0,
            weeks: Number(this.weeks) || 0,
            days: Number(this.days) || 0,
            hours: Number(this.hours) || 0,
            minutes: Number(this.minutes) || 0,
            seconds: Number(this.seconds) || 0,
            milliseconds: Number(this.milliseconds) || 0,
            microseconds: Number(this.microseconds) || 0,
            nanoseconds: Number(this.nanoseconds) || 0
        }

        const formatted = this._formatter.format(duration)

        this.innerText = formatted
        this.setAttribute('aria-label', formatted)
        this.setAttribute('title', formatted)
    }

    _createFallbackFormatter() {
        return {
            format: (duration) => {
                const parts = [];
                const style = this.fstyle;
                
                // Style-aware formatting
                const formats = {
                    long: { y: ' years', mo: ' months', d: ' days', h: ' hours', m: ' minutes', s: ' seconds' },
                    short: { y: 'y', mo: 'mo', d: 'd', h: 'h', m: 'm', s: 's' },
                    narrow: { y: 'Y', mo: 'M', d: 'D', h: 'H', m: 'm', s: 's' }
                };
                
                const units = formats[style] || formats.short;
                
                if (duration.years) parts.push(`${duration.years}${units.y}`);
                if (duration.months) parts.push(`${duration.months}${units.mo}`);
                if (duration.days) parts.push(`${duration.days}${units.d}`);
                if (duration.hours) parts.push(`${duration.hours}${units.h}`);
                if (duration.minutes) parts.push(`${duration.minutes}${units.m}`);
                if (duration.seconds) parts.push(`${duration.seconds}${units.s}`);
                
                return parts.join(style === 'long' ? ', ' : ' ') || '0' + units.s;
            }
        };
    }

    _initIntlNF() {
        try {
            this._formatter = new Intl.DurationFormat(this.locale, { style: this.fstyle });
        } catch (error) {
            console.warn('Failed to create Intl.DurationFormat, falling back to custom formatter:', error);
            this._formatter = this._createFallbackFormatter();
        }
    }

    // Create a helper method for duration unit validation
    _validateDurationUnit(value, unit) {
        const num = Number(value);
        if (isNaN(num)) {
            console.warn(`Invalid ${unit}: ${value}. Using 0.`);
            return 0;
        }
        return num;
    }
}

customElements.define('duration-format', DurationFormat)