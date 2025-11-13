const BASE_URL = 'https://story-api.dicoding.dev/v1';


const AUTH_TOKEN_KEY = 'authToken';
const USER_ID_KEY = 'userId';
const USER_NAME_KEY = 'displayName';

class ApiService {
  static async register(name, email, password) {
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registrasi gagal');
      }
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async login(email, password) {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login gagal');
      }

    
      if (data.loginResult && data.loginResult.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.loginResult.token);
        localStorage.setItem(USER_ID_KEY, data.loginResult.userId);
        localStorage.setItem(USER_NAME_KEY, data.loginResult.name);
      }
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static logoutUser() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
  }

  static isUserLoggedIn() {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  }

  static getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  static getUserName() {
    return localStorage.getItem(USER_NAME_KEY);
  }

  static async fetchAllStories() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Anda harus login terlebih dahulu');
      }

      const response = await fetch(`${BASE_URL}/stories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil cerita');
      }
      return data.listStory || [];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async createNewStory(description, photo, lat, lon) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Anda harus login terlebih dahulu');
      }

      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', photo);
      formData.append('lat', lat);
      formData.append('lon', lon);

      const response = await fetch(`${BASE_URL}/stories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambah cerita');
      }
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async fetchStoryById(id) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Anda harus login terlebih dahulu');
      }

      const response = await fetch(`${BASE_URL}/stories/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil detail cerita');
      }
      return data.story;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default ApiService;