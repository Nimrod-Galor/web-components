class TextareaCount extends HTMLTextAreaElement {
    // static formAssociated = true;

    constructor() {
        super();
    }

    connectedCallback() {
        const countWrapper = document.createElement('div');
        countWrapper.style.marginTop = 0
        countWrapper.innerHTML = `Character count: <span class="count">0</span> ${this.getAttribute('maxlength') ? '/ ' + this.getAttribute('maxlength') : ''}</div><div class='alert'>`;
        this.after(countWrapper);


        this.addEventListener('input', () => {
            const count = this.value.length
            countWrapper.querySelector('.count').textContent = count

            const maxlength = this.getAttribute('maxlength')
            if (maxlength && count >= maxlength) {
                countWrapper.querySelector('.alert').textContent = `Reached maximum length of ${maxlength} characters!`
                this.classList.add('error')
            } else {
                countWrapper.querySelector('.alert').textContent = ''
                this.classList.remove('error')
            }
        });


    }

}

customElements.define('textarea-count', TextareaCount, { extends: 'textarea' });