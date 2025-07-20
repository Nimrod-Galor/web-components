This is a **Web Components Library** showcasing modern, reusable custom HTML elements built with native web standards.

## Project Overview

A comprehensive collection of **16 custom web components** organized into three main categories:

### 🎯 **Form Components**

- **Input Password** - Password field with show/hide toggle
- **TextArea Count** - Live character counter for textareas
- **Input Knob** - Circular range slider with touch/mouse/keyboard support
- **Signature Pad** - Canvas-based signature capture with form integration
- **Popup Info** - Accessible tooltip component

### 🌍 **Internationalization Components**

- **Locale Selector** - Language/region picker
- **Number/Currency/Date Formatters** - Locale-aware data formatting
- **Duration/Relative Time** - Time-based formatting
- **Plural Rules** - Ordinal number formatting (1st, 2nd, 3rd...)

### 🔧 **Widgets & Utilities**

- **Currency Converter** - Live exchange rates
- **Weather Widget** - Location-based weather display
- **Crypto Ticker** - Animated cryptocurrency prices
- **Virtual Keyboard** - Multi-language on-screen keyboard
- **GeoLocation** - Browser location access
- **Breadcrumb Trail** - Dynamic navigation breadcrumbs
- **Expanding List** - Collapsible nested lists

## Key Features

✅ **Form-associated** - Native form integration  
✅ **Accessible** - ARIA support, keyboard navigation  
✅ **Encapsulated** - Shadow DOM styling  
✅ **Reactive** - Attribute change detection  
✅ **Modern** - ES6+ classes, native APIs  
✅ **Demo Page** - Interactive showcase with documentation

Perfect for building modern, accessible web applications with reusable, standards-compliant components.

## Password Toggle

The `<input-password>` (or `<password-toggle>`) web component is a custom, form-associated password input field with a built-in show/hide toggle button.

---

### Key Features

- **Password Visibility Toggle:**  
  Includes a button (with an eye icon) to show or hide the password, improving usability for users.

- **Form-Associated:**  
  Integrates seamlessly with HTML forms, supporting validation, submission, and reset like a native `<input type="password">`.

- **Custom Validation:**  
  Supports `required`, `minlength`, and `maxlength` attributes, and displays appropriate validation messages.

- **Shadow DOM Encapsulation:**  
  Styles and markup are encapsulated, preventing conflicts with the rest of the page.

- **Accessibility:**

  - The input and toggle button have `aria-label` and `title` attributes.
  - The toggle button uses `type="button"` to avoid accidental form submission.
  - Keyboard navigation is preserved.

- **Attribute Reflection:**  
  Attributes like `placeholder`, `required`, `disabled`, `minlength`, `maxlength`, and `value` are reflected and kept in sync with the internal input.

---

### Usage Example

```html
<input-password
  name="password"
  placeholder="Enter password"
  required
  minlength="8"
  maxlength="32"
></input-password>
```

---

**Summary:**  
`<input-password>` is a robust, accessible, and user-friendly password input component for web forms, with built-in show/hide functionality and full support for form validation and accessibility.

## TextArea Count

The `<textarea is="textarea-count">` web component is a custom enhanced textarea that displays a live character count and provides user feedback as you type.

---

### Key Features

- **Live Character Count:**  
  Shows the current number of characters entered, and (if `maxlength` is set) displays the maximum allowed.

- **Max Length Alert:**  
  When the user reaches the maximum character limit, an alert message appears and an error style is applied.

- **Custom Event (`countchange`):**  
  Dispatches a `countchange` event with details (`textareaId`, `count`, `max`, `remaining`) every time the count updates, making it easy to track multiple counters on the same page.

- **Accessibility:**  
  Uses `aria-describedby` and `aria-live="polite"` for screen reader support.

- **Form Reset Support:**  
  Updates the character count when the parent form is reset.

- **Dynamic Maxlength:**  
  Reacts to changes in the `maxlength` attribute and updates the UI accordingly.

- **Automatic ID Assignment:**  
  Generates a unique ID if none is provided, ensuring each counter is uniquely identifiable.

---

### Usage Example

```html
<textarea is="textarea-count" maxlength="100" id="my-textarea"></textarea>
```

---

**Summary:**  
`<textarea is="textarea-count">` is a drop-in replacement for a standard textarea that adds live character counting, accessibility enhancements, and robust eventing for modern web forms.

## Popup Info

