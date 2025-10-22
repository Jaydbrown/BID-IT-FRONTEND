// ========================================
// 1. MAIN INDEX PAGE (index.html) - mainPage.js
// ========================================

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Get Auth Token
const getAuthToken = () => localStorage.getItem('token');

// Set Auth Headers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

// Intro Animation
const introText = "BID IT";
let introIndex = 0;
const introElement = document.getElementById('introText');

function typeIntro() {
  if (introIndex < introText.length) {
    introElement.textContent += introText.charAt(introIndex);
    introIndex++;
    setTimeout(typeIntro, 150);
  } else {
    setTimeout(() => {
      document.getElementById('intro').classList.add('fade-out');
      setTimeout(() => {
        document.getElementById('intro').style.display = 'none';
      }, 500);
    }, 1000);
  }
}

// Hero Subtitle Typing
const heroText = "The Campus Marketplace";
let heroIndex = 0;
const heroSubtitle = document.getElementById('heroSubtitle');

function typeHeroSubtitle() {
  if (heroIndex < heroText.length) {
    heroSubtitle.textContent += heroText.charAt(heroIndex);
    heroIndex++;
    setTimeout(typeHeroSubtitle, 100);
  }
}

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Hamburger Menu
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('active');
});

document.querySelector('.closebtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('active');
});

// Search Overlay
document.getElementById('searchIcon').addEventListener('click', () => {
  document.getElementById('searchOverlay').classList.add('active');
  document.getElementById('searchInput').focus();
});

document.getElementById('closeSearch').addEventListener('click', () => {
  document.getElementById('searchOverlay').classList.remove('active');
});

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    ${message}
  `;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Newsletter Submit
function handleNewsletterSubmit(event) {
  event.preventDefault();
  const email = event.target.querySelector('input[type="email"]').value;
  
  fetch(`${API_BASE_URL}/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  .then(res => res.json())
  .then(data => {
    showToast('Successfully subscribed to newsletter!', 'success');
    event.target.reset();
  })
  .catch(error => {
    showToast('Subscription failed. Please try again.', 'error');
  });
}

// Scroll Functions
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSection(sectionId) {
  document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

// Filter by Category
function filterByCategory(category) {
  window.location.href = `buyerPage.html?category=${category}`;
}

// Load Featured Products
async function loadFeaturedProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/items?limit=8`);
    const items = await response.json();
    renderProducts(items, 'featuredGrid');
  } catch (error) {
    console.error('Error loading featured products:', error);
  }
}

// Load Flash Sales
async function loadFlashSales() {
  try {
    const response = await fetch(`${API_BASE_URL}/flash-sales`);
    const data = await response.json();
    renderProducts(data.flashSales, 'flashSalesGrid');
  } catch (error) {
    console.error('Error loading flash sales:', error);
  }
}

// Load Auctions
async function loadAuctions() {
  try {
    const response = await fetch(`${API_BASE_URL}/items?is_auction=true&limit=8`);
    const items = await response.json();
    renderProducts(items, 'auctionGrid');
  } catch (error) {
    console.error('Error loading auctions:', error);
  }
}

// Render Products
function renderProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (!products || products.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 2rem;">No products available</p>';
    return;
  }

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image_url || 'https://picsum.photos/300/300'}" alt="${product.title}" />
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">₦${parseFloat(product.starting_price).toLocaleString()}</div>
        <div class="product-meta">
          <span><i class="fas fa-user"></i> ${product.seller_username || 'Seller'}</span>
          <span><i class="fas fa-university"></i> ${product.university || 'N/A'}</span>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary" onclick="viewProduct(${product.id})">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn btn-outline" onclick="addToWishlist(${product.id})">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// View Product
function viewProduct(productId) {
  window.location.href = `productDetail.html?id=${productId}`;
}

// Add to Wishlist
async function addToWishlist(productId) {
  const token = getAuthToken();
  if (!token) {
    showToast('Please login to add to wishlist', 'error');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/wishlist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id: productId })
    });

    if (response.ok) {
      showToast('Added to wishlist!', 'success');
    } else {
      throw new Error('Failed to add to wishlist');
    }
  } catch (error) {
    showToast('Failed to add to wishlist', 'error');
  }
}

// Flash Sale Timer
function updateFlashTimer() {
  fetch(`${API_BASE_URL}/flash-sales/timer`)
    .then(res => res.json())
    .then(data => {
      if (data.timeRemaining) {
        const timer = document.getElementById('flashTimer');
        if (timer) {
          let seconds = data.timeRemaining;
          
          setInterval(() => {
            if (seconds <= 0) {
              timer.textContent = 'Sale Ended';
              return;
            }
            
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            timer.textContent = `Ends in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            seconds--;
          }, 1000);
        }
      }
    })
    .catch(error => console.error('Timer error:', error));
}

