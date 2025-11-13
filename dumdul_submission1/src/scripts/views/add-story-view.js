// File: dumdul_submission1/src/scripts/views/add-story-view.js

import ApiService from '../api/api-service.js';
import MapManager from '../helpers/map-manager.js';
import InputValidator from '../helpers/input-validator.js';
import * as idbHelper from '../utils/idb-helper.js';

const NewStoryView = {
  mapInstance: null,
  currentMarker: null,
  selectedLat: null,
  selectedLon: null,

  async render() {
    return `
      <div class="page-container">
        <div class="new-entry-container">
          <h2 class="text-center mb-3">Buat Jurnal Baru ✏️</h2>
          
          <form id="new-story-form" class="new-entry-form" novalidate>
            <div class="form-field">
              <label for="description">Deskripsi Jurnal *</label>
              <textarea 
                id="description" 
                name="description" 
                class="input-control" 
                rows="5"
                placeholder="Ceritakan pengalaman Anda... (minimal 10 karakter)"
                required
                aria-required="true"
              ></textarea>
            </div>

            <div class="form-field">
              <label for="photo">Unggah Foto *</label>
              <input 
                type="file" 
                id="photo" 
                name="photo" 
                class="input-control" 
                accept="image/jpeg,image/jpg,image/png"
                required
                aria-required="true"
              >
              <small class="text-light">Format: JPG, JPEG, PNG (Maks 5MB)</small>
              
              <div id="image-preview-box" class="upload-preview" style="display: none;">
                <img id="preview-image" alt="Pratinjau Foto" />
              </div>
            </div>

            <div class="form-field">
              <label for="map">Pilih Lokasi * (Klik di peta)</label>
              <div 
                id="add-story-map" 
                class="map-display" 
                style="height: 350px; border-radius: 0.5rem; overflow: hidden; border: 2px solid var(--border-light);"
              ></div>
              <div id="location-coords" class="mt-1">
                Pilih lokasi dengan mengklik peta
              </div>
            </div>

            <div class="form-actions-bar">
              <a href="#/" class="button button-outline">
                Batal
              </a>
              <button type="submit" class="button button-primary">
                Publikasikan Jurnal
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async onPageLoad() {
    if (!ApiService.isUserLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }

    this._setupMap();

    const form = document.getElementById('new-story-form');
    const descriptionInput = document.getElementById('description');
    const photoInput = document.getElementById('photo');

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const validation = InputValidator.checkFile(file);
        if (!validation.isValid) {
          InputValidator.showInputError(photoInput, validation.message);
          return;
        }
        
        InputValidator.clearInputError(photoInput);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('image-preview-box').style.display = 'block';
          document.getElementById('preview-image').src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    descriptionInput.addEventListener('blur', () => {
      const validation = InputValidator.checkDescription(descriptionInput.value);
      if (!validation.isValid) InputValidator.showInputError(descriptionInput, validation.message);
      else InputValidator.clearInputError(descriptionInput);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const description = descriptionInput.value.trim();
      const photo = photoInput.files[0];

      const descValidation = InputValidator.checkDescription(description);
      const photoValidation = InputValidator.checkFile(photo);
      const coordsValidation = InputValidator.checkCoordinates(this.selectedLat, this.selectedLon);

      let isFormValid = true;

      if (!descValidation.isValid) {
        InputValidator.showInputError(descriptionInput, descValidation.message);
        isFormValid = false;
      } else {
        InputValidator.clearInputError(descriptionInput);
      }

      if (!photoValidation.isValid) {
        InputValidator.showInputError(photoInput, photoValidation.message);
        isFormValid = false;
      } else {
        InputValidator.clearInputError(photoInput);
      }

      const coordsDisplay = document.getElementById('location-coords');
      if (!coordsValidation.isValid) {
        coordsDisplay.innerHTML = `<span class="validation-message">${coordsValidation.message}</span>`;
        isFormValid = false;
      }

      if (!isFormValid) {
        alert('Harap perbaiki semua kesalahan pada formulir.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses...';

      const storyData = {
        description: description,
        photo: photo,
        lat: this.selectedLat,
        lon: this.selectedLon,
      };

      if (navigator.onLine) {
        try {
          submitBtn.textContent = 'Mengunggah...';
          await ApiService.createNewStory(
            storyData.description, 
            storyData.photo, 
            storyData.lat, 
            storyData.lon
          );
          alert('Jurnal berhasil dipublikasikan! 🎉');
          window.location.hash = '#/';
        } catch (error) {
          alert(`Gagal memublikasikan jurnal: ${error.message}`);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Publikasikan Jurnal';
        }
      } else {
        try {
          submitBtn.textContent = 'Menyimpan offline...';
          await idbHelper.addStoryToOutbox(storyData);

          if ('SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-new-stories');
            
            alert('Anda sedang offline. Jurnal Anda disimpan dan akan otomatis dipublikasikan saat kembali online. 🚀');
            window.location.hash = '#/';
          } else {
            alert('Mode offline, tetapi Background Sync tidak didukung. Data disimpan, coba lagi nanti.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publikasikan Jurnal';
          }
        } catch (idbError) {
          alert(`Gagal menyimpan jurnal offline: ${idbError.message}`);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Publikasikan Jurnal';
        }
      }
    });
  },

  _setupMap() {
    this.mapInstance = MapManager.createMap('add-story-map', [-2.5489, 118.0149], 5);
    MapManager.addMapClickListener(this.mapInstance, (lat, lon) => {
      this._onMapClick(lat, lon);
    });
  },

  _onMapClick(lat, lon) {
    if (this.currentMarker) {
      this.currentMarker.remove();
    }

    this.currentMarker = MapManager.placeMarker(this.mapInstance, lat, lon, 'Lokasi Dipilih');
    this.currentMarker.openPopup();

    this.selectedLat = lat;
    this.selectedLon = lon;

    const coordsDisplay = document.getElementById('location-coords');
    coordsDisplay.innerHTML = `
      <span style="color: var(--brand-dark); font-weight: 500;">
        ✓ Lokasi dipilih: ${lat.toFixed(6)}, ${lon.toFixed(6)}
      </span>
    `;

    MapManager.panToLocation(this.mapInstance, lat, lon, 13);
  },
};

export default NewStoryView;