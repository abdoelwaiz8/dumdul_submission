// File: dumdul_submission1/src/scripts/index.js

import 'regenerator-runtime';
import '../styles/main.css';
import '../styles/responsive.css';
import Application from './app.js';
import ApiService from './api/api-service.js';
// --- TAMBAHKAN IMPOR DI BAWAH ---
import NotificationHelper from './utils/notification-helper.js'; 
import * as idbHelper from './utils/idb-helper.js';
// ---------------------------------

const app = new Application({
  appRoot: document.querySelector('#app-root'),
});

window.addEventListener('hashchange', () => {
  app.displayPage();
});

window.addEventListener('load', () => {
  _registerServiceWorker(); // PANGGIL FUNGSI REGISTRASI SW
  _setupPushNotificationButton(); // PANGGIL FUNGSI TOMBOL PUSH
  
  refreshAuthStatus();
  app.displayPage();

  if (!document.startViewTransition) {
    console.log('API View Transitions tidak didukung.');
  }
});

// --- TAMBAHKAN FUNGSI DI BAWAH ---

async function _registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Kirim token ke SW jika user login (penting untuk sync)
      if (ApiService.isUserLoggedIn()) {
        idbHelper.saveAuthToken(ApiService.getAuthToken());
      }
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

async function _setupPushNotificationButton() {
  const pushButton = document.getElementById('push-subscribe-toggle');
  
  // Sembunyikan tombol jika push tidak didukung
  if (!('PushManager' in window)) {
    pushButton.style.display = 'none';
    return;
  }

  pushButton.addEventListener('click', async () => {
    if (Notification.permission === 'default') {
      await NotificationHelper.requestPermission();
    }
    
    const isSubscribed = await NotificationHelper.isSubscribed();
    pushButton.disabled = true;
    if (isSubscribed) {
      await NotificationHelper.unsubscribe();
    } else {
      await NotificationHelper.subscribe();
    }
    await _updatePushButtonStatus(); // Perbarui status tombol
    pushButton.disabled = false;
  });

  // Set status tombol awal
  await _updatePushButtonStatus();
}

async function _updatePushButtonStatus() {
  const pushButton = document.getElementById('push-subscribe-toggle');
  const isSubscribed = await NotificationHelper.isSubscribed();
  pushButton.textContent = isSubscribed ? 'Nonaktifkan Notifikasi' : 'Aktifkan Notifikasi';
}

// ---------------------------------


function refreshAuthStatus() {
  const authLink = document.getElementById('nav-auth-link');
  
  if (ApiService.isUserLoggedIn()) {
    authLink.textContent = 'Keluar';
    authLink.href = '#/'; 
    authLink.onclick = (e) => {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        ApiService.logoutUser();
        
        idbHelper.deleteAuthToken(); // <-- HAPUS TOKEN DARI IDB SAAT LOGOUT
        
        authLink.textContent = 'Masuk';
        authLink.href = '#/login';
        authLink.onclick = null; 
        window.location.hash = '#/login';
      }
    };
  } else {
    authLink.textContent = 'Masuk';
    authLink.href = '#/login';
    authLink.onclick = null; 
  }
}

window.refreshAuthStatus = refreshAuthStatus;