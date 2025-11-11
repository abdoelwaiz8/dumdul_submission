

import ApiService from '../api/api-service.js';
import MapManager from '../helpers/map-manager.js';
import { formatDate } from '../helpers/formatters.js';
import * as idbHelper from '../utils/idb-helper.js'; // Impor helper IDB

const HomeView = {
  mapInstance: null,
  mapMarkers: [],
  storyData: [],

  async render() {
    // Fungsi render Anda yang sudah benar
    return `
      <div class="page-container">
        <section class="welcome-banner mb-3">
          <h2>Welcome to Journey Journal 🗺️</h2>
          <p>Temukan dan bagikan jurnal perjalanan menakjubkan dari seluruh Indonesia</p>
        </section>

        <section class="map-section mb-3">
          <h3 class="mb-2">Peta Lokasi Jurnal</h3>
          <div id="main-map" class="map-display" style="height: 400px; border-radius: 0.75rem; overflow: hidden;"></div>
        </section>

        <section class="journal-section">
          <div class="journal-header mb-2">
            <h3>Jurnal Terbaru</h3>
          </div>
          <div id="journal-grid-container" class="journal-grid">
            <div class="loading-indicator">
              <div class="spinner-dot"></div>
              <p>Memuat jurnal...</p>
            </div>
          </div>
        </section>
      </div>
    `;
  },

  async onPageLoad() {
    if (!ApiService.isUserLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }

    // Perbarui tautan otentikasi
    window.refreshAuthStatus();

    this._setupMap();
    await this._fetchStories();
  },

  _setupMap() {
    this.mapInstance = MapManager.createMap('main-map', [-2.5489, 118.0149], 5);
  },

  async _fetchStories() {
    const gridContainer = document.getElementById('journal-grid-container');
    gridContainer.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner-dot"></div>
        <p>Memuat jurnal...</p>
      </div>
    `;

    try {
      // 1. Coba ambil dari JARINGAN (API)
      console.log('Mencoba mengambil data dari API...');
      const stories = await ApiService.fetchAllStories();
      this.storyData = stories;
      
      // 2. Simpan ke IDB (Kriteria 4 Basic - Create/Update)
      await idbHelper.putAllStories(stories);
      console.log('Data dari API berhasil disimpan ke IDB.');
      
      this._renderStoryList(stories);

    } catch (error) {
      // 3. Jika JARINGAN GAGAL (Offline)
      console.error('Gagal mengambil dari API, mencoba dari IDB...', error.message);
      
      try {
        // 4. Ambil dari IDB (Kriteria 4 Basic - Read)
        const storiesFromCache = await idbHelper.getAllStories();
        if (storiesFromCache && storiesFromCache.length > 0) {
          console.log('Berhasil mengambil data dari IDB.');
          this.storyData = storiesFromCache;
          this._renderStoryList(storiesFromCache);
          alert('Anda sedang offline. Menampilkan data yang tersimpan.');
        } else {
          // Jika IDB juga kosong
          throw new Error('Cache IDB kosong.');
        }
      } catch (cacheError) {
        console.error('Gagal mengambil data dari IDB:', cacheError.message);
        gridContainer.innerHTML = `
          <div class="text-center" style="grid-column: 1/-1;">
            <p class="validation-message">Gagal memuat jurnal: ${cacheError.message}. Harap periksa koneksi Anda.</p>
          </div>
        `;
      }
    }
  },

  // FUNGSI BARU: Untuk me-render daftar cerita
  _renderStoryList(stories) {
    const gridContainer = document.getElementById('journal-grid-container');
    
    if (stories.length === 0) {
      gridContainer.innerHTML = `
        <div class="text-center" style="grid-column: 1/-1;">
          <p>Belum ada jurnal. Jadilah yang pertama berbagi!</p>
          <a href="#/add-story" class="button button-primary mt-2">Buat Jurnal Baru</a>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = '';
    stories.forEach((story, index) => {
      const storyCard = this._buildStoryCard(story, index);
      gridContainer.appendChild(storyCard);
    });

    this._populateMapMarkers();
  },

  _buildStoryCard(story, index) {
    const card = document.createElement('article');
    card.className = 'card-base journal-card';
    card.setAttribute('data-story-id', story.id);
    card.setAttribute('data-index', index);

    const photo = story.photoUrl || 'https://via.placeholder.com/400x200?text=No+Image';
    const storyDesc = story.description ? story.description.substring(0, 100) + '...' : 'Tidak ada deskripsi';
    const storyDate = formatDate(story.createdAt);

    card.innerHTML = `
      <img src="${photo}" alt="Foto oleh ${story.name}" loading="lazy">
      <div class="card-content">
        <h4 class="mb-1">${story.name}</h4>
        <p class="text-light" style="font-size: 0.875rem; margin-bottom: 0.75rem;">${storyDate}</p>
        <p style="margin-bottom: 1rem; flex-grow: 1;">${storyDesc}</p>
        ${story.lat && story.lon ? `
          <button class="button button-secondary button-small find-on-map-btn" data-index="${index}">
            📍 Tampilkan di Peta
          </button>
        ` : ''}
      </div>
    `;

    const locateBtn = card.querySelector('.find-on-map-btn');
    if (locateBtn) {
      locateBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Hentikan event agar tidak memicu klik kartu
        this._focusOnStory(index);
      });
    }

    // Klik kartu untuk menyorot
    card.addEventListener('click', () => {
        this._focusOnStory(index);
    });

    return card;
  },

  _populateMapMarkers() {
    this.mapMarkers.forEach(marker => marker.remove());
    this.mapMarkers = [];

    const locations = [];
    this.storyData.forEach((story, index) => {
      if (story.lat && story.lon) {
        locations.push(story);
        const popupHTML = `
          <div style="min-width: 180px;">
            <img src="${story.photoUrl}" alt="${story.name}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 0.375rem; margin-bottom: 0.5rem;">
            <h5 style="margin: 0 0 0.25rem 0;">${story.name}</h5>
            <p style="margin: 0; font-size: 0.875rem;">${story.description.substring(0, 50)}...</p>
          </div>
        `;

        const marker = MapManager.placeClickableMarker(
          this.mapInstance,
          story.lat,
          story.lon,
          popupHTML,
          () => {
            this._scrollToCard(index);
          }
        );
        this.mapMarkers.push(marker);
      }
    });

    if (locations.length > 0) {
      MapManager.fitMapToMarkers(this.mapInstance, locations);
    }
  },

  _focusOnStory(index) {
    const story = this.storyData[index];
    if (!story.lat || !story.lon) {
      this._scrollToCard(index);
      return;
    }

    MapManager.panToLocation(this.mapInstance, story.lat, story.lon, 14);

    const marker = this.mapMarkers.find(m => {
      const latLng = m.getLatLng();
      return latLng.lat === story.lat && latLng.lng === story.lon;
    });

    if (marker) {
      this.mapMarkers.forEach(m => MapManager.resetMarkerIcon(m));
      MapManager.highlightMarker(marker);
      marker.openPopup();
    }

    this._scrollToCard(index);
  },

  _scrollToCard(index) {
    const storyCard = document.querySelector(`[data-index="${index}"]`);
    if (storyCard) {
      storyCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      storyCard.style.transition = 'box-shadow 0.3s ease';
      storyCard.style.boxShadow = `0 0 0 3px var(--brand-primary)`;
      setTimeout(() => {
        storyCard.style.boxShadow = '';
      }, 2000);
    }
  },
};

export default HomeView;