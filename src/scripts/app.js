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
  }

  async displayPage() {
    const url = this._getActiveRoute();
    const page = appRoutes[url];

    if (!page) {
      window.location.hash = '#/';
      return;
    }

    try {
      this._appRoot.innerHTML = await page.render();
      
      if (page.onPageLoad) {
        await page.onPageLoad();
      }

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