import { openDB } from 'idb';

const DB_NAME = 'journey-journal-db';
const DB_VERSION = 2;

// Definisikan Object Store
const STORY_STORE_NAME = 'stories';
const OUTBOX_STORE_NAME = 'stories-outbox';
const AUTH_STORE_NAME = 'auth-token';
const FAVORITE_STORE_NAME = 'favorite-stories'; 

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Toko untuk cache data cerita dari API (Kriteria 4 Basic - Read)
    if (!db.objectStoreNames.contains(STORY_STORE_NAME)) {
      db.createObjectStore(STORY_STORE_NAME, { keyPath: 'id' });
    }
    
    // Toko untuk cerita yang dibuat offline (Kriteria 4 Advanced)
    if (!db.objectStoreNames.contains(OUTBOX_STORE_NAME)) {
      // Gunakan autoIncrement agar bisa menyimpan beberapa item
      db.createObjectStore(OUTBOX_STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
    
    // Toko untuk menyimpan auth token agar bisa diakses Service Worker
    if (!db.objectStoreNames.contains(AUTH_STORE_NAME)) {
      db.createObjectStore(AUTH_STORE_NAME, { keyPath: 'key' });
    }

    // TAMBAHKAN OBJECT STORE BARU UNTUK FAVORIT
    if (!db.objectStoreNames.contains(FAVORITE_STORE_NAME)) {
      const store = db.createObjectStore(FAVORITE_STORE_NAME, { 
        keyPath: 'id' 
      });
      store.createIndex('name', 'name', { unique: false });
      store.createIndex('createdAt', 'createdAt', { unique: false });
      store.createIndex('savedAt', 'savedAt', { unique: false });
    }
  },
});

// --- API Stories Cache (Kriteria 4 Basic - Create, Read, Delete) ---

export async function getAllStories() {
  const db = await dbPromise;
  return db.getAll(STORY_STORE_NAME);
}

export async function putStory(story) {
  const db = await dbPromise;
  return db.put(STORY_STORE_NAME, story);
}

export async function putAllStories(stories) {
  const db = await dbPromise;
  const tx = db.transaction(STORY_STORE_NAME, 'readwrite');
  await Promise.all(stories.map(story => tx.store.put(story)));
  return tx.done;
}

export async function deleteStory(id) {
  const db = await dbPromise;
  return db.delete(STORY_STORE_NAME, id);
}

// --- Offline Sync Outbox (Kriteria 4 Advanced) ---

export async function addStoryToOutbox(story) {
  const db = await dbPromise;
  // Hapus 'id' jika ada, biarkan autoIncrement
  delete story.id; 
  return db.add(OUTBOX_STORE_NAME, story);
}

export async function getAllStoriesFromOutbox() {
  const db = await dbPromise;
  return db.getAll(OUTBOX_STORE_NAME);
}

export async function deleteStoryFromOutbox(id) {
  const db = await dbPromise;
  return db.delete(OUTBOX_STORE_NAME, id);
}

// --- Auth Token for Service Worker ---

export async function saveAuthToken(token) {
  const db = await dbPromise;
  return db.put(AUTH_STORE_NAME, { key: 'authToken', value: token });
}

export async function getAuthToken() {
  const db = await dbPromise;
  const tokenData = await db.get(AUTH_STORE_NAME, 'authToken');
  return tokenData ? tokenData.value : null;
}

export async function deleteAuthToken() {
  const db = await dbPromise;
  return db.delete(AUTH_STORE_NAME, 'authToken');
}


export async function addFavorite(story) {
  const db = await dbPromise;
  const storyToSave = {
    ...story,
    savedAt: new Date().toISOString()
  };
  return db.add(FAVORITE_STORE_NAME, storyToSave);
}

export async function removeFavorite(id) {
  const db = await dbPromise;
  return db.delete(FAVORITE_STORE_NAME, id);
}

export async function getFavorite(id) {
  const db = await dbPromise;
  return db.get(FAVORITE_STORE_NAME, id);
}

export async function getAllFavorites() {
  const db = await dbPromise;
  return db.getAll(FAVORITE_STORE_NAME);
}

export async function isFavorite(id) {
  const story = await getFavorite(id);
  return !!story;
}