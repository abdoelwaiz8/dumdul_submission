// File: dumdul_submission1/src/scripts/views/favorites-view.js

import * as idbHelper from '../utils/idb-helper.js';
import MapManager from '../helpers/map-manager.js';
import { formatDate } from '../helpers/formatters.js';
import ApiService from '../api/api-service.js';

const FavoritesView = {
  _map: null,
  _markers: [],
  _favorites: [],
  _filteredFavorites: [],

  async render() {
    return `
      <div class="page-container">
        <section class="favorites-header mb-3">
          <h2>❤️ Jurnal Favorit Anda</h2>
          <p class="text-light">Kumpulan jurnal yang Anda simpan dari IndexedDB</p>
        </section>

        <section class="favorites-controls mb-3">
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <input 
                type="text" 
                id="search-favorites" 
                class="input-control" 
                placeholder="🔍 Cari favorit..."
                aria-label="Cari favorit"
              >
            </div>
            <div style="min-width: 200px;">
              <select id="sort-favorites" class="input-control" aria-label="Urutkan favorit">
                <option value="savedAt-desc">Baru Disimpan</option>
                <option value="savedAt-asc">Lama Disimpan</option>
                <option value="name-asc">Nama (A-Z)</option>
                <option value="name-desc">Nama (Z-A)</option>
              </select>
            </div>
          </div>
        </section>

        <section class="map-section mb-3">
          <h3 class="mb-2">Lokasi Favorit</h3>
          <div id="favorites-map" class="map-display" style="height: 400px; border-radius: 0.75rem; overflow: hidden;"></div>
        </section>

        <section class="favorites-section">
          <div style="display: flex; justify-content: space-between; align-items: center;" class="mb-2">
            <h3>Cerita Tersimpan (<span id="favorites-count">0</span>)</h3>
            <button id="clear-all-btn" class="button button-danger" style="display: none; padding: 0.5rem 1rem;">
              🗑️ Hapus Semua
            </button>
          </div>
          <div id="favorites-list" class="journal-grid">
            <div class="loading-indicator">
              <div class="spinner-dot"></div>
              <p>Memuat favorit...</p>
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

    this._initMap();
    await this._loadFavorites();
    this._setupEventListeners();
  },

  _initMap() {
    this._map = MapManager.createMap('favorites-map', [-2.5489, 118.0149], 5);
  },

  async _loadFavorites() {
    const favoritesListElement = document.getElementById('favorites-list');
    const favoritesCountElement = document.getElementById('favorites-count');
    const clearAllBtn = document.getElementById('clear-all-btn');

    try {
      this._favorites = await idbHelper.getAllFavorites();
      this._filteredFavorites = [...this._favorites];
      
      favoritesCountElement.textContent = this._favorites.length;

      if (this._favorites.length === 0) {
        favoritesListElement.innerHTML = `
          <div class="text-center" style="grid-column: 1/-1; padding: 3rem;">
            <h3>💔 Belum Ada Favorit</h3>
            <p class="text-light mt-2">Mulai tambahkan jurnal ke favorit dari halaman beranda!</p>
            <a href="#/" class="button button-primary mt-2">Cari Jurnal</a>
          </div>
        `;
        clearAllBtn.style.display = 'none';
        return;
      }

      clearAllBtn.style.display = 'inline-flex';
      this._renderFavorites(this._filteredFavorites);
      this._addMarkersToMap();

    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      favoritesListElement.innerHTML = `
        <div class="text-center" style="grid-column: 1/-1; padding: 3rem;">
          <h3 style="color: var(--danger-color);">⚠️ Gagal Memuat Favorit</h3>
          <p class="text-light mt-2">${error.message}</p>
        </div>
      `;
    }
  },

  _renderFavorites(favorites) {
    const favoritesListElement = document.getElementById('favorites-list');
    favoritesListElement.innerHTML = '';

    favorites.forEach((story, index) => {
      const storyCard = this._createFavoriteCard(story, index);
      favoritesListElement.appendChild(storyCard);
    });
  },

  _createFavoriteCard(story, index) {
    const card = document.createElement('article');
    card.className = 'card-base journal-card';
    card.setAttribute('data-story-id', story.id);
    card.setAttribute('data-index', index);

    const photoUrl = story.photoUrl || 'https://via.placeholder.com/400x200?text=No+Image';
    const description = story.description || 'Tidak ada deskripsi';
    const name = story.name || 'Anonymous';
    
    const createdAt = formatDate(story.createdAt);
    const savedAt = formatDate(story.savedAt, 'id-ID', { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
      <img src="${photoUrl}" alt="Jurnal oleh ${name}" loading="lazy">
      <div class="card-content">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
          <h4 style="margin: 0;">${name}</h4>
          <button class="btn-favorite active" data-story-id="${story.id}" aria-label="Hapus dari favorit" title="Hapus dari favorit">
            ❤️
          </button>
        </div>
        <p class="text-light" style="font-size: 0.875rem; margin-bottom: 0.25rem;">
          📅 Dibuat: ${createdAt}
        </p>
        <p class="text-light" style="font-size: 0.875rem; margin-bottom: 0.75rem;">
          💾 Disimpan: ${savedAt}
        </p>
        <p style="margin-bottom: 0.75rem;">${description}</p>
        ${story.lat && story.lon ? `
          <button class="button button-secondary button-small locate-btn" data-index="${index}">
            📍 Tampilkan di Peta
          </button>
        ` : ''}
      </div>
    `;

    const locateBtn = card.querySelector('.locate-btn');
    if (locateBtn) {
      locateBtn.addEventListener('click', () => {
        this._highlightStory(index);
      });
    }

    const favoriteBtn = card.querySelector('.btn-favorite');
    favoriteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this._removeFavorite(story.id);
    });

    return card;
  },

  _addMarkersToMap() {
    this._markers.forEach(marker => marker.remove());
    this._markers = [];

    const validLocations = this._filteredFavorites.filter(story => story.lat && story.lon);

    validLocations.forEach((story) => {
      const popupContent = `
        <div style="min-width: 180px;">
          <img src="${story.photoUrl}" alt="${story.name}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 0.375rem; margin-bottom: 0.5rem;">
          <h5 style="margin: 0 0 0.25rem 0;">${story.name}</h5>
          <p style="margin: 0; font-size: 0.875rem;">${story.description.substring(0, 50)}...</p>
        </div>
      `;

      const marker = MapManager.placeMarker(
        this._map,
        story.lat,
        story.lon,
        popupContent
      );
      this._markers.push(marker);
    });

    if (validLocations.length > 0) {
      MapManager.fitMapToMarkers(this._map, validLocations);
    }
  },

  _highlightStory(index) {
    const story = this._filteredFavorites[index];
    if (!story || !story.lat || !story.lon) return;

    MapManager.panToLocation(this._map, story.lat, story.lon, 13);

    const marker = this._markers.find(m => {
      const latLng = m.getLatLng();
      return latLng.lat === story.lat && latLng.lng === story.lon;
    });

    if (marker) {
      this._markers.forEach(m => MapManager.resetMarkerIcon(m));
      MapManager.highlightMarker(marker);
      marker.openPopup();
    }
  },

  async _removeFavorite(id) {
    if (!confirm('Hapus jurnal ini dari favorit?')) {
      return;
    }
    try {
      await idbHelper.removeFavorite(id);
      await this._loadFavorites(); // Muat ulang daftar
      alert('Dihapus dari favorit.');
    } catch (error) {
      alert('Gagal menghapus favorit: ' + error.message);
    }
  },

  _setupEventListeners() {
    const searchInput = document.getElementById('search-favorites');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this._handleSearch(e.target.value);
      });
    }

    const sortSelect = document.getElementById('sort-favorites');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this._handleSort(e.target.value);
      });
    }

    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', async () => {
        await this._clearAllFavorites();
      });
    }
  },

  _handleSearch(query) {
    if (!query || query.trim() === '') {
      this._filteredFavorites = [...this._favorites];
    } else {
      const lowerQuery = query.toLowerCase();
      this._filteredFavorites = this._favorites.filter(story => {
        return story.name.toLowerCase().includes(lowerQuery) ||
               story.description.toLowerCase().includes(lowerQuery);
      });
    }
    document.getElementById('favorites-count').textContent = this._filteredFavorites.length;
    this._renderFavorites(this._filteredFavorites);
    this._addMarkersToMap();
  },

  _handleSort(sortValue) {
    const [sortBy, order] = sortValue.split('-');

    this._filteredFavorites.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'savedAt' || sortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (sortBy === 'name') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    this._renderFavorites(this._filteredFavorites);
  },
  
  async _clearAllFavorites() {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA favorit?')) {
      return;
    }
    try {
      const allFavs = await idbHelper.getAllFavorites();
      for (const fav of allFavs) {
        await idbHelper.removeFavorite(fav.id);
      }
      
      await this._loadFavorites(); // Muat ulang halaman
      alert('Semua favorit telah dihapus.');
    } catch (error) {
      console.error('Gagal menghapus semua favorit:', error);
      alert('Gagal menghapus semua favorit: ' + error.message);
    }
  },
};

export default FavoritesView;