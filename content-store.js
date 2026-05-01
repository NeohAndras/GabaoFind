// content-store.js
import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export const CONTENT_DOC = doc(db, 'site_content', 'main');
const LOCAL_CACHE_KEY = 'gabaoindex:site_content:main';

export function normalizeContent(stored = {}) {
  return {
    listings: Array.isArray(stored.listings) ? stored.listings : [],
    categories: Array.isArray(stored.categories) ? stored.categories : [],
    hero_slides: Array.isArray(stored.hero_slides) ? stored.hero_slides : [],
    brand: stored.brand && typeof stored.brand === 'object' ? stored.brand : {},
    media: stored.media && typeof stored.media === 'object' ? stored.media : {}
  };
}

function readLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return null;
    return normalizeContent(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalCache(data) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({ ...data, cachedAt: Date.now() }));
  } catch {
    // Ignore cache write failures
  }
}

async function fetchBundledData() {
  const response = await fetch('/data.json', { cache: 'no-store' });
  if (!response.ok) return null;
  return normalizeContent(await response.json());
}

async function fetchApiData() {
  const response = await fetch('/api/data', { cache: 'no-store' });
  if (!response.ok) return null;
  return normalizeContent(await response.json());
}

async function fetchFirestoreData() {
  const snapshot = await getDoc(CONTENT_DOC);
  return snapshot.exists() ? normalizeContent(snapshot.data()) : null;
}

async function fetchBestOnlineContent() {
  const sources = [fetchApiData, fetchFirestoreData, fetchBundledData];
  let lastError = null;

  for (const source of sources) {
    try {
      const data = await source();
      if (data) return data;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return null;
}

export async function loadContent() {
  const cached = readLocalCache();

  // If we already have something usable, return it immediately for fast paint.
  if (cached && (cached.listings.length || cached.categories.length || cached.hero_slides.length)) {
    fetchBestOnlineContent()
      .then((fresh) => {
        if (fresh) {
          writeLocalCache(fresh);
        }
      })
      .catch(() => {});
    return cached;
  }

  // No cache available, get the best online source first.
  const online = await fetchBestOnlineContent();
  if (online) {
    writeLocalCache(online);
    return online;
  }

  throw new Error('Impossible de charger les données');
}

export async function saveContent(data) {
  const normalized = normalizeContent(data);
  writeLocalCache(normalized);
  await setDoc(CONTENT_DOC, { ...normalized, updatedAt: serverTimestamp() }, { merge: true });
}