The `<popup-info>` web component is a custom tooltip/info popup element. It displays an info icon, and when the user hovers over or focuses on the icon, a tooltip with additional information appears.

---

### Key Features

- **Accessible Tooltip:**  
  Uses `aria-describedby` and `role="tooltip"` for screen reader support. The icon is keyboard-focusable (`tabindex="0"`), and the tooltip appears on hover, focus, or pressing Enter/Space.

- **Customizable Text:**  
  The tooltip text is set via the `data-text` attribute.

- **Shadow DOM Encapsulation:**  
  Styles and markup are encapsulated using Shadow DOM and adopted stylesheets, preventing style leaks.

- **Unique ARIA IDs:**  
  Each instance generates a unique ID for proper ARIA relationships, supporting multiple tooltips on the same page.

- **Smooth Visuals:**  
  The tooltip fades in/out with a CSS transition and is positioned relative to the icon.

---

### Usage Example

```html
<popup-info data-text="This is more information."></popup-info>
```

---

**Summary:**  
`<popup-info>` provides an accessible, reusable, and visually appealing tooltip for displaying extra information in your web applications.

## Input Knob

The `InputKnob` web component is a **form-associated, accessible circular range input** that allows users to select a numeric value by rotating a knob. It is implemented as a custom element (`<input-knob>`) and can be used in forms just like a native input.

### Key Features

- **Circular Range Control:** Users can adjust the value by dragging the knob, using touch, or with keyboard arrows.
- **Form-Associated:** Integrates with forms and supports form reset, disabled state, and value restoration.
- **Customizable Range:** Supports `min`, `max`, `step`, `sweep` (arc angle), and `direction` (start position: top, right, bottom, left) attributes.
- **SVG UI:** Renders a circular track, a pointer, and a highlighted arc to indicate the current value.
- **Accessibility:** Uses ARIA roles and attributes for screen reader support and keyboard navigation.
- **Events:** Fires standard `input` events on value change and `change` events only on commit (mouse/touch release or Enter key).
- **Styling:** Exposes CSS custom properties for colors and stroke widths.

### Example Usage

```html
<input-knob min="0" max="100" step="5" sweep="270" direction="top"></input-knob>
```

### Attributes

- `min` (number): Minimum value (default: 0)
- `max` (number): Maximum value (default: 100)
- `step` (number): Step increment (default: 1)
- `sweep` (number): Arc angle in degrees (default: 270)
- `direction` (string): Starting direction (`top`, `right`, `bottom`, `left`)
- `value` (number): Current value

### Events

- `input`: Fired on every value change (while dragging or pressing arrow keys)
- `change`: Fired only when the value is committed (on mouse/touch release or Enter key)

### Accessibility

- `role="slider"` and ARIA attributes for min, max, value, and label
- Keyboard support: Arrow keys, Home/End, Enter/Space

### Styling

Customizable via CSS variables:

- `--stroke-color`
- `--stroke-width`
- `--pointer-stroke-color`
- `--pointer-stroke-width`
- `--highlight-stroke-color`
- `--highlight-stroke-width`

---

**Summary:**  
`<input-knob>` is a modern, accessible, and customizable circular input control suitable for numeric value selection in web forms and UIs.

## Signature Pad

The `SignaturePad` web component is a **form-associated custom element** that allows users to draw and capture handwritten signatures directly in the browser. It is designed for use in web forms and provides validation, accessibility, and responsive resizing.

---

### Key Features

- **Handwritten Signature Capture:** Users can draw their signature using mouse or touch input on a canvas.
- **Form Integration:** The component integrates with HTML forms, supporting validation, reset, and form submission with the signature as a PNG file.
- **Validation:** Supports a `required` attribute and checks for a minimum number of non-empty pixels to ensure a valid signature.
- **Responsive & High-DPI:** Uses a `ResizeObserver` and device pixel ratio scaling to keep the signature crisp and responsive to container size changes.
- **Accessibility:** Focus management, keyboard accessibility, and clear validation messages.
- **Customizable:** Allows configuration of line width and color via attributes.
- **Events:** Fires `signature-ready` when a signature is captured and `signature-cleared` when cleared.
- **Clear Button:** Provides a button to clear the signature, with a confirmation prompt.

---

### Example Usage

```html
<signature-pad required line-width="3" line-color="#0077cc"></signature-pad>
```

### Attributes

- `required`: Makes the signature mandatory for form validation.
- `line-width`: Sets the pen width (default: 2).
- `line-color`: Sets the pen color (default: black).

