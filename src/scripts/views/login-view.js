import ApiService from '../api/api-service.js';
import InputValidator from '../helpers/input-validator.js';

const LoginView = {
  async render() {
    return `
      <div class="page-container">
        <div class="login-wrapper">
          <div class="login-box">
            <h2 class="text-center mb-2">Selamat Datang Kembali</h2>
            <p class="text-center text-light mb-3">Masuk untuk melanjutkan ke Journey Journal</p>
            
            <form id="login-form" novalidate>
              <div class="form-field">
                <label for="email">Alamat Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  class="input-control" 
                  placeholder="nama@email.com"
                  autocomplete="email"
                  required
                  aria-required="true"
                >
              </div>

              <div class="form-field">
                <label for="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  class="input-control" 
                  placeholder="Masukkan password"
                  autocomplete="current-password"
                  required
                  aria-required="true"
                >
              </div>

              <button type="submit" class="button button-primary" style="width: 100%;">
                Masuk
              </button>
            </form>

            <p class="text-center mt-3">
              Belum punya akun? 
              <a href="#/register">Daftar di sini</a>
            </p>
          </div>
        </div>
      </div>
    `;
  },

  async onPageLoad() {
    if (ApiService.isUserLoggedIn()) {
      window.location.hash = '#/';
      return;
    }

    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Validasi saat input tidak fokus
    emailInput.addEventListener('blur', () => {
      const validation = InputValidator.checkEmail(emailInput.value);
      if (!validation.isValid) InputValidator.showInputError(emailInput, validation.message);
      else InputValidator.clearInputError(emailInput);
    });

    passwordInput.addEventListener('blur', () => {
      const validation = InputValidator.checkPassword(passwordInput.value);
      if (!validation.isValid) InputValidator.showInputError(passwordInput, validation.message);
      else InputValidator.clearInputError(passwordInput);
    });

    // Penangan submit form
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Validasi semua
      const emailValidation = InputValidator.checkEmail(email);
      const passwordValidation = InputValidator.checkPassword(password);

      let isFormValid = true;
      if (!emailValidation.isValid) {
        InputValidator.showInputError(emailInput, emailValidation.message);
        isFormValid = false;
      } else {
        InputValidator.clearInputError(emailInput);
      }

      if (!passwordValidation.isValid) {
        InputValidator.showInputError(passwordInput, passwordValidation.message);
        isFormValid = false;
      } else {
        InputValidator.clearInputError(passwordInput);
      }

      if (!isFormValid) return;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses...';

      try {
        await ApiService.login(email, password);
        alert('Login berhasil! Selamat datang kembali.');
        
        // Panggil refreshAuthStatus global dari index.js
        window.refreshAuthStatus(); 
        
        window.location.href = '/';
      } catch (error) {
        alert(`Login gagal: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Masuk';
      }
    });
  },
};

export default LoginView;