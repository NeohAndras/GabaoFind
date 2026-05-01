 // ============================================================
 // GABAOINDEX — app.js
 // ============================================================

// --- I18N ---
const i18n = { lang: 'fr' };
function t(fr, en) { return i18n.lang === 'fr' ? fr : en; }

import { loadContent, normalizeContent } from './content-store.js';
import { auth, db } from './firebase-config.js';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { collection, doc, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// --- DATA ---
let HERO_SLIDES = [];
let CATEGORIES = [];
let LISTINGS = [];
let BRAND = {
  logoUrl: '',
  logoText: 'GabaoIndex',
  logoIcon: '🌿',
  taglineFr: 'Le répertoire de référence au Gabon',
  taglineEn: "Gabon's go-to directory"
};


const ADS = [
  { 
    id: 'ad1', 
    name: 'Boostez votre visibilité', 
    desc: 'Faites la promotion de votre établissement sur GabaoIndex et touchez des milliers de visiteurs.', 
    emoji: '🚀',
    link: 'https://gabaoindex.ga/advertise',
    cta: 'En savoir plus'
  },
  { 
    id: 'ad2', 
    name: 'Safari d\'Exception', 
    desc: 'Découvrez les parcs nationaux avec nos guides certifiés. Offre spéciale -15% ce mois-ci.', 
    emoji: '🐘',
    link: 'https://gabaoindex.ga/safari-promo',
    cta: 'Réserver'
  },
  { 
    id: 'ad3', 
    name: 'Appartements Akanda', 
    desc: 'Vivez dans le nouveau quartier chic de Libreville. Résidences sécurisées avec piscine.', 
    emoji: '🏢',
    link: 'https://gabaoindex.ga/real-estate',
    cta: 'Voir les plans'
  }
];



// --- STATE ---
let activeCategory = 'all';
let searchQuery = '';
let activeCity = '';
let displayLimit = 20;
const ITEMS_PER_PAGE = 20;
let sortBy = 'custom'; // custom, featured, city, recent
let sortOrder = 'asc';
let currentUser = null;
let authInitialized = false;
let reviewsByListingId = {};
let reviewsLoading = false;
const googleProvider = new GoogleAuthProvider();

function getCatMeta(id) { return CATEGORIES.find(c => c.id === id) || { icon: '📍', label: { fr: id, en: id } }; }

// --- FILTER LOGIC ---
function getFiltered() {
  let result = LISTINGS.filter(l => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.desc.toLowerCase().includes(q) || l.city.toLowerCase().includes(q);
    const matchCat  = activeCategory === 'all' || l.cat === activeCategory;
    const matchCity = !activeCity || l.city === activeCity;
    return matchSearch && matchCat && matchCity;
  });

  // Apply sorting
  if (sortBy === 'featured') {
    result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  } else if (sortBy === 'city') {
    result.sort((a, b) => a.city.localeCompare(b.city));
  } else if (sortBy === 'recent') {
    result.sort((a, b) => (b.id || 0) - (a.id || 0));
  } else if (sortBy === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // custom order
    result.sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));
  }

  return result;
}

function renderBrand() {
  const logoText = BRAND.logoText || 'GabaoIndex';
  const logoIcon = BRAND.logoIcon || '🌿';
  const logoHtml = BRAND.logoUrl
    ? `<img src="${BRAND.logoUrl}" alt="${logoText}" style="width:28px;height:28px;object-fit:contain;border-radius:6px;" />`
    : `<span class="logo-icon">${logoIcon}</span>`;

  document.querySelectorAll('.logo').forEach(el => {
    el.innerHTML = `${logoHtml}<span class="logo-text">${logoText.replace('Index', '<strong>Index</strong>')}</span>`;
  });

  const footerLogo = document.querySelector('.footer-logo');
  if (footerLogo) {
    const footerTagline = t(BRAND.taglineFr || 'Le répertoire de référence au Gabon', BRAND.taglineEn || "Gabon's go-to directory");
    footerLogo.innerHTML = `${logoHtml}<span class="logo-text">${logoText.replace('Index', '<strong>Index</strong>')}</span><p class="footer-tagline">${footerTagline}</p>`;
  }
}

