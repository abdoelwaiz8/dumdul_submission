
class InputValidator {
  static checkEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, message: 'Email tidak boleh kosong' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Format email tidak valid' };
    }
    return { isValid: true, message: '' };
  }

  static checkPassword(password) {
    if (!password) {
      return { isValid: false, message: 'Password tidak boleh kosong' };
    }
    if (password.length < 8) {
      return { isValid: false, message: 'Password minimal 8 karakter' };
    }
    return { isValid: true, message: '' };
  }

  static checkName(name) {
    if (!name) {
      return { isValid: false, message: 'Nama tidak boleh kosong' };
    }
    if (name.length < 3) {
      return { isValid: false, message: 'Nama minimal 3 karakter' };
    }
    return { isValid: true, message: '' };
  }

  static checkDescription(description) {
    if (!description) {
      return { isValid: false, message: 'Deskripsi tidak boleh kosong' };
    }
    if (description.length < 10) {
      return { isValid: false, message: 'Deskripsi minimal 10 karakter' };
    }
    return { isValid: true, message: '' };
  }

  static checkFile(file, maxSizeMB = 5) {
    if (!file) {
      return { isValid: false, message: 'Foto tidak boleh kosong' };
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return { isValid: false, message: 'Hanya file JPG, JPEG, dan PNG yang diizinkan' };
    }
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, message: `Ukuran file maksimal ${maxSizeMB}MB` };
    }
    return { isValid: true, message: '' };
  }

  static checkCoordinates(lat, lon) {
    if (lat === null || lon === null || lat === undefined || lon === undefined) {
      return { isValid: false, message: 'Silakan pilih lokasi di peta' };
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return { isValid: false, message: 'Koordinat lokasi tidak valid' };
    }
    return { isValid: true, message: '' };
  }

  static showInputError(inputElement, message) {
    inputElement.classList.add('invalid');
    let errorContainer = inputElement.parentElement.querySelector('.validation-message');
    if (!errorContainer) {
      errorContainer = document.createElement('p');
      errorContainer.className = 'validation-message';
      errorContainer.setAttribute('role', 'alert');
      inputElement.parentElement.appendChild(errorContainer);
    }
    errorContainer.textContent = message;
  }

  static clearInputError(inputElement) {
    inputElement.classList.remove('invalid');
    const errorContainer = inputElement.parentElement.querySelector('.validation-message');
    if (errorContainer) {
      errorContainer.remove();
    }
  }
}

export default InputValidator;