### Events

- `signature-ready`: Fired when a signature is captured and processed. The event detail includes the PNG file.
- `signature-cleared`: Fired when the signature is cleared.

### Methods

- `reset()`: Programmatically clears the signature pad.
- `focus()`: Focuses the canvas for accessibility.

### Accessibility

- Focusable canvas.
- ARIA validation messages.
- Keyboard accessible clear button.

---

**Summary:**  
`<signature-pad>` is a robust, accessible, and customizable web component for capturing handwritten signatures in forms, with built-in validation, responsive design, and easy integration.

##

## SELECT LOCALES

This web component, `<select-local>`, provides a dropdown menu for selecting a locale (language and region code) supported by the browser.

### Key Features

- **Locale List:**  
  Displays a comprehensive list of supported locales (e.g., `en-US`, `fr-FR`, `zh-CN`).

- **Display Names:**  
  Uses `Intl.DisplayNames` to show user-friendly names for each locale, such as "English (United States)" or "Français (France)".

- **Default Locale:**  
  Defaults to `'en-US'` if no `displayLocale` attribute is set.

- **Reactivity:**  
  When the user selects a new locale, the component updates its internal state and dispatches a `locale-change` custom event with the new locale.

- **Custom Attribute:**  
  The `displayLocale` attribute controls which locale is currently selected and how locale names are displayed.

- **Accessibility:**  
  Uses a native `<select>` element for keyboard and screen reader support.

### Usage Example

```html
<select-local displayLocale="fr-FR"></select-local>
```

### How It Works

- On connection, it builds the dropdown with all supported locales.
- Selecting a locale updates the component and notifies listeners via an event.
- Locale names are shown in the currently selected language.

---

**Summary:**  
`<select-local>` is a reusable locale picker for web apps, supporting internationalization and easy integration.

## Number Format

This web component, `<number-format>`, automatically formats its numeric content as a localized number using the browser's `Intl.NumberFormat` API.

---

### Key Features

- **Locale-aware Formatting:**  
  Formats numbers according to the specified `locale` attribute, or falls back to a CSS variable or `'en-US'`.

- **Fraction Digits Control:**  
  Supports `minimum-fraction-digits` and `maximum-fraction-digits` attributes for precise decimal formatting.

- **Live Updates:**  
  Reacts to changes in its content and attributes, updating the formatted output automatically.

- **MutationObserver:**  
  Watches for changes to its content and re-formats as needed.

- **Accessibility:**  
  Sets both `aria-label` and `title` attributes to the formatted number for screen readers and tooltips.

---

### Usage Example

```html
<number-format
  locale="fr-FR"
  minimum-fraction-digits="2"
  maximum-fraction-digits="2"
>
  12345.678
</number-format>
```

---

**Summary:**  
`<number-format>` is a reactive, accessible, locale-aware number formatter for web apps, supporting custom fraction digit control and automatic updates.

## Currency Format

This web component, `<currency-format>`, automatically formats its numeric content as a localized currency value using the browser's `Intl.NumberFormat` API.

---

### Key Features

- **Locale-aware Currency Formatting:**  
  Formats numbers as currency according to the specified `locale` and `currency` attributes, or uses a default currency mapped from the locale.

- **Live Exchange Rate Conversion:**  
  When the `currency` attribute changes, it fetches the latest exchange rate and converts the value automatically.

- **Fraction Styling:**  
  Groups decimal and fraction parts together in a `<span class="fraction">` for custom styling, and wraps the currency symbol in `<span class="currency">`.

- **Automatic Updates:**  
  Reacts to changes in its content and attributes, updating the formatted output automatically.

- **MutationObserver:**  
  Watches for changes to its content and re-formats as needed.

- **Accessibility:**  
  Sets both `aria-label` and `title` attributes to the formatted currency string for screen readers and tooltips.

- **Locale-to-Currency Mapping:**  
  Includes a comprehensive mapping of locales to their default currencies.

---

### Usage Example

```html
<currency-format
  locale="fr-FR"
  currency="EUR"
  minimum-fraction-digits="2"
  maximum-fraction-digits="2"
>
  12345.678
</currency-format>
```

---

**Summary:**  
`<currency-format>` is a reactive, accessible, locale-aware currency formatter for web apps, supporting automatic currency conversion, custom fraction styling, and a wide range of locales and currencies.

## Date Format

