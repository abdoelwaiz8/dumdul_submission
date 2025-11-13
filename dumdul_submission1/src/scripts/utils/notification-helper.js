// File: dumdul_submission1/src/scripts/utils/notification-helper.js

const VAPID_PUBLIC_KEY = 'BN7-r0Svv7CsTi18-OPYtJLVW0bfuZ1x1UtrygczKjennA_qs7OWmgOewcuYSYF8L_eta6JmGvj9jNpaeN7KvF0';

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
        return true;
      }
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
        return;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

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
        return;
      }

      await subscription.unsubscribe();
      alert('Berhasil menonaktifkan notifikasi.');

    } catch (error) {
      console.error('Gagal unsubscribe:', error);
      alert('Gagal menonaktifkan notifikasi.');
    }
  },
};

export default NotificationHelper;