// --- RENDER CATEGORIES ---
function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  const counts = {};
  LISTINGS.forEach((listing) => {
    counts[listing.cat] = (counts[listing.cat] || 0) + 1;
  });

  const visibleCategories = CATEGORIES.filter((category) => (counts[category.id] || 0) > 0);
  const allCount = LISTINGS.length;

  grid.innerHTML = [
    `
    <div class="cat-card ${activeCategory === 'all' ? 'active' : ''}" data-cat="all" id="cat-all">
      <span class="cat-icon">✨</span>
      <span class="cat-label">${i18n.lang === 'fr' ? 'Tous' : 'All'}</span>
      <span class="cat-count">${allCount} ${i18n.lang === 'fr' ? 'lieux' : 'places'}</span>
    </div>
    `,
    ...visibleCategories.map((category) => `
      <div class="cat-card ${activeCategory === category.id ? 'active' : ''}" data-cat="${category.id}" id="cat-${category.id}">
        <span class="cat-icon">${category.icon}</span>
        <span class="cat-label">${category.label[i18n.lang]}</span>
        <span class="cat-count">${counts[category.id] || 0} ${i18n.lang === 'fr' ? 'lieux' : 'places'}</span>
      </div>
    `)
  ].join('');

  grid.querySelectorAll('.cat-card').forEach((el) => {
    el.addEventListener('click', () => {
      activeCategory = el.dataset.cat;
      displayLimit = ITEMS_PER_PAGE;
      renderAll();
    });
  });
}

// --- RENDER ALL ---
function renderAll() {
  renderBrand();
  renderCategories();
  renderListings();
  renderAuthState();
}


