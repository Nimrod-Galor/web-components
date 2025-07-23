class ScrollButtons extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });


      // Create styles and append them to the shadow root
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(`
            :host {
            position: fixed;
            right: 50px;
            z-index: 9999;
          }

          .btn {
            all: unset;
            display: none;
            background: #333;
            color: white;
            border-radius: 50%;
            padding: 12px 14px;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            margin: 10px 0;
            transition: background 0.3s;
          }

          .btn:hover {
            background: #555;
          }

          .top-btn {
            bottom: 70px;
            position: fixed;
          }

          .bottom-btn {
            bottom: 20px;
            position: fixed;
          }
        `)
      this.shadowRoot.adoptedStyleSheets = [sheet];

      shadow.innerHTML = `
        <button class="btn top-btn" title="Back to Top">↑</button>
        <button class="btn bottom-btn" title="Go to Bottom">↓</button>
      `;

      this.topButton = shadow.querySelector('.top-btn');
      this.bottomButton = shadow.querySelector('.bottom-btn');

      this.topButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      this.bottomButton.addEventListener('click', () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      });
    }

    connectedCallback() {
      this._toggleButtons = () => {
        const scrollY = window.scrollY;
        const nearBottom = window.innerHeight + scrollY >= document.body.scrollHeight - 10;

        this.topButton.style.display = scrollY > 300 ? 'inline-block' : 'none';
        this.bottomButton.style.display = !nearBottom ? 'inline-block' : 'none';
      };

      window.addEventListener('scroll', this._toggleButtons);
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this._toggleButtons);
    }
  }

  customElements.define('scroll-buttons', ScrollButtons);