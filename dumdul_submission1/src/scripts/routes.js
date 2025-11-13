// File: abdoelwaiz8/dumdul_submission/src/scripts/routes.js

import HomeView from './views/home-view.js';
import LoginView from './views/login-view.js';
import RegisterView from './views/register-view.js';
import NewStoryView from './views/add-story-view.js';
import FavoritesView from './views/favorites-view.js'; // <-- TAMBAHKAN INI

const appRoutes = {
  '/': HomeView,
  '/login': LoginView,
  '/register': RegisterView,
  '/add-story': NewStoryView,
  '/favorites': FavoritesView, // <-- TAMBAHKAN INI
};

export default appRoutes;