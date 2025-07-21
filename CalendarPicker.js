/**
 * CalendarPicker web component
 * 
 * CSS Custom Properties for Theming:
 * 
 * Layout & Sizing:
 * --calendar-font-family: Font family for the calendar (default: sans-serif)
 * --calendar-min-width: Minimum width when resizing (default: 280px)
 * --calendar-max-width: Maximum width when resizing (default: 600px)
 * --calendar-min-height: Minimum height when resizing (default: 300px)
 * --calendar-max-height: Maximum height when resizing (default: 500px)
 * 
 * Calendar Container:
 * --calendar-bg: Background color of the calendar (default: white)
 * --calendar-border-color: Border color of the calendar (default: #ccc)
 * --calendar-shadow: Box shadow for calendar (default: 0 0 4px rgba(0,0,0,0.1))
 * 
 * Header:
 * --calendar-header-bg: Background color for header (default: transparent)
 * --calendar-header-color: Text color for header (default: inherit)
 * 
 * Day Cells:
 * --calendar-day-radius: Border radius for day cells (default: 4px)
 * --calendar-hover-bg: Background color for hovered day (default: #eee)
 * --calendar-selected-bg: Background color for selected day (default: #007bff)
 * --calendar-selected-color: Text color for selected day (default: white)
 * --calendar-today-border: Border color for today (default: #007bff)
 * 
 * Week Numbers:
 * --calendar-week-bg: Background color for week numbers (default: #f5f5f5)
 * --calendar-week-color: Text color for week numbers (default: #333)
 * 
 * Other Month Days:
 * --calendar-other-month-opacity: Opacity for other month days (default: 0.3)
 * --calendar-other-month-color: Text color for other month days (default: #999)
 * --calendar-other-month-hover-bg: Hover background for other month days (default: #f0f0f0)
 * 
 * @example Basic usage:
 * <calendar-picker></calendar-picker>
 * 
 * @example With custom styling:
 * <calendar-picker style="
 *   --calendar-bg: #f9f9f9;
 *   --calendar-selected-bg: #28a745;
 *   --calendar-selected-color: #fff;
 *   --calendar-hover-bg: #e0e0e0;
 *   --calendar-min-width: 320px;
 *   --calendar-max-width: 800px;
 * "></calendar-picker>
 * 
 * @example With attributes:
 * <calendar-picker 
 *   value="2024-12-25" 
 *   locale="en-US"
 *   min="2024-01-01"
 *   max="2024-12-31">
 * </calendar-picker>
 */
class CalendarPicker extends HTMLElement {
    static formAssociated = true;

    constructor() {
        super();
    }

    // Cache DOM references
    #elements = {
        container: null,
        header: null,
        monthSelect: null,
        yearSelect: null,
        dayNames: null,
        daysGrid: null
    };

    connectedCallback() {
        this._internals = this.attachInternals();
        this.attachShadow({ mode: 'open' });

        this.current = new Date();
        // Support initial selected date via attribute or property, default to today
        const initial = this.getAttribute('value') || this.selected?.toISOString?.().split('T')[0];
        if (initial) {
            this.selected = new Date(initial);
        } else {
            this.selected = new Date();
        }
        this.locale = this.getAttribute('locale') || navigator.language;

        this.styles = new CSSStyleSheet();
        this.styles.replaceSync(`
        :host {
            display: inline-block;
            font-family: var(--calendar-font-family, sans-serif);
            resize: both;
            overflow: auto;
            min-width: var(--calendar-min-width, 280px);
            max-width: var(--calendar-max-width, 600px);
            min-height: var(--calendar-min-height, 300px);
            max-height: var(--calendar-max-height, 500px);
        }

        .calendar {
            width: 100%;
            height: 100%;
            min-width: 280px;
            border: 1px solid var(--calendar-border-color, #ccc);
            padding: 0.5em;
            box-shadow: var(--calendar-shadow, 0 0 4px rgba(0,0,0,0.1));
            background: var(--calendar-bg, white);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5em;
            background: var(--calendar-header-bg, transparent);
            color: var(--calendar-header-color, inherit);
            flex-shrink: 0;
        }

        select, button {
            font-size: clamp(0.8em, 2vw, 1em);
            padding: 0.25em;
        }

        .day-names, .days {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            text-align: center;
            gap: 1px;
        }

        .day-names {
            flex-shrink: 0;
            margin-bottom: 0.25em;
        }

        .day-names div {
            font-weight: bold;
            padding: 0.25em 0;
            font-size: clamp(0.7em, 1.5vw, 0.9em);
        }

        .days {
            flex: 1;
            align-content: start;
        }

        .day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: var(--calendar-day-radius, 4px);
            transition: background 0.3s;
            font-size: clamp(0.7em, 1.5vw, 1em);
            min-height: 1.5em;
        }

        .day:hover {
            background: var(--calendar-hover-bg, #eee);
        }

        .selected {
            background: var(--calendar-selected-bg, #007bff);
            color: var(--calendar-selected-color, white);
        }

        .today {
            border: 2px solid var(--calendar-today-border, #007bff);
        }

        .week-number {
            background: var(--calendar-week-bg, #f5f5f5);
            color: var(--calendar-week-color, #333);
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            aspect-ratio: 1;
            font-size: clamp(0.6em, 1.2vw, 0.8em);
        }

        .other-month {
            opacity: var(--calendar-other-month-opacity, 0.3);
            color: var(--calendar-other-month-color, #999);
        }

        .other-month:hover {
            background: var(--calendar-other-month-hover-bg, #f0f0f0);
        }

        /* Resize handle styling */
        :host::after {
            content: "";
            position: absolute;
            bottom: 0;
            right: 0;
            width: 16px;
            height: 16px;
            background: linear-gradient(-45deg, transparent 30%, #ccc 30%, #ccc 35%, transparent 35%, transparent 65%, #ccc 65%, #ccc 70%, transparent 70%);
            cursor: nw-resize;
            pointer-events: none;
        }

        /* Responsive breakpoints */
        @container (max-width: 320px) {
            .day-names div,
            .day,
            .week-number {
                font-size: 0.7em;
            }
            
            select, button {
                font-size: 0.8em;
            }
        }

        @container (min-width: 500px) {
            .day-names div,
            .day,
            .week-number {
                font-size: 1.1em;
            }
            
            select, button {
                font-size: 1.1em;
            }
        }
        `);
        
        if (!this.shadowRoot.firstChild) {
            this._renderStructure();
        }
        this._updateCalendar();

        // Add keyboard navigation
        this.shadowRoot.addEventListener('keydown', this._onKeyDown.bind(this));
        this.tabIndex = 0;
    }

    disconnectedCallback() {
        // Clear any pending animation frames or timers
        if (this._focusTimeout) {
            clearTimeout(this._focusTimeout);
        }
        
        // Clean up all stored handlers
        this.shadowRoot.querySelectorAll('.day').forEach(day => {
            if (day._clickHandler) {
                day.removeEventListener('click', day._clickHandler);
                delete day._clickHandler;
            }
        });
        
        // Remove keyboard listener
        this.shadowRoot.removeEventListener('keydown', this._onKeyDown);
    }

    // Allow setting selected date via property
    set value(val) {
        try {
            if (val) {
                const date = new Date(val);
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid date');
                }
                this.selected = date;
                this.current = new Date(date);
                this._internals.setFormValue(date.toISOString().split('T')[0]);
                this._updateCalendar();
            }
        } catch (error) {
            console.warn('CalendarPicker: Invalid date value', val);
        }
    }
    get value() {
        return this.selected ? this.selected.toISOString().split('T')[0] : '';
    }

    get validity() {
        return this._internals?.validity;
    }

    get validationMessage() {
        return this._internals?.validationMessage;
    }

    checkValidity() {
        return this._internals?.checkValidity();
    }

    reportValidity() {
        return this._internals?.reportValidity();
    }

    _onKeyDown(e) {
        // Only handle if calendar grid is focused
        const days = this.shadowRoot.querySelectorAll('.day');
        if (!days.length) return;

        let selectedIndex = -1;
        if (this.selected) {
            selectedIndex = Array.from(days).findIndex(
                d => d.dataset.date === this.selected.toISOString().split('T')[0]
            );
        }

        let newIndex = selectedIndex;
        switch (e.key) {
            case 'ArrowRight':
                newIndex = Math.min(selectedIndex + 1, days.length - 1);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(selectedIndex - 1, 0);
                break;
            case 'ArrowDown':
                newIndex = Math.min(selectedIndex + 7, days.length - 1);
                break;
            case 'ArrowUp':
                newIndex = Math.max(selectedIndex - 7, 0);
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = days.length - 1;
                break;
            case 'Enter':
            case ' ':
                if (selectedIndex >= 0) {
                    days[selectedIndex].click();
                }
                return;
            default:
                return;
        }

        if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < days.length) {
            const newDay = days[newIndex];
            this.selected = new Date(newDay.dataset.date);
            this._internals.setFormValue(this.selected.toISOString().split('T')[0]);
            this.dispatchEvent(new CustomEvent('change', {
                detail: { value: this.selected.toISOString().split('T')[0] },
                bubbles: true
            }));
            this.dispatchNavigateEvent();
            this._updateCalendar(); // Instead of this._render()
            // Restore focus after re-render
            setTimeout(() => {
                const focusDay = this.shadowRoot.querySelector('.day.selected');
                if (focusDay) focusDay.focus();
            }, 0);
            e.preventDefault();
        }
    }

    dispatchNavigateEvent() {
        const year = this.current.getFullYear();
        const month = this.current.getMonth();
        const formatted = new Intl.DateTimeFormat(this.locale, { year: 'numeric', month: 'long' }).format(this.current);
        this.dispatchEvent(new CustomEvent('navigate', { detail: { year, month, formatted }, bubbles: true}));
    }

    _renderStructure() {
        const container = document.createElement('div');
        container.classList.add('calendar');
        container.setAttribute('role', 'grid');

        // Create header
        const header = this._createHeader();
        container.appendChild(header);

        // Create day names
        const dayNames = this._createDayNames();
        container.appendChild(dayNames);

        // Create days grid
        const daysGrid = document.createElement('div');
        daysGrid.classList.add('days');
        container.appendChild(daysGrid);

        // Cache DOM references
        this.#elements = {
            container,
            header,
            monthSelect: header.querySelector('select:first-child'),
            yearSelect: header.querySelector('select:last-child'),
            dayNames,
            daysGrid
        };

        this.shadowRoot.adoptedStyleSheets = [this.styles];
        this.shadowRoot.appendChild(container);
    }

    _createHeader() {
        const header = document.createElement('div');
        header.classList.add('header');

        const fragment = document.createDocumentFragment();
        
        const prev = document.createElement('button');
        prev.textContent = '<';
        prev.onclick = () => this._navigateMonth(-1);

        const next = document.createElement('button');
        next.textContent = '>';
        next.onclick = () => this._navigateMonth(1);

        const nav = document.createElement('div');
        nav.append(
            this._createMonthSelect(),
            this._createYearSelect()
        );

        fragment.append(prev, nav, next);
        header.appendChild(fragment);
        return header;
    }

    _createMonthSelect() {
        const monthSelect = document.createElement('select');
        const monthFormatter = new Intl.DateTimeFormat(this.locale, { month: 'long' });
        for (let i = 0; i < 12; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = monthFormatter.format(new Date(2000, i));
            monthSelect.appendChild(opt);
        }

        monthSelect.onchange = () => {
            const newDate = new Date(this.current);
            newDate.setMonth(parseInt(monthSelect.value));
            
            // Protect against month overflow
            if (newDate.getMonth() !== parseInt(monthSelect.value)) {
                newDate.setDate(0);
            }
            
            this.current = newDate;
            this.dispatchNavigateEvent();
            this._updateCalendar();
        };

        return monthSelect;
    }

    _createYearSelect() {
        const yearSelect = document.createElement('select');
        const year = this.current.getFullYear();
        for (let y = year - 50; y <= year + 50; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        }
        yearSelect.onchange = () => {
            this.current.setFullYear(parseInt(yearSelect.value));
            this.dispatchNavigateEvent();
            this._updateCalendar();
        };

        return yearSelect;
    }

    _createDayNames() {
        const dayNames = document.createElement('div');
        dayNames.classList.add('day-names');
        dayNames.setAttribute('role', 'row');

        const fragment = document.createDocumentFragment();

        // Week number header
        const weekHeader = document.createElement('div');
        weekHeader.textContent = 'Wk';
        fragment.appendChild(weekHeader);

        const dayFormatter = new Intl.DateTimeFormat(this.locale, { weekday: 'short' });
        for (let i = 0; i < 7; i++) {
            const div = document.createElement('div');
            div.textContent = dayFormatter.format(new Date(2024, 0, i));
            fragment.appendChild(div);
        }

        dayNames.appendChild(fragment);
        return dayNames;
    }

    _navigateMonth(delta) {
        const newDate = new Date(this.current);
        newDate.setMonth(newDate.getMonth() + delta);
        
        // Handle month overflow (e.g., Jan 31 + 1 month = Mar 3)
        if (newDate.getDate() !== this.current.getDate()) {
            newDate.setDate(0); // Go to last day of previous month
        }
        
        this.current = newDate;
        this.dispatchNavigateEvent();
        this._updateCalendar();
    }

    _updateCalendar() {
        this._updateSelects();
        this._updateDaysGrid();
    }

    _updateSelects() {
        const { monthSelect, yearSelect } = this.#elements;
        monthSelect.value = this.current.getMonth();
        yearSelect.value = this.current.getFullYear();
    }

    _updateDaysGrid() {
        const { daysGrid } = this.#elements;
        const month = this.current.getMonth();
        const year = this.current.getFullYear();
        const firstDay = new Date(year, month, 1);
        const firstWeekday = firstDay.getDay();
        const start = new Date(year, month, 1 - firstWeekday);

        const fragment = document.createDocumentFragment();
        let date = new Date(start);
        let selectedDayDiv = null;

        // Add week numbers column
        for (let week = 0; week < 6; week++) {
            // Week number cell
            const weekDiv = document.createElement('div');
            weekDiv.classList.add('week-number');
            weekDiv.textContent = this._getWeekNumber(date);
            weekDiv.style.fontWeight = 'bold';
            weekDiv.style.background = '#f5f5f5';
            fragment.appendChild(weekDiv);

            // Days of the week
            for (let day = 0; day < 7; day++) {
                const div = document.createElement('div');
                const currentDate = new Date(date);
                this._updateDayElement(div, currentDate);
                fragment.appendChild(div);
                if (this.selected && this.selected.toDateString() === currentDate.toDateString()) {
                    selectedDayDiv = div;
                }
                date.setDate(date.getDate() + 1);
            }
        }

        // Adjust grid to 8 columns (week number + 7 days)
        daysGrid.style.display = 'grid';
        daysGrid.style.gridTemplateColumns = 'repeat(8, 1fr)';

        daysGrid.innerHTML = '';
        daysGrid.appendChild(fragment);

        // Focus selected day
        if (selectedDayDiv) {
            requestAnimationFrame(() => selectedDayDiv.focus());
        }
    }

    _updateDayElement(div, date) {
        div.className = 'day';
        div.setAttribute('role', 'gridcell');
        div.textContent = date.getDate();
        div.dataset.date = date.toISOString().split('T')[0];

        const isSelected = this.selected && 
            this.selected.toDateString() === date.toDateString();

        // Check if date is in current month
        const isCurrentMonth = date.getMonth() === this.current.getMonth();

        div.tabIndex = isSelected ? 0 : -1;
        
        if (isSelected) {
            div.classList.add('selected');
            div.setAttribute('aria-selected', 'true');
        } else {
            div.removeAttribute('aria-selected');
        }

        if (this._isToday(date)) {
            div.classList.add('today');
        }

        // Add class for days not in current month
        if (!isCurrentMonth) {
            div.classList.add('other-month');
        }

        // Remove old listener before adding new one
        const oldHandler = div._clickHandler;
        if (oldHandler) {
            div.removeEventListener('click', oldHandler);
        }
        
        const newHandler = () => this._selectDate(new Date(date));
        div._clickHandler = newHandler;
        div.addEventListener('click', newHandler);
    }

    _selectDate(date) {
        this.selected = new Date(date);
        this._internals.setFormValue(this.selected.toISOString().split('T')[0]);
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: this.selected.toISOString().split('T')[0] },
            bubbles: true
        }));
        this.dispatchNavigateEvent();
        this._updateCalendar();
    }

    _isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    _getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue || !this.shadowRoot) return;
        
        switch (name) {
            case 'value':
                if (newValue) {
                    this.selected = new Date(newValue);
                    this.current = new Date(newValue);
                    this._updateCalendar();
                }
                break;
            case 'locale':
                this.locale = newValue;
                this._renderStructure();
                this._updateCalendar();
                break;
            case 'min':
            case 'max':
                this._updateCalendar();
                break;
        }
    }
}

customElements.define('calendar-picker', CalendarPicker);