// --- RENDER LISTINGS ---
function renderListings() {
  const grid = document.getElementById('listingsGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('resultsCount');
  const filtered = getFiltered();
  count.textContent = `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`;
  if (!filtered.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  
  const totalAvailable = filtered.length;
  const currentShow = filtered.slice(0, displayLimit);


  
  // Interleave ads every 10 items
  const withAds = [];
  currentShow.forEach((l, i) => {
    withAds.push(l);
    if ((i + 1) % 10 === 0) {
      const ad = ADS[Math.floor(i / 10) % ADS.length];
      withAds.push({ ...ad, isAd: true });
    }
  });

  grid.innerHTML = withAds.map((l, i) => {
    if (l.isAd) {
      return `
      <div class="listing-card ad-card" style="animation-delay:${i * 0.04}s">
        <span class="ad-badge">Sponsorisé</span>
        <div class="card-img">${l.img ? `<img src="${l.img}" alt="${l.name}" loading="lazy">` : l.emoji}</div>
        <div class="card-body">
          <div class="card-meta">
            <span class="card-cat">📢 Annonce</span>
          </div>
          <div class="card-title">${l.name}</div>
          <div class="card-desc">${l.desc}</div>
          <a href="${l.link}" target="_blank" class="ad-cta">${l.cta}</a>
        </div>
      </div>`;
    }
    const cat = getCatMeta(l.cat);
    return `
    <div class="listing-card" data-id="${l.id}" style="animation-delay:${i * 0.04}s" tabindex="0" role="button" aria-label="${l.name}">
      <div class="card-img">
        ${l.emoji}
        ${l.featured ? '<span class="card-badge">⭐ Recommandé</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-cat">${cat.icon} ${cat.label[i18n.lang]}</span>
          <span class="card-city">· ${l.city}</span>
        </div>
        <div class="card-title">${l.name}</div>
        <div class="card-desc">${l.desc}</div>
        <div class="card-footer">
          ${l.phone ? `<span class="card-phone">📞 ${l.phone}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  
  // Load More Button
  const existingBtn = document.getElementById('loadMoreContainer');
  if (existingBtn) existingBtn.remove();

  if (displayLimit < filtered.length) {
    const container = document.createElement('div');
    container.id = 'loadMoreContainer';
    container.className = 'load-more-container';
    container.innerHTML = `
      <button class="load-more-btn" id="loadMoreBtn">
        ${i18n.lang === 'fr' ? 'Voir plus' : 'Load More'}
      </button>
    `;
    grid.after(container);
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
      displayLimit += ITEMS_PER_PAGE;
      renderListings();
    });
  }

  grid.querySelectorAll('.listing-card').forEach(el => {
    if (!el.classList.contains('ad-card')) {
      el.addEventListener('click', () => openModal(Number(el.dataset.id)));
      el.addEventListener('keydown', e => e.key === 'Enter' && openModal(Number(el.dataset.id)));
    }
  });
  updateMapMarkers(filtered);
}

 // --- MODAL ---
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function formatReviewDate(timestamp) {
  if (!timestamp) return '';
  const value = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat(i18n.lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium' }).format(value);
}

function reviewCardHtml(review) {
  const stars = '★'.repeat(review.rating || 0).padEnd(5, '☆');
  const author = review.authorName || (i18n.lang === 'fr' ? 'Utilisateur' : 'User');
  const dateLabel = formatReviewDate(review.createdAt);
  return `
    <div class="review-item" style="padding:12px 0; border-top:1px solid var(--border);">
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:6px;">
        <strong style="color:var(--text-primary);">${escapeHtml(author)}</strong>
        <span style="color:var(--accent); font-size:.9rem; white-space:nowrap;">${stars}</span>
      </div>
      <div style="color:var(--text-muted); font-size:.9rem; line-height:1.6;">${escapeHtml(review.comment)}</div>
      ${dateLabel ? `<div style="margin-top:6px; color:var(--text-muted); font-size:.78rem;">${escapeHtml(dateLabel)}</div>` : ''}
    </div>
  `;
}

async function loadReviews(listingId) {
  try {
    const q = query(collection(db, 'reviews'), where('listingId', '==', listingId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    reviewsByListingId[listingId] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Failed to load reviews', error);
    reviewsByListingId[listingId] = [];
  }
}

async function submitReview(listingId, form) {
  if (!currentUser) {
    alert(i18n.lang === 'fr' ? 'Connectez-vous pour publier un avis.' : 'Log in to post a review.');
    return;
  }

  const rating = Number(form.rating.value);
  const comment = form.comment.value.trim();
  if (!rating || rating < 1 || rating > 5 || comment.length < 10) {
    alert(i18n.lang === 'fr' ? 'Ajoutez une note et un commentaire d’au moins 10 caractères.' : 'Add a rating and a comment with at least 10 characters.');
    return;
  }

  await addDoc(collection(db, 'reviews'), {
    listingId,
    rating,
    comment,
    authorUid: currentUser.uid,
    authorName: currentUser.displayName || currentUser.email || 'User',
    authorEmail: currentUser.email || '',
    createdAt: serverTimestamp()
  });

  form.reset();
  await loadReviews(listingId);
  openModal(listingId);
}

function renderReviewSection(listingId) {
  const listingReviews = reviewsByListingId[listingId] || [];
  const reviewsHtml = listingReviews.length
    ? listingReviews.map(reviewCardHtml).join('')
    : `<div style="color:var(--text-muted); padding:12px 0;">${i18n.lang === 'fr' ? 'Aucun avis pour le moment.' : 'No reviews yet.'}</div>`;

  const loginPrompt = currentUser
    ? `<div style="font-size:.88rem; color:var(--text-secondary); margin-bottom:8px;">${escapeHtml(currentUser.displayName || currentUser.email || 'Connected user')}</div>`
    : `<button type="button" class="btn-primary" id="reviewLoginBtn" style="width:100%; margin-top:10px;">${i18n.lang === 'fr' ? 'Se connecter pour commenter' : 'Log in to review'}</button>`;

  const formHtml = currentUser ? `
    <form id="reviewForm" style="display:grid; gap:12px; margin-top:14px;">
      <label style="display:grid; gap:8px; color:var(--text-secondary); font-size:.9rem;">
        ${i18n.lang === 'fr' ? 'Note' : 'Rating'}
        <select name="rating" required style="padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--bg-card); color:var(--text-primary);">
          <option value="">${i18n.lang === 'fr' ? 'Choisir' : 'Choose'}</option>
          <option value="5">5 ★</option>
          <option value="4">4 ★</option>
          <option value="3">3 ★</option>
          <option value="2">2 ★</option>
          <option value="1">1 ★</option>
        </select>
      </label>
      <textarea name="comment" required minlength="10" placeholder="${i18n.lang === 'fr' ? 'Écrivez votre avis après l’itinéraire...' : 'Write your review after the directions...'}" style="min-height:110px; padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--bg-card); color:var(--text-primary);"></textarea>
      <button type="submit" class="btn-primary" style="padding:12px 16px; border:none; border-radius:10px; font-weight:700;">${i18n.lang === 'fr' ? 'Publier l’avis' : 'Post review'}</button>
    </form>
  ` : `<div style="color:var(--text-muted); font-size:.88rem; margin-top:12px;">${i18n.lang === 'fr' ? 'Les avis sont publics. Connectez-vous pour commenter.' : 'Reviews are public. Log in to comment.'}</div>`;

  return `
    <div class="modal-review-section" style="margin-top:22px; padding-top:18px; border-top:1px solid var(--border);">
      <div style="display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:12px; flex-wrap:wrap;">
        <h3 style="margin:0; color:var(--text-primary);">${i18n.lang === 'fr' ? 'Avis & commentaires' : 'Reviews & comments'}</h3>
        <span style="color:var(--text-muted); font-size:.9rem;">${listingReviews.length} ${i18n.lang === 'fr' ? 'avis' : 'reviews'}</span>
      </div>
      ${loginPrompt}
      ${formHtml}
      <div style="margin-top:14px;">
        ${reviewsHtml}
      </div>
    </div>
  `;
}

function openModal(id) {
  const l = LISTINGS.find(x => x.id === id);
  if (!l) return;
  const cat = getCatMeta(l.cat);
  document.getElementById('modalContent').innerHTML = `
    <span class="modal-emoji">${l.emoji}</span>
    <div class="modal-title">${l.name}</div>
    <div class="modal-cat">${cat.icon} ${cat.label[i18n.lang]} · ${l.city}</div>
    <div class="modal-stars"></div>
    <div class="modal-desc">${l.desc}</div>
    <div class="modal-details">
      <div class="modal-detail"><span class="modal-detail-icon">📍</span>${l.address}</div>
      ${l.phone ? `<div class="modal-detail"><span class="modal-detail-icon">📞</span><a href="tel:${l.phone}" style="color:var(--brand)">${l.phone}</a></div>` : ''}
      ${l.hours ? `
      <div class="modal-hours">
        <div class="modal-hours-title">🕒 ${i18n.lang === 'fr' ? 'Horaires d\'ouverture' : 'Opening Hours'}</div>
        <div>${l.hours}</div>
      </div>` : ''}
      <div class="modal-actions" style="margin-top: 20px;">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}" target="_blank" class="btn-primary" style="text-decoration:none; display:inline-block; width:100%; text-align:center;">
          🚗 ${i18n.lang === 'fr' ? 'Itinéraire / Planifier le trajet' : 'Get Directions / Plan Trip'}
        </a>
      </div>
    </div>
    ${renderReviewSection(l.id)}
  `;
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitReview(l.id, reviewForm);
    });
  }
  const reviewLoginBtn = document.getElementById('reviewLoginBtn');
  if (reviewLoginBtn) {
    reviewLoginBtn.addEventListener('click', handleLoginClick);
  }
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});



// --- MAP ---
let map, markerLayer;
function initMap() {
  map = L.map('map').setView([-0.8, 11.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  updateMapMarkers(LISTINGS);
}

function updateMapMarkers(items) {
  if (!markerLayer) return;
  markerLayer.clearLayers();
  const icon = L.divIcon({ 
    className: '', 
    html: '<div style="font-size:1.5rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">📍</div>', 
    iconSize: [30, 30], 
    iconAnchor: [15, 30] 
  });
  items.filter(l => l.lat).forEach(l => {
    L.marker([l.lat, l.lng], { icon })
      .addTo(markerLayer)
      .bindPopup(`
        <strong>${l.name}</strong><br/>
        ${l.city}<br/>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}" target="_blank" style="color:var(--brand); text-decoration:none; font-weight:600; display:inline-block; margin-top:5px;">
          🚗 ${i18n.lang === 'fr' ? 'Itinéraire' : 'Directions'}
        </a>
      `);
  });
  
  if (items.length > 0 && items.length < LISTINGS.length) {
    const bounds = L.latLngBounds(items.filter(l => l.lat).map(l => [l.lat, l.lng]));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }
}

// --- DARK MODE ---
document.getElementById('themeBtn').addEventListener('click', () => {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = isDark ? '☀️' : '🌙';
});

// --- LANGUAGE ---
document.getElementById('langBtn').addEventListener('click', () => {
  i18n.lang = i18n.lang === 'fr' ? 'en' : 'fr';
  document.getElementById('langBtn').textContent = i18n.lang === 'fr' ? 'FR / EN' : 'EN / FR';
  document.documentElement.lang = i18n.lang;
  // update static i18n elements
  document.querySelectorAll('[data-fr]').forEach(el => {
    el.innerHTML = el.getAttribute(`data-${i18n.lang}`);
  });
  // re-render dynamic parts
  renderAll();
  // update search placeholder
  document.getElementById('searchInput').placeholder = i18n.lang === 'fr'
    ? 'Rechercher un restaurant, un hôtel, un parc...'
    : 'Search for a restaurant, hotel, park...';
  // update city filter first option
  document.querySelector('#cityFilter option[value=""]').textContent =
    i18n.lang === 'fr' ? 'Toutes les villes' : 'All cities';
});

// --- SEARCH ---
document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value;
  renderAll();
});
document.getElementById('cityFilter').addEventListener('change', e => {
  activeCity = e.target.value;
  renderAll();
});
document.getElementById('searchBtn').addEventListener('click', () => {
  searchQuery = document.getElementById('searchInput').value;
  renderAll();
  document.getElementById('listingsSection').scrollIntoView({ behavior: 'smooth' });
});

// --- ADD LISTING MODAL placeholder ---
document.getElementById('addListingBtn').addEventListener('click', () => {
  document.getElementById('modalContent').innerHTML = `
    <span class="modal-emoji">✉️</span>
    <div class="modal-title">${i18n.lang === 'fr' ? 'Proposer un établissement' : 'Submit a Place'}</div>
    <div class="modal-desc" style="padding:0 24px 16px">
      ${i18n.lang === 'fr'
        ? 'Remplissez le formulaire ci-dessous et votre demande sera envoyée à admin@gabaoindex.com.'
        : 'Fill in the form below and your request will be sent to admin@gabaoindex.com.'}
    </div>
    <form id="submitPlaceForm" style="display:grid; gap:12px; padding:0 24px 24px">
      <input type="text" name="name" placeholder="${i18n.lang === 'fr' ? 'Nom de l’établissement *' : 'Business name *'}" required style="padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--bg-card); color:var(--text-primary);" />
      <input type="text" name="owner" placeholder="${i18n.lang === 'fr' ? 'Votre nom' : 'Your name'}" style="padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--bg-card); color:var(--text-primary);" />
      <input type="email" name="email" placeholder="${i18n.lang === 'fr' ? 'Votre email *' : 'Your email *'}" required style="padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--bg-card); color:var(--text-primary);" />
      <input type="tel" name="phone" placeholder="${i18n.lang === 'fr' ? 'Téléphone' : 'Phone'}" style="padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--bg-card); color:var(--text-primary);" />
      <input type="text" name="city" placeholder="${i18n.lang === 'fr' ? 'Ville *' : 'City *'}" required style="padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--bg-card); color:var(--text-primary);" />
      <textarea name="message" placeholder="${i18n.lang === 'fr' ? 'Décrivez votre établissement, catégorie, adresse, horaires...' : 'Describe the business, category, address, opening hours...'}" required style="min-height:120px; padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--bg-card); color:var(--text-primary);"></textarea>
      <button type="submit" class="btn-primary" style="padding:12px 16px; border:none; border-radius:10px; font-weight:700;">
        ${i18n.lang === 'fr' ? 'Envoyer à l’admin' : 'Send to admin'}
      </button>
      <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
        ${i18n.lang === 'fr' ? 'Votre demande sera transmise par email à admin@gabaoindex.com.' : 'Your request will be sent by email to admin@gabaoindex.com.'}
      </p>
    </form>
  `;
  const form = document.getElementById('submitPlaceForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const subject = encodeURIComponent(`Nouvel établissement à proposer — ${fd.get('name')}`);
    const body = encodeURIComponent(
      `Nom: ${fd.get('name')}\n` +
      `Nom du contact: ${fd.get('owner')}\n` +
      `Email: ${fd.get('email')}\n` +
      `Téléphone: ${fd.get('phone')}\n` +
      `Ville: ${fd.get('city')}\n\n` +
      `Message:\n${fd.get('message')}`
    );
    window.location.href = `mailto:admin@gabaoindex.com?subject=${subject}&body=${body}`;
  });
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
});

