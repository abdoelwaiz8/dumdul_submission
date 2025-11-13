// File: dumdul_submission1/src/scripts/app.js

import appRoutes from './routes.js';

class Application {
  constructor({ appRoot }) {
    this._appRoot = appRoot;
    this._initShell();
  }

  _initShell() {
    this._initNavigation();
  }

  _initNavigation() {
    const navLinks = document.querySelectorAll('.header-nav a');
    
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this._closeMobileMenu();
      });
    });
  }

  _closeMobileMenu() {
    // Fungsi ini bisa Anda isi nanti
  }

  async displayPage() {
    const url = this._getActiveRoute();
    const page = appRoutes[url];

    if (!page) {
      window.location.hash = '#/';
      return;
    }

    try {
      // 1. Dapatkan string HTML terlebih dahulu
      const pageHtml = await page.render();

      // 2. Gunakan View Transition jika tersedia (praktik baik dari referensi)
      if (document.startViewTransition) {
        await document.startViewTransition(() => {
          this._appRoot.innerHTML = pageHtml;
        }).finished;
      } else {
        // Fallback: langsung set HTML
        this._appRoot.innerHTML = pageHtml;
      }
      
      // 3. TAMBAHKAN DELAY SINGKAT INI
      // Ini memberi browser waktu untuk mem-parsing dan me-mount HTML
      // sebelum kita mencoba mengakses elemen DOM-nya (seperti 'favorites-map').
      await new Promise(resolve => setTimeout(resolve, 50)); 
      
      // 4. Panggil onPageLoad (JS) SETELAH HTML dijamin ada
      if (page.onPageLoad) {
        await page.onPageLoad();
      }
      // --- PERUBAHAN SELESAI ---

      window.scrollTo(0, 0);
      this._appRoot.focus();

    } catch (error) {
      console.error('Gagal me-render halaman:', error);
      this._appRoot.innerHTML = `
        <div class="page-container">
          <div class="text-center" style="padding: 3rem;">
            <h2>Oops! Terjadi Kesalahan</h2>
            <p class="text-light mt-2">${error.message}</p>
            <a href="#/" class="button button-primary mt-2">Kembali ke Beranda</a>
          </div>
        </div>
      `;
    }
  }

  _getActiveRoute() {
    let url = window.location.hash.slice(1).toLowerCase();
    
    if (url === '') {
      return '/';
    }

    if (url.endsWith('/') && url.length > 1) {
      url = url.slice(0, -1);
    }
    
    return url;
  }
}

export default Application;