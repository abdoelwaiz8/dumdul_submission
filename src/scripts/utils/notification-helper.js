// File: dumdul_submission1/src/scripts/utils/notification-helper.js

// TODO: Ganti dengan VAPID Public Key Anda dari API Dicoding
const VAPID_PUBLIC_KEY = 'MASUKKAN_VAPID_PUBLIC_KEY_ANDA_DI_SINI';

// Fungsi konverter
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationHelper = {
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Izin notifikasi diberikan.');
        return true;
      }
      console.log('Izin notifikasi ditolak.');
      return false;
    } catch (error) {
      console.error('Gagal meminta izin notifikasi:', error);
      return false;
    }
  },

  async isSubscribed() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Gagal mengecek subscription:', error);
      return false;
    }
  },

  async subscribe() {
    if (Notification.permission !== 'granted') {
      alert('Anda harus mengizinkan notifikasi terlebih dahulu.');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('Pengguna sudah subscribe.');
        return;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('Berhasil subscribe:', subscription.toJSON());
      // TODO: Kirim subscription ke server Anda (jika diperlukan oleh backend)
      alert('Berhasil mengaktifkan notifikasi!');

    } catch (error) {
      console.error('Gagal subscribe:', error);
      alert('Gagal mengaktifkan notifikasi. Pastikan VAPID key Anda benar.');
    }
  },

  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('Pengguna belum subscribe.');
        return;
      }

      await subscription.unsubscribe();
      console.log('Berhasil unsubscribe.');
      // TODO: Kirim info unsubscribe ke server Anda (jika diperlukan)
      alert('Berhasil menonaktifkan notifikasi.');

    } catch (error) {
      console.error('Gagal unsubscribe:', error);
      alert('Gagal menonaktifkan notifikasi.');
    }
  },
};

export default NotificationHelper;