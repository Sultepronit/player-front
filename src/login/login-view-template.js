const loginViewTemplate = `
<section class="login-view hiddens">
    <form id="login-form">
        <input type="email" name="email" placeholder="email">
        <div class="password-container">
            <input type="password" name="pass" id="passwordInput" placeholder="password">
            <!-- <span class="toggle-password" onclick="togglePasswordVisibility()">👁️</span> -->
            <span class="toggle-password" id="toggle-password">👁️</span>
        </div>
        <button type="submit">Увійти</button>
        <p id="auth-message"></p>
    </form>
</section>
`;
export default loginViewTemplate;