function renderAuthState() {
  const authBtn = document.getElementById('authBtn');
  if (!authBtn) return;
  if (currentUser) {
    authBtn.textContent = `👤 ${currentUser.displayName || currentUser.email || 'Account'}`;
  } else {
    authBtn.textContent = '👤 Login / Register';
  }
}

async function handleLoginClick() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    currentUser = result.user;
    renderAuthState();
  } catch (error) {
    console.warn('Popup login failed, falling back to redirect', error);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (redirectError) {
      console.error('Login failed', redirectError);
      alert(i18n.lang === 'fr'
        ? 'Connexion impossible. Vérifiez que Google Auth est activé dans Firebase et que localhost est autorisé.'
        : 'Login failed. Check that Google Auth is enabled in Firebase and localhost is authorized.');
    }
  }
}

async function handleLogoutClick() {
  await signOut(auth);
}

async function loadSiteContent() {
  try {
    const stored = await loadContent();
    HERO_SLIDES = stored.hero_slides;
    CATEGORIES = stored.categories;
    LISTINGS = stored.listings;
    BRAND = {
      ...BRAND,
      ...stored.brand
    };
  } catch (error) {
    console.warn('Content load failed, falling back to bundled data.json', error);
    const response = await fetch('data.json');
    const data = normalizeContent(await response.json());
    HERO_SLIDES = data.hero_slides;
    CATEGORIES = data.categories;
    LISTINGS = data.listings;
    BRAND = {
      ...BRAND,
      ...data.brand
    };
  }
}