This web component, `<date-format>`, automatically formats its content as a localized date and/or time using the browser's `Intl.DateTimeFormat` API.

---

### Key Features

- **Locale-aware Formatting:**  
  Formats dates and times according to the specified `locale`, `date-style`, `time-style`, and `time-zone` attributes.

- **Flexible Input:**  
  Accepts either a date string or a numeric timestamp (seconds or milliseconds).

- **Live Updates:**  
  Reacts to changes in its content and attributes, updating the formatted output automatically.

- **Accessibility:**  
  Sets both `aria-label` and `title` attributes to the formatted date/time for screen readers and tooltips.

- **MutationObserver:**  
  Watches for changes to its content and re-formats as needed.

---

### Usage Example

```html
<date-format
  locale="fr-FR"
  date-style="long"
  time-style="short"
  time-zone="Europe/Paris"
>
  2025-07-12T14:30:00
</date-format>
```

---

**Summary:**  
`<date-format>` is a reactive, accessible, locale-aware date/time formatter for web apps, supporting custom styles and time zones.

## Duration Format

This web component, `<duration-format>`, automatically formats a duration (such as hours, minutes, seconds, etc.) as a localized string using the browser's `Intl.DurationFormat` API.

---

### Key Features

- **Locale-aware Formatting:**  
  Formats durations according to the specified `locale` and `fstyle` (format style) attributes.

- **Flexible Duration Input:**  
  Supports all duration units: years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds, and fractional digits, each as an attribute.

- **Live Updates:**  
  Reacts to changes in its attributes and global `locale-change` events, updating the formatted output automatically.

- **MutationObserver:**  
  Watches for changes to its content, though formatting is always based on attributes.

- **Efficient Rendering:**  
  Only updates the displayed text if the formatted output changes.

---

### Usage Example

```html
<duration-format
  locale="fr-FR"
  fstyle="long"
  hours="2"
  minutes="30"
></duration-format>
```

---

**Summary:**  
`<duration-format>` is a reactive, locale-aware duration formatter for web apps, supporting all time units and custom styles. It’s ideal for displaying durations in a user’s preferred language and format.

## Plural Rules

This web component, `<plural-rules>`, automatically formats numbers as locale-aware ordinal numbers (like 1st, 2nd, 3rd, 4th) using the browser's `Intl.PluralRules` API and a locale-dependent suffix or prefix mapping.

---

### Key Features

- **Locale-aware Ordinal Formatting:**  
  Formats numbers with the correct ordinal suffix or prefix for the selected locale (e.g., "st" for English, "º" for Spanish, "第" for Chinese).

- **Automatic Suffix/Prefix Selection:**  
  Uses a built-in mapping for many languages and leverages `Intl.PluralRules` to select the right suffix for English and other languages with multiple ordinal forms.

- **Live Updates:**  
  Reacts to changes in its content and attributes (`locale`, `value`), updating the formatted output automatically.

- **MutationObserver:**  
  Watches for changes to its content and re-formats as needed.

- **Accessibility:**  
  Sets both `aria-label` and `title` attributes to the formatted ordinal string for screen readers and tooltips.

---

### Usage Example

```html
<plural-rules locale="en" value="2"></plural-rules>
<!-- 2nd -->
<plural-rules locale="fr" value="1"></plural-rules>
<!-- 1er -->
<plural-rules locale="zh" value="3"></plural-rules>
<!-- 第3 -->
```

---

**Summary:**  
`<plural-rules>` is a reactive, accessible, locale-aware ordinal number formatter for web apps, supporting a wide range of languages and automatic updates. If a locale is not mapped, it falls back to displaying the plain number.

## Relative Time Format

This web component, `<relativetime-format>`, automatically formats a numeric value as a localized relative time string (like "2 days ago" or "in 3 weeks") using the browser's `Intl.RelativeTimeFormat` API.

---

### Key Features

- **Locale-aware Relative Time:**  
  Formats numbers as relative time (past or future) according to the specified `locale`, `unit` (e.g., "day", "month"), and `fstyle` (format style: "long", "short", "narrow") attributes.

- **Live Updates:**  
  Reacts to changes in its attributes (`value`, `locale`, `unit`, `fstyle`) and updates the formatted output automatically.

- **MutationObserver:**  
  Watches for changes to its content and re-formats as needed.

- **Accessibility:**  
  Sets both `aria-label` and `title` attributes to the formatted relative time string for screen readers and tooltips.

---

