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
 *  *
 * @note
 * The list passed to <expanding-list> (ul, ol, or dl) will be moved from the light DOM into the shadow DOM.
 * It will not remain in the light DOM after initialization. All expand/collapse logic and accessibility features
 * are handled inside the shadow DOM.
 */
class ExpandingList extends HTMLElement {
  constructor() {
    super()
    // Bind event handlers once
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleClick = this._handleClick.bind(this);
  }

  static get observedAttributes() {
    return ['expand-all', 'collapse-all', 'animate'];
}

attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
        case 'expand-all':
            this._expandAll(newValue !== null);
            break;
        case 'collapse-all':
            this._collapseAll(newValue !== null);
            break;
        case 'animate':
            this._toggleAnimations(newValue !== null);
            break;
    }
}

  connectedCallback() {
    this.attachShadow({ mode: "open", delegatesFocus: true })

    const list = this.querySelector("ul, ol, dl")
    if (!list) {
      console.warn('No list element (<ul>, <ol>, or <dl>) found in expanding-list');
      return;
    }

    // Detach from light DOM and clone for processing
    // Add error boundary for clone operation
    let listClone;
    try {
        listClone = list.cloneNode(true);
    } catch (err) {
        console.error('Failed to clone list:', err);
        return;
    }

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

      :host([animate]) ul,
      :host([animate]) ol,
      :host([animate]) dl {
          transition: all 0.3s ease-in-out;
          overflow: hidden;
      }
      
      :host([animate]) ul[style*="none"],
      :host([animate]) ol[style*="none"],
      :host([animate]) dl[style*="none"] {
          max-height: 0;
          opacity: 0;
      }
      
      :host([animate]) ul[style*="block"],
      :host([animate]) ol[style*="block"],
      :host([animate]) dl[style*="block"] {
          max-height: 1000px;
          opacity: 1;
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
        li.setAttribute("class", "closed")

        let childText = null
        for (const node of li.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
            childText = node
            break
          }
        }
        if (!childText) {
          // If no text node, fallback to first element or skip
          if (li.childNodes.length > 0) {
            childText = li.childNodes[0]
          } else {
            console.warn('No suitable child node found in li/dd')
            return
          }
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
        newSpan.addEventListener("keydown", this._handleKeydown);

        // Add the span and remove the bare text node from the li
        childText.parentNode.insertBefore(newSpan, childText)
        childText.parentNode.removeChild(childText)
      }
    })

    // Add single event listener to the list clone
    listClone.addEventListener("click", this._handleClick);

    this.shadowRoot.innerHTML = "" // Clear the shadow root
    // Append the modified list clone to the shadow root
    this.shadowRoot.appendChild(listClone)
  }

  disconnectedCallback() {
      // Clean up event listeners
      const buttons = this.shadowRoot.querySelectorAll('span[role="button"]');
      buttons.forEach(button => {
          button.removeEventListener('keydown', this._handleKeydown);
      });
      
      // Clear shadow root
      if (this.shadowRoot) {
          this.shadowRoot.innerHTML = '';
      }
  }

  _handleKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.target.click();
    }
  }

  _handleClick = (e) => {
    if (e.target.matches('span[role="button"]')) {
      const nextul = e.target.nextElementSibling;
      if (!nextul){
        return;
      }

      const isExpanding = nextul.style.display !== "block";

      // Toggle state
      nextul.style.display = isExpanding ? "block" : "none";
      nextul.parentNode.classList.toggle("open", isExpanding);
      nextul.parentNode.classList.toggle("closed", !isExpanding);
      e.target.setAttribute('aria-expanded', String(isExpanding));
      e.target.focus();        
    }
  }

  _expandAll(expand) {
    const items = this.shadowRoot.querySelectorAll('li.closed, dd.closed');
    items.forEach(item => this._toggleItem(item, expand));
  }

  _collapseAll(collapse) {
    const items = this.shadowRoot.querySelectorAll('li.open, dd.open');
    items.forEach(item => this._toggleItem(item, !collapse));
  }

  _toggleItem(item, expand) {
    const ul = item.querySelector('ul, ol, dl');
    const toggle = item.querySelector('span[role="button"]');
    if (ul && toggle) {
      ul.style.display = expand ? 'block' : 'none';
      item.classList.toggle('open', expand);
      item.classList.toggle('closed', !expand);
      toggle.setAttribute('aria-expanded', String(expand));
    }
  }
}

// Define the new element
customElements.define("expanding-list", ExpandingList)