// Initialize on Load
window.addEventListener('load', () => {
  typeIntro();
  setTimeout(() => {
    typeHeroSubtitle();
    loadFeaturedProducts();
    loadFlashSales();
    loadAuctions();
    updateFlashTimer();
  }, 2500);
});

// ========================================
// 2. BUYER PAGE (buyerPage.html) - buyerPage.js
// ========================================

let currentFilters = {
  category: null,
  university: null,
  search: null,
  is_auction: null
};

// Load Products with Filters
async function loadProducts(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.university) queryParams.append('university', filters.university);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.is_auction !== null) queryParams.append('is_auction', filters.is_auction);

    const response = await fetch(`${API_BASE_URL}/items?${queryParams}`);
    const items = await response.json();
    
    renderProducts(items, 'featuredGrid');
    renderProducts(items.filter(i => i.is_auction), 'auctionGrid');
    renderProducts(items.filter(i => !i.is_auction), 'notAuctionList');
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Failed to load products', 'error');
  }
}

// Quick Search Functionality
const searchInput = document.getElementById('navQuickSearch');
const searchResults = document.getElementById('navQuickSearchResults');

if (searchInput) {
  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      searchResults.innerHTML = '';
      searchResults.style.display = 'none';
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        searchResults.innerHTML = data.suggestions.map(item => `
          <li role="option" onclick="selectSearchItem(${item.id})">
            <strong>${item.title}</strong><br>
            <small>${item.category} • ₦${parseFloat(item.price).toLocaleString()}</small>
          </li>
        `).join('');
        searchResults.style.display = 'block';
      } else {
        searchResults.innerHTML = '<li>No results found</li>';
        searchResults.style.display = 'block';
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  });
}

// Select Search Item
function selectSearchItem(itemId) {
  window.location.href = `productDetail.html?id=${itemId}`;
}

// Search Button Click
const searchBtn = document.getElementById('navQuickSearchBtn');
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      currentFilters.search = query;
      loadProducts(currentFilters);
    }
  });
}

// University Select
const universitySelect = document.getElementById('universitySelect');
if (universitySelect) {
  universitySelect.addEventListener('change', (e) => {
    currentFilters.university = e.target.value;
    loadProducts(currentFilters);
  });
}

// Category Filter
document.querySelectorAll('.category-chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
    const category = e.target.dataset.category;
    currentFilters.category = category;
    loadProducts(currentFilters);
  });
});

// Load Recently Viewed
async function loadRecentlyViewed() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/recently-viewed`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    
    const container = document.getElementById('recentlyViewedStrip');
    if (container && data.recentlyViewed) {
      container.innerHTML = data.recentlyViewed.map(item => `
        <div class="rv-item" onclick="viewProduct(${item.id})">
          <div class="rv-image">
            <img src="${item.image_url || 'https://picsum.photos/150/120'}" alt="${item.title}" />
          </div>
          <div class="rv-info">
            <div class="rv-title">${item.title}</div>
            <div class="rv-price">₦${parseFloat(item.starting_price).toLocaleString()}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading recently viewed:', error);
  }
}

// Track Product View
async function trackProductView(productId) {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch(`${API_BASE_URL}/recently-viewed`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId })
    });
  } catch (error) {
    console.error('Error tracking view:', error);
  }
}

// Initialize Buyer Page
if (document.getElementById('featuredGrid')) {
  loadProducts(currentFilters);
  loadRecentlyViewed();
  
  // Check URL params for category
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  if (category) {
    currentFilters.category = category;
    loadProducts(currentFilters);
  }
}
