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
