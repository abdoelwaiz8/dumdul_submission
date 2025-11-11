// File: dumdul_submission1/src/sw.js

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { skipWaiting, clientsClaim } from 'workbox-core';
import * as idbHelper from './scripts/utils/idb-helper.js';

// 1. Mengaktifkan service worker baru sesegera mungkin
skipWaiting();
clientsClaim();

// 2. Precache App Shell (dikelola otomatis oleh Workbox) - (Kriteria 3 Basic)
// Variabel self.__WB_MANIFEST akan disuntikkan oleh Workbox saat build
precacheAndRoute(self.__WB_MANIFEST);

// 3. Runtime Caching (Kriteria 3 Advanced)

// Cache untuk aset eksternal (Leaflet, Map Tiles, Fonts)
registerRoute(
  ({ url }) => url.origin === 'https://unpkg.com' ||
               url.origin.includes('tile.openstreetmap.org') ||
               url.origin.includes('github.com') || // Untuk ikon marker
               url.origin === 'https://cdnjs.cloudflare.com', // Untuk shadow marker
  new StaleWhileRevalidate({
    cacheName: 'external-assets-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 hari
    ],
  })
);

// Cache untuk API Stories (Network First agar data selalu baru jika online)
registerRoute(
  ({ url }) => url.href.startsWith('https://story-api.dicoding.dev/v1/stories'),
  new NetworkFirst({
    cacheName: 'api-stories-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }), // 1 hari
    ],
  })
);

// Cache untuk gambar dari API (Stale While Revalidate)
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'api-images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 hari
    ],
  })
);

// --- Kriteria 2: Push Notification Logic ---

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'Push Notifikasi',
    options: {
      body: 'Ada pesan baru untukmu!',
      icon: 'images/icon-192x192.png',
      badge: 'images/icon-192x192.png',
      data: {
        url: '/index.html', // URL default
      },
    },
  };

  // Coba parse data dari push (Kriteria 2 Skilled)
  if (event.data) {
    try {
      const dataText = event.data.text();
      const parsedData = JSON.parse(dataText);
      
      notificationData.title = parsedData.title || 'Jurnal Baru Ditambahkan';
      notificationData.options.body = parsedData.body || 'Seseorang menambahkan jurnal baru!';
      
      // (Advanced) Siapkan data untuk navigasi
      // API Dicoding tidak mengirim ID, jadi kita arahkan ke home.
      notificationData.options.data.url = '/index.html'; 

    } catch (e) {
      console.error('Gagal parse push data:', e);
      notificationData.options.body = event.data.text();
    }
  }

  // (Advanced) Tambahkan action button
  notificationData.options.actions = [
    { action: 'explore-action', title: 'Lihat Sekarang' }
  ];

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData.options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  
  notification.close(); // Tutup notifikasi

  // (Advanced) Navigasi ke URL dari data notifikasi
  if (action === 'explore-action' || !action) {
    const urlToOpen = notification.data.url || '/index.html';
    const promiseChain = clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        // Cek jika URL sama (abaikan hash)
        if (windowClient.url.split('#')[0] === self.location.origin + urlToOpen) {
          matchingClient = windowClient;
          break;
        }
      }

      if (matchingClient) {
        return matchingClient.focus();
      } else {
        return clients.openWindow(urlToOpen);
      }
    });
    event.waitUntil(promiseChain);
  }
});


// --- Kriteria 4: IndexedDB & Background Sync Logic ---

self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sync event triggered!', event.tag);

  if (event.tag === 'sync-new-stories') {
    event.waitUntil(syncNewStories());
  }
});

async function syncNewStories() {
  console.log('Service Worker: Menjalankan sinkronisasi cerita baru...');
  try {
    const storiesToSync = await idbHelper.getAllStoriesFromOutbox();
    const token = await idbHelper.getAuthToken(); // Ambil token dari IDB
        
    if (!token) {
      console.error('Sync gagal: Tidak ada token auth di IDB.');
      return; 
    }
    
    for (const story of storiesToSync) {
      console.log('Mencoba mengirim cerita:', story.id);
      try {
        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', story.photo); // File object tersimpan di IDB
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);

        const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Gagal sinkronisasi');
        }

        // Jika berhasil, hapus dari outbox
        console.log('Sync berhasil untuk story:', story.id);
        await idbHelper.deleteStoryFromOutbox(story.id);

      } catch (err) {
        console.error(`Gagal mengirim story ${story.id}, akan dicoba lagi nanti:`, err);
        // Jangan hentikan loop, biarkan sync mencoba lagi nanti
      }
    }
    
    console.log('Sinkronisasi selesai.');
    // Tampilkan notifikasi bahwa sync berhasil
    self.registration.showNotification('Sinkronisasi Berhasil', {
      body: 'Jurnal offline Anda telah berhasil dipublikasikan!',
      icon: 'images/icon-192x192.png',
    });

  } catch (err) {
    console.error('Gagal mengambil data dari outbox:', err);
  }
}