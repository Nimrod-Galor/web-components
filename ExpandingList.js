/**
 * ExpandingList Web Component
 * Creates a collapsible/expandable nested list with accessibility support
 * 
 * @customElement expanding-list
 * @extends HTMLElement
 * @csspart list - The root list element
 * @csspart item - Individual list items
 * @csspart toggle - The expand/collapse button
 * 
 * @slot - Default slot for list content (<ul>, <ol>, or <dl>)
 * 
 * @cssprop --expand-color - Color of expand/collapse icons (default: blue)
 * @cssprop --expand-size - Size of expand/collapse icons (default: 1rem)
 * 
 * @fires toggle - When a list item is expanded or collapsed
 * @property {boolean} delegatesFocus - Whether the component delegates focus
 * 
 * @example
 * <expanding-list>
 *   <ul>
 *     <li>Item 1
 *       <ul>
 *         <li>Subitem 1.1</li>
 *         <li>Subitem 1.2</li>
 *       </ul>
 *     </li>
 *     <li>Item 2</li>
 *   </ul>
 * </expanding-list>
 */
class ExpandingList extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    this.attachShadow({ mode: "open", delegatesFocus: true })

    const list = this.querySelector("ul, ol, dl")
    if (!list){
      return
    }

    // Detach from light DOM and clone for processing
    const listClone = list.cloneNode(true)

    // Create styles and append them to the shadow root
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(`
      :host {
        --expand-color: blue;
        --expand-size: 1rem;
      }
      ul,
      ul ul {
        list-style-type: none;
      }

      ul li::before,
      ul dd::before {
        display: inline-block;
        padding: 0 0.5rem;
        vertical-align: text-bottom;
        content: "";
      }

      ul li.open::before,
      ul li.closed::before,
      ul dd.open::before,
      ul dd.closed::before {
        background-size: 1rem 1rem;
        position: relative;
      }

      ul li.open::before,
      ul dd.open::before {
        display: inline-block;
        padding: 0 0.5rem;
        vertical-align: text-bottom;
        content: "-";
        color: var(--expand-color);
        font-size: var(--expand-size);
      }

      ul li.closed::before,
      ul dd.closed::before {
        content: "+";
        color: var(--expand-color);
        font-size: var(--expand-size);
      }

      ul li.closed .closed::before,
      ul li.closed .open::before,
      ul dd.closed .closed::before,
      ul dd.closed .open::before {
        display: none;
      }
    `)

    this.shadowRoot.adoptedStyleSheets = [sheet]


    // Hide all child uls/ols/dls in the clone
    const uls = Array.from(listClone.querySelectorAll("ul, ol, dl"))
    const lis = Array.from(listClone.querySelectorAll("li, dd"))
    // Hide all child uls
    // These lists will be shown when the user clicks a higher level container
    uls.forEach((ul) => {
      ul.style.display = "none"
    })

    // Look through each li element in the ul
    lis.forEach((li) => {
    // If this li has a ul as a child, decorate it and add a click handler
      if (li.querySelectorAll("ul, ol, dl").length > 0) {
        // Add an attribute which can be used  by the style
        // to show an open or closed icon
        li.setAttribute("class", "closed")

        // Wrap the li element's text in a new span element
        // so we can assign style and event handlers to the span
        const childText = li.childNodes[0]
        if (!childText || childText.nodeType !== Node.TEXT_NODE) {
          console.warn('Expected text node as first child of li')
          return
        }
        const newSpan = document.createElement("span")

        // Copy text from li to span, set cursor style
        newSpan.textContent = childText.textContent
        newSpan.style.cursor = "pointer"
        newSpan.style.display = "inline-block"
        newSpan.style.padding = "0 0 0 1.5rem"
        newSpan.style.position = "relative"
        newSpan.style.left = "-1.25rem"
        newSpan.setAttribute('tabindex', '0')
        newSpan.setAttribute('role', 'button')
        newSpan.setAttribute('aria-expanded', 'false')

        // Add keydown handler to the span for accessibility
        // This allows the user to activate the span with Enter or Space
        newSpan.addEventListener("keydown", (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            newSpan.click()
          }
        })

        // Add the span and remove the bare text node from the li
        childText.parentNode.insertBefore(newSpan, childText)
        childText.parentNode.removeChild(childText)
      }
    })

    // Add single event listener to the list clone
    listClone.addEventListener("click", (e) => {
      if (e.target.matches('span[role="button"]')) {
        const nextul = e.target.nextElementSibling
        if (!nextul){
          return
        }

        // Toggle visible state and update class attribute on ul
        if (nextul.style.display == "block") {
          nextul.style.display = "none"
          nextul.parentNode.classList.remove("open")
          nextul.parentNode.classList.add("closed")
        } else {
          nextul.style.display = "block"
          nextul.parentNode.classList.remove("closed")
          nextul.parentNode.classList.add("open")
        }
      // nextul.setAttribute('aria-expanded', nextul.style.display == "block" ? 'true' : 'false')
      }
    })

    this.shadowRoot.innerHTML = "" // Clear the shadow root
    // Append the modified list clone to the shadow root
    this.shadowRoot.appendChild(listClone)
  }
}


// Define the new element
customElements.define("expanding-list", ExpandingList)