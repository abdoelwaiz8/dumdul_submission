import HomeView from './views/home-view.js';
import LoginView from './views/login-view.js';
import RegisterView from './views/register-view.js';
import NewStoryView from './views/add-story-view.js';

const appRoutes = {
  '/': HomeView,
  '/login': LoginView,
  '/register': RegisterView,
  '/add-story': NewStoryView,
};

export default appRoutes;