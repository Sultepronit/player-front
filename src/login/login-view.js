import style from './style.css?inline';
import loginViewTemplate from "./login-view-template";
import { signIn } from '../services/api/auth';

export default class LoginView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            ${loginViewTemplate}
        `;
        this.passwordInput = this.shadowRoot.querySelector('#passwordInput');
        this.toggler = this.shadowRoot.querySelector('#toggle-password');
        // console.log(this.passwordInput, this.toggler);
        this.form = this.shadowRoot.querySelector('#login-form');
    }

    connectedCallback() {
        this.toggler.addEventListener('click', () => {
            const isPassword = this.passwordInput.type === 'password';
            this.passwordInput.type = isPassword ? 'text' : 'password';
            this.toggler.textContent = isPassword ? '🙈' : '👁️';
        });

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            // console.log(e);
            const formData = new FormData(e.target);
            signIn(formData.get('login'), formData.get('pass'));
        });
    }
}