import ApiService from '../api/api-service.js';
import InputValidator from '../helpers/input-validator.js';

const RegisterView = {
  async render() {
    return `
      <div class="page-container">
        <div class="login-wrapper">
          <div class="login-box">
            <h2 class="text-center mb-2">Buat Akun Baru</h2>
            <p class="text-center text-light mb-3">Bergabunglah dan mulai bagikan jurnal Anda!</p>
            
            <form id="register-form" novalidate>
              <div class="form-field">
                <label for="name">Nama Lengkap</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  class="input-control" 
                  placeholder="Masukkan nama lengkap Anda"
                  autocomplete="name"
                  required
                  aria-required="true"
                >
              </div>

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
                  placeholder="Minimal 8 karakter"
                  autocomplete="new-password"
                  required
                  aria-required="true"
                >
              </div>

              <button type="submit" class="button button-primary" style="width: 100%;">
                Daftar
              </button>
            </form>

            <p class="text-center mt-3">
              Sudah punya akun? 
              <a href="#/login">Masuk di sini</a>
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

    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Validasi Real-time
    nameInput.addEventListener('blur', () => {
      const validation = InputValidator.checkName(nameInput.value);
      if (!validation.isValid) InputValidator.showInputError(nameInput, validation.message);
      else InputValidator.clearInputError(nameInput);
    });

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

    // Penangan Submit Form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Validasi semua
      const nameValidation = InputValidator.checkName(name);
      const emailValidation = InputValidator.checkEmail(email);
      const passwordValidation = InputValidator.checkPassword(password);

      let isFormValid = true;

      if (!nameValidation.isValid) {
        InputValidator.showInputError(nameInput, nameValidation.message);
        isFormValid = false;
      } else {
        InputValidator.clearInputError(nameInput);
      }

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

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mendaftarkan...';

      try {
        await ApiService.register(name, email, password);
        alert('Registrasi berhasil! Silakan masuk untuk melanjutkan.');
        window.location.hash = '#/login';
      } catch (error) {
        alert(`Registrasi gagal: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Daftar';
      }
    });
  },
};

export default RegisterView;