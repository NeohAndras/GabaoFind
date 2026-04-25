// ============================================================
// GABAOINDEX — app.js
// ============================================================

// --- I18N ---
const i18n = { lang: 'fr' };
function t(fr, en) { return i18n.lang === 'fr' ? fr : en; }

// --- DATA ---
let HERO_SLIDES = [];
let CATEGORIES = [];

let LISTINGS = [];


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

// --- RENDER CATEGORIES ---
function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  const counts = {};
  LISTINGS.forEach(l => counts[l.cat] = (counts[l.cat] || 0) + 1);
  grid.innerHTML = CATEGORIES.map(c => `
    <div class="cat-card ${activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}" id="cat-${c.id}">
      <span class="cat-icon">${c.icon}</span>
      <span class="cat-label">${c.label[i18n.lang]}</span>
      <span class="cat-count">${counts[c.id] || 0} lieux</span>
    </div>
  `).join('');
  grid.querySelectorAll('.cat-card').forEach(el => {
    el.addEventListener('click', () => {
      activeCategory = el.dataset.cat === activeCategory ? 'all' : el.dataset.cat;
      renderAll();
    });
  });
}

// --- RENDER ALL ---
function renderAll() {
  renderCategories();
  renderFilterPills();
  renderListings();
}

// --- RENDER FILTER PILLS ---
function renderFilterPills() {
  const bar = document.getElementById('filterBar');
  const pills = [{ id: 'all', label: { fr: 'Tous', en: 'All' } }, ...CATEGORIES];
  bar.innerHTML = pills.map(c => `
    <button class="filter-pill ${activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
      ${c.icon ? c.icon + ' ' : ''}${c.label[i18n.lang]}
    </button>
  `).join('');
  bar.querySelectorAll('.filter-pill').forEach(el => {
    el.addEventListener('click', () => {
      activeCategory = el.dataset.cat;
      displayLimit = ITEMS_PER_PAGE;
      renderAll();
    });
  });
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
  `;
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
    <span class="modal-emoji">✏️</span>
    <div class="modal-title">${i18n.lang === 'fr' ? 'Ajouter un lieu' : 'Add a Place'}</div>
    <div class="modal-desc" style="padding:0 24px 24px">${i18n.lang === 'fr'
      ? 'Cette fonctionnalité sera disponible prochainement. Contactez-nous pour soumettre votre établissement.'
      : 'This feature is coming soon. Contact us to submit your business.'}</div>
    <div class="modal-details">
      <div class="modal-detail"><span class="modal-detail-icon">📧</span>contact@gabaoindex.ga</div>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
});

// --- NAVBAR SCROLL ---
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.background =
    window.scrollY > 60
      ? 'rgba(10,26,15,0.95)'
      : 'rgba(10,26,15,0.7)';
});

// --- HERO RANDOMIZATION ---
function initHero() {
  const heroBg = document.getElementById('heroBg');
  const shuffled = [...HERO_SLIDES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  
  heroBg.innerHTML = selected.map((slide, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image:url('${slide.url}')" data-caption="${slide.caption[i18n.lang]}"></div>
  `).join('') + `
    <div class="slide-indicators" id="slideIndicators"></div>
    <div class="slide-caption" id="slideCaption">${selected[0].caption[i18n.lang]}</div>
  `;
  
  // Re-init indicators
  const indicators = document.getElementById('slideIndicators');
  indicators.innerHTML = selected.map((_, i) => `<div class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('');
  
  // Slide logic
  let currentSlide = 0;
  const slides = document.querySelectorAll('.hero-slide');
  const indDots = document.querySelectorAll('.indicator');
  const caption = document.getElementById('slideCaption');

  function nextSlide() {
    slides[currentSlide].classList.remove('active');
    indDots[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
    indDots[currentSlide].classList.add('active');
    caption.textContent = slides[currentSlide].dataset.caption;
  }
  
  setInterval(nextSlide, 5000);
}

// --- SORTING ---
function setSortBy(value) {
  sortBy = value;
  renderAll();
}

// --- INIT ---
async function init() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    HERO_SLIDES = data.hero_slides;
    CATEGORIES = data.categories;
    LISTINGS = data.listings;
    
    initHero();
    renderAll();
    initMap();
  } catch (error) {
    console.error('Error loading data:', error);
    // Fallback or error message
  }
}
init();