// --- HERO RANDOMIZATION ---
function initHero() {
  const heroBg = document.getElementById('heroBg');
  const shuffled = [...HERO_SLIDES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);

  if (!selected.length) return;

  heroBg.innerHTML = selected.map((slide, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image:url('${slide.url}')" data-caption="${slide.caption[i18n.lang]}"></div>
  `).join('') + `
    <div class="slide-indicators" id="slideIndicators"></div>
    <div class="slide-caption" id="slideCaption">${selected[0].caption[i18n.lang]}</div>
  `;

  const indicators = document.getElementById('slideIndicators');
  indicators.innerHTML = selected.map((_, i) => `<div class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('');

  let currentSlide = 0;
  const slides = document.querySelectorAll('.hero-slide');
  const indDots = document.querySelectorAll('.indicator');
  const caption = document.getElementById('slideCaption');

  setInterval(() => {
    slides[currentSlide].classList.remove('active');
    indDots[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
    indDots[currentSlide].classList.add('active');
    caption.textContent = slides[currentSlide].dataset.caption;
  }, 5000);
}

// --- SORTING ---
function setSortBy(value) {
  sortBy = value;
  renderAll();
}

window.setSortBy = setSortBy;

// --- INIT ---
async function init() {
  try {
    await loadSiteContent();
    onAuthStateChanged(auth, async (user) => {
      currentUser = user || null;
      authInitialized = true;
      renderAuthState();
      if (user) {
        await loadReviewsForAllVisibleListings();
      }
    });

    try {
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult?.user) {
        currentUser = redirectResult.user;
        renderAuthState();
        await loadReviewsForAllVisibleListings();
      }
    } catch (error) {
      console.warn('No redirect login result', error);
    }
    document.getElementById('authBtn').addEventListener('click', async () => {
      if (currentUser) {
        await handleLogoutClick();
      } else {
        await handleLoginClick();
      }
    });
    initHero();
    renderAll();
    initMap();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}
async function loadReviewsForAllVisibleListings() {
  if (reviewsLoading) return;
  reviewsLoading = true;
  const visibleIds = getFiltered().slice(0, displayLimit).filter((l) => !l.isAd).map((l) => l.id);
  await Promise.all(visibleIds.map((id) => loadReviews(id)));
  reviewsLoading = false;
  renderListings();
}
init();
