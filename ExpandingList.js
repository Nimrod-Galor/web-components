// Create a class for the element
class ExpandingList extends HTMLUListElement {
  constructor() {
    // Always call super first in constructor
    // Return value from super() is a reference to this element
    self = super();

  }

  connectedCallback() {
    // add styles
    self.innerHTML += `<style>
        
        ul[is="expanding-list"],
        ul[is="expanding-list"] ul {
            list-style-type: none;
        }

        ul[is="expanding-list"] li::before,
        ul[is="expanding-list"] dd::before {
            display: inline-block;
            padding: 0 0.5rem;
            vertical-align: text-bottom;
            content: "";
        }

        ul[is="expanding-list"] li.open::before,
        ul[is="expanding-list"] li.closed::before,
        ul[is="expanding-list"] dd.open::before,
        ul[is="expanding-list"] dd.closed::before {
            background-size: 1rem 1rem;
            position: relative;
        }

        ul[is="expanding-list"] li.open::before,
        ul[is="expanding-list"] dd.open::before {
            /* background-image: url(img/down.png); */
            display: inline-block;
            padding: 0 0.5rem;
            vertical-align: text-bottom;
            content: "-";
            color: blue;
        }

        ul[is="expanding-list"] li.closed::before,
        ul[is="expanding-list"] dd.closed::before {
            /* background-image: url(img/right.png); */
            content: "+";
            color: blue;
        }

        ul[is="expanding-list"] li.closed .closed::before,
        ul[is="expanding-list"] li.closed .open::before,
        ul[is="expanding-list"] dd.closed .closed::before,
        ul[is="expanding-list"] dd.closed .open::before {
            display: none;
        }
    </style>`


    // Get ul and li elements that are a child of this custom ul element
    // li elements can be containers if they have uls within them
    const uls = Array.from(self.querySelectorAll("ul, ol, dl"));
    const lis = Array.from(self.querySelectorAll("li, dd"));
    // Hide all child uls
    // These lists will be shown when the user clicks a higher level container
    uls.forEach((ul) => {
      ul.style.display = "none";
    });

    // Look through each li element in the ul
    lis.forEach((li) => {
      // If this li has a ul as a child, decorate it and add a click handler
      if (li.querySelectorAll("ul, ol, dl").length > 0) {
        // Add an attribute which can be used  by the style
        // to show an open or closed icon
        li.setAttribute("class", "closed");

        // Wrap the li element's text in a new span element
        // so we can assign style and event handlers to the span
        const childText = li.childNodes[0];
        const newSpan = document.createElement("span");

        // Copy text from li to span, set cursor style
        newSpan.textContent = childText.textContent;
        newSpan.style.cursor = "pointer";
        newSpan.style.display = "inline-block";
        newSpan.style.padding = "0 0 0 1.5rem";
        newSpan.style.position = "relative";
        newSpan.style.left = "-1.25rem";

        // Add click handler to this span
        newSpan.addEventListener("click", (e) => {
          // next sibling to the span should be the ul
          const nextul = e.target.nextElementSibling;

          // Toggle visible state and update class attribute on ul
          if (nextul.style.display == "block") {
            nextul.style.display = "none";
            nextul.parentNode.setAttribute("class", "closed");
          } else {
            nextul.style.display = "block";
            nextul.parentNode.setAttribute("class", "open");
          }
        });
        // Add the span and remove the bare text node from the li
        childText.parentNode.insertBefore(newSpan, childText);
        childText.parentNode.removeChild(childText);
      }
    });
  }
}

// Define the new element
customElements.define("expanding-list", ExpandingList, { extends: "ul" });