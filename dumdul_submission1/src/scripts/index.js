import 'regenerator-runtime';
import '../styles/main.css';
import '../styles/responsive.css';
import Application from './app.js';
import ApiService from './api/api-service.js';
import NotificationHelper from './utils/notification-helper.js'; 
import * as idbHelper from './utils/idb-helper.js';

const app = new Application({
  appRoot: document.querySelector('#app-root'),
});


function updateAppShell() {
  _setupPushNotificationButton();
  refreshAuthStatus();
}

window.addEventListener('hashchange', () => {
  updateAppShell(); 
  app.displayPage();
});

window.addEventListener('load', () => {
  _registerServiceWorker();
  updateAppShell(); 
  app.displayPage();
});


async function _registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      
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
  
  if (!('PushManager' in window)) {
    if (pushButton) pushButton.style.display = 'none';
    return;
  }
  
  
  if (!pushButton) return;

  
  const newPushButton = pushButton.cloneNode(true);
  pushButton.parentNode.replaceChild(newPushButton, pushButton);

  newPushButton.addEventListener('click', async () => {
    if (Notification.permission === 'default') {
      await NotificationHelper.requestPermission();
    }
    
    const isSubscribed = await NotificationHelper.isSubscribed();
    newPushButton.disabled = true;
    if (isSubscribed) {
      await NotificationHelper.unsubscribe();
    } else {
      await NotificationHelper.subscribe();
    }
    await _updatePushButtonStatus();
    newPushButton.disabled = false;
  });

  await _updatePushButtonStatus();
}

async function _updatePushButtonStatus() {
  const pushButton = document.getElementById('push-subscribe-toggle');
  if (!pushButton) return; 
  
  const isSubscribed = await NotificationHelper.isSubscribed();
  pushButton.textContent = isSubscribed ? 'Nonaktifkan Notifikasi' : 'Aktifkan Notifikasi';
}

function refreshAuthStatus() {
  const authLink = document.getElementById('nav-auth-link');
  if (!authLink) return; 
  
  if (ApiService.isUserLoggedIn()) {
    authLink.textContent = 'Keluar';
    authLink.href = '#/'; 
    
    
    const newAuthLink = authLink.cloneNode(true);
    newAuthLink.textContent = 'Keluar';
    authLink.parentNode.replaceChild(newAuthLink, authLink);

    newAuthLink.onclick = (e) => {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        ApiService.logoutUser();
        idbHelper.deleteAuthToken();
        
        
        refreshAuthStatus(); 
        window.location.hash = '#/login';
      }
    };
  } else {
    authLink.textContent = 'Masuk';
    authLink.href = '#/login';
    

    const newAuthLink = authLink.cloneNode(true);
    newAuthLink.textContent = 'Masuk';
    newAuthLink.onclick = null;
    authLink.parentNode.replaceChild(newAuthLink, authLink);
  }
}

window.refreshAuthStatus = refreshAuthStatus;