### Usage Example

```html
<relativetime-format
  value="-2"
  unit="day"
  locale="en"
  fstyle="long"
></relativetime-format>
<!-- Output: "2 days ago" -->

<relativetime-format
  value="3"
  unit="week"
  locale="fr"
  fstyle="short"
></relativetime-format>
<!-- Output: "dans 3 sem." -->
```

---

**Summary:**  
`<relativetime-format>` is a reactive, accessible, locale-aware relative time formatter for web apps, supporting multiple time units, styles, and automatic updates.

## Currency Converter

This web component, `<currency-converter>`, provides a live currency conversion tool using the [frankfurter.app](https://www.frankfurter.app/) API.

---

### Key Features

- **Live Currency Conversion:**  
  Converts an amount from a source currency to one or more target currencies using real-time exchange rates.

- **Flexible Input:**  
  Users can specify the source currency, target currencies (space-separated), and amount via attributes or the input field.

- **Automatic Updates:**  
  Reacts to changes in its attributes (`source`, `target`, `amount`) and updates the conversion results automatically.

- **Error Handling:**  
  Displays clear error messages for network/API issues or unsupported currencies.

- **Accessibility:**  
  Uses labels, `aria-label`, and `title` attributes for screen readers and tooltips.

- **Shadow DOM Encapsulation:**  
  Styles and markup are encapsulated for safe integration.

---

### Usage Example

```html
<currency-converter
  source="USD"
  target="EUR GBP"
  amount="100"
></currency-converter>
```

---

**Note:**  
This implementation uses the frankfurter.app API. Not all currencies are supported; if a selected currency is not available, the conversion will not update for that currency. The upside is that no API key is required. For broader currency support, you can use a different currency conversion API.

---

**Summary:**  
`<currency-converter>` is a reactive, accessible, and user-friendly currency conversion component for web apps, supporting multiple currencies and live updates.

## Weather Widget

This web component, `<weather-widget>`, displays the current weather for a given location using the [open-meteo.com](https://open-meteo.com/) API.

---

### Key Features

- **Automatic or Manual Location:**  
  If `latitude` and `longitude` attributes are provided, it fetches weather for that location; otherwise, it tries to use the user's geolocation.

- **Unit Selection:**  
  Supports temperature in Celsius (default) or Fahrenheit via the `unit` attribute.

- **Live Weather Data:**  
  Fetches and displays the current temperature and a human-readable weather condition.

- **Weather Code Mapping:**  
  Translates weather codes from the API into descriptive text (e.g., "Clear sky", "Light rain").

- **Accessibility:**  
  Uses `aria-live="polite"` so screen readers announce updates.

- **Error Handling:**  
  Displays clear error messages if geolocation or API requests fail.

- **Shadow DOM Encapsulation:**  
  Styles and markup are encapsulated for safe integration.

---

### Usage Example

```html
<weather-widget
  latitude="40.7128"
  longitude="-74.0060"
  unit="fahrenheit"
></weather-widget>
```

---

**Summary:**  
`<weather-widget>` is a user-friendly, accessible, and customizable weather display component for web apps, supporting both automatic and manual location, unit selection, and clear weather descriptions.

## Crypto Ticker

This web component, `<crypto-ticker>`, displays a live, animated ticker of cryptocurrency prices in a selected fiat currency, using data from the CoinGecko API.

---

### Key Features

- **Live Crypto Prices:**  
  Fetches and displays real-time prices for one or more cryptocurrencies (default: Bitcoin and Ethereum).

- **Locale-aware Currency:**  
  Automatically selects the fiat currency based on the user's locale or a specified `currency` attribute. Supports a wide range of locales and currencies.

- **Customizable:**  
  Accepts `coins`, `currency`, and `interval` attributes to control which coins are shown, the fiat currency, and how often prices update (default: every 5 minutes).

- **Animated Ticker:**  
  Shows prices in a horizontally scrolling ticker for a dynamic, real-time effect.

- **Accessibility:**  
  Uses `aria-label` to provide a screen-reader-friendly summary of all displayed prices.

- **Error Handling & Retry:**  
  Retries failed API requests up to 3 times and displays a clear error message if prices cannot be loaded.

- **Shadow DOM Encapsulation:**  
  Styles and markup are encapsulated for safe integration with any site.

---

### Usage Example

```html
<crypto-ticker
  coins="bitcoin,ethereum,dogecoin"
  currency="eur"
  interval="60000"
></crypto-ticker>
```

---

**Summary:**  
`<crypto-ticker>` is a modern, accessible, and highly configurable web component for displaying live cryptocurrency prices in any major fiat currency, with automatic locale support and robust error handling.

## Virtual Keyboard

This web component, `<virtual-keyboard>`, provides an on-screen, multi-language virtual keyboard that can be attached to any input or textarea element on the page.

---

### Key Features

- **Multi-language Support:**  
  Supports English, French, German, Hebrew, and Arabic layouts, with easy switching via a language selector.

- **Shift and Caps Lock:**  
  Handles both Shift and Caps Lock states for proper case and symbol entry, including language-specific shift overrides.

- **Physical Keyboard Integration:**  
  Synchronizes with physical keyboard events for seamless user experience.

- **Custom Target:**  
  Can be attached to any input or textarea by specifying the `target` attribute (the element’s ID).

- **Accessibility:**  
  Uses ARIA roles and labels for screen reader support. Each key and the language switcher are accessible.

- **RTL Support:**  
  Automatically sets right-to-left direction for Hebrew and Arabic layouts.

- **Custom Layouts:**  
  Allows for custom keyboard layouts via a property.

- **Visual Feedback:**  
  Highlights pressed keys and provides responsive button styling.

- **Shadow DOM Encapsulation:**  
  Styles and markup are encapsulated for safe integration.

---

### Usage Example

```html
<input id="myInput" type="text" />
<virtual-keyboard
  target="myInput"
  language="en"
  langswitcher
></virtual-keyboard>
```

---

**Summary:**  
`<virtual-keyboard>` is a robust, accessible, and highly configurable on-screen keyboard component, ideal for multilingual web apps, touch interfaces, and accessibility solutions.

## Breadcrumb Trail

This web component, `<breadcrumb-trail>`, displays a dynamic breadcrumb navigation trail based on the current URL path.

---

### Key Features

- **Automatic Breadcrumb Generation:**  
  Parses the URL path and generates a breadcrumb trail, with each segment as a clickable link (except the last/current page).

- **Customizable Home Label and Separator:**  
  The first breadcrumb label ("Home" by default) and the separator ("/" by default) can be customized via the `home-label` and `separator` attributes.

- **Semantic & Accessible Markup:**  
  Uses `<nav aria-label="Breadcrumb">` and an ordered list (`<ol>`) for accessibility and semantic structure. The current page is marked with `aria-current="page"`.

- **Shadow DOM Encapsulation:**  
  Styles and markup are encapsulated, preventing style leakage.

- **Reactivity:**  
  Updates automatically when the browser’s history changes (e.g., back/forward navigation) or when the `home-label` attribute changes.

---

### Usage Example

```html
<breadcrumb-trail home-label="Dashboard" separator=">"></breadcrumb-trail>
```

---

**Summary:**  
`<breadcrumb-trail>` is a customizable, accessible, and automatically updating breadcrumb navigation component for web apps.

## Expanding List

This web component, `<expanding-list>`, provides an accessible, interactive expanding/collapsing list UI for nested lists.

---

### Key Features

- **Shadow DOM Encapsulation:**  
  All styles and logic are encapsulated, preventing conflicts with the rest of the page.

- **Progressive Enhancement:**  
  Takes a nested `<ul>`, `<ol>`, or `<dl>` placed inside the component and enhances it with expand/collapse functionality.

- **Expand/Collapse Controls:**  
  List items with nested lists show a "+" (collapsed) or "–" (expanded) icon. Clicking the label toggles the visibility of the nested list.

- **Accessibility:**  
  Each clickable label is a focusable button (`tabindex="0"`, `role="button"`) and supports keyboard interaction (Enter/Space).

- **Customizable Appearance:**  
  Uses CSS custom properties (`--expand-color`, `--expand-size`) for easy theming.

- **Event Delegation:**  
  Uses a single event listener for efficient handling of expand/collapse actions.

---

### Usage Example

```html
<expanding-list>
  <ul>
    <li>
      Fruits
      <ul>
        <li>Apple</li>
        <li>Banana</li>
      </ul>
    </li>
    <li>
      Vegetables
      <ul>
        <li>Carrot</li>
      </ul>
    </li>
  </ul>
</expanding-list>
```

---

**Summary:**  
`<expanding-list>` is a reusable, accessible, and styleable component for interactive nested lists, ideal for menus, FAQs, or any expandable content structure.
