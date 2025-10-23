// ========================================
// BID IT - COMPLETE MAIN JAVASCRIPT
// ========================================

// ==========================
// CONSTANTS & CONFIGURATION
// ==========================
const API_BASE_URL = 'https://bid-it-backend.onrender.com/api';
const PAYSTACK_PUBLIC_KEY = 'pk_test_f50f3f81315685aaee766c97128f172c9abe1adf';

// ==========================
// BYPASS PROVIDER.JS
// ==========================
const originalXHR = window.XMLHttpRequest;

function cleanFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new originalXHR();
    const method = options.method || 'GET';
    
    xhr.open(method, url, true);
    
    if (options.headers) {
      Object.keys(options.headers).forEach(key => {
        xhr.setRequestHeader(key, options.headers[key]);
      });
    }
    
    xhr.onload = () => {
      const response = {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        json: () => Promise.resolve(JSON.parse(xhr.responseText)),
        text: () => Promise.resolve(xhr.responseText)
      };
      resolve(response);
    };
    
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Request timeout'));
    
    if (options.body) {
      xhr.send(options.body);
    } else {
      xhr.send();
    }
  });
}

// ==========================
// UTILITY FUNCTIONS
// ==========================

// Get Auth Token
const getAuthToken = () => localStorage.getItem('token');

// Set Auth Headers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

// Format Currency
function formatCurrency(amount) {
  return `₦${parseFloat(amount || 0).toLocaleString()}`;
}

// Format Date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Toast Notifications
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
      position: fixed;
      top: 100px;
      right: 2rem;
      z-index: 4000;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.cssText = `
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 15px rgba(0,0,0,0.1);
    border-left: 4px solid ${type === 'success' ? '#28a745' : '#dc3545'};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideIn 0.3s ease;
    min-width: 250px;
  `;
  
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" 
       style="color: ${type === 'success' ? '#28a745' : '#dc3545'}"></i>
    ${message}
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  @media (max-width: 768px) {
    #toastContainer {
      right: 1rem;
      left: 1rem;
      top: 80px;
    }
    
    .toast {
      min-width: auto !important;
      width: 100% !important;
    }
  }
`;
document.head.appendChild(style);

// ==========================
// NAVIGATION & UI
// ==========================

// Intro Animation
function initIntroAnimation() {
  const introElement = document.getElementById('introText');
  if (!introElement) return;

  const introText = "BID IT";
  let introIndex = 0;

  function typeIntro() {
    if (introIndex < introText.length) {
      introElement.textContent += introText.charAt(introIndex);
      introIndex++;
      setTimeout(typeIntro, 150);
    } else {
      setTimeout(() => {
        const intro = document.getElementById('intro');
        if (intro) {
          intro.classList.add('fade-out');
          setTimeout(() => {
            intro.style.display = 'none';
          }, 500);
        }
      }, 1000);
    }
  }

  typeIntro();
}

// Hero Subtitle Typing
function initHeroTyping() {
  const heroSubtitle = document.getElementById('heroSubtitle');
  if (!heroSubtitle) return;

  const heroText = "The Campus Marketplace";
  let heroIndex = 0;

  function typeHeroSubtitle() {
    if (heroIndex < heroText.length) {
      heroSubtitle.textContent += heroText.charAt(heroIndex);
      heroIndex++;
      setTimeout(typeHeroSubtitle, 100);
    }
  }

  typeHeroSubtitle();
}

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar && window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else if (navbar) {
    navbar.classList.remove('scrolled');
  }
});

// Hamburger Menu
function initHamburgerMenu() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar') || document.getElementById('mySidebar');
  const closebtn = document.querySelector('.closebtn');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closebtn && sidebar) {
    closebtn.addEventListener('click', () => {
      sidebar.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Close sidebar when clicking outside
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      if (e.target === sidebar) {
        sidebar.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
}

// Search Overlay
function initSearchOverlay() {
  const searchIcon = document.getElementById('searchIcon');
  const searchOverlay = document.getElementById('searchOverlay');
  const closeSearch = document.getElementById('closeSearch');
  const searchInput = document.getElementById('searchInput');

  if (searchIcon && searchOverlay) {
    searchIcon.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      if (searchInput) searchInput.focus();
    });
  }

  if (closeSearch && searchOverlay) {
    closeSearch.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
    });
  }

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay) {
      searchOverlay.classList.remove('active');
    }
  });
}

// Mobile University Filter in Sidebar
function initMobileUniversityFilter() {
  const sidebar = document.getElementById('sidebar') || document.getElementById('mySidebar');
  if (!sidebar) return;

  // Check if we're on mobile
  if (window.innerWidth <= 768) {
    // Remove existing filters if they exist
    const existingFilter = sidebar.querySelector('.mobile-university-filter');
    const existingSearch = sidebar.querySelector('.mobile-search-filter');
    
    if (existingFilter) existingFilter.remove();
    if (existingSearch) existingSearch.remove();

    // Add search button in sidebar
    const searchHTML = `
      <div class="mobile-search-filter" style="padding: 0; margin-bottom: 0.5rem;">
        <a href="#" onclick="event.preventDefault(); openMobileSearch();" style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem 0; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); transition: all 0.3s ease; color: rgba(255,255,255,0.8); font-size: 1.1rem;">
          <i class="fas fa-search" style="width: 24px; text-align: center;"></i>
          <span>Search Products</span>
        </a>
      </div>
    `;

    // Add university filter
    const filterHTML = `
      <div class="mobile-university-filter" style="padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 0.5rem;">
        <label style="color: rgba(255,255,255,0.8); font-size: 0.85rem; margin-bottom: 0.5rem; display: block;">Select University</label>
        <select id="mobileUniversitySelect" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #dee2e6; background: white; font-size: 0.9rem;">
          <option value="">All Universities</option>
          <option value="uniben">University of Benin</option>
          <option value="unilag">University of Lagos</option>
          <option value="abu">Ahmadu Bello University</option>
          <option value="ui">University of Ibadan</option>
          <option value="unn">University of Nigeria</option>
          <option value="unijos">University of Jos</option>
          <option value="futminna">FUT Minna</option>
        </select>
      </div>
    `;
    
    // Insert after close button
    const closeBtn = sidebar.querySelector('.closebtn');
    if (closeBtn) {
      closeBtn.insertAdjacentHTML('afterend', searchHTML);
      closeBtn.insertAdjacentHTML('afterend', filterHTML);
      
      // Add event listener for university filter
      const mobileSelect = document.getElementById('mobileUniversitySelect');
      if (mobileSelect) {
        mobileSelect.addEventListener('change', (e) => {
          const university = e.target.value;
          if (window.location.pathname.includes('buyerPage.html')) {
            currentFilters.university = university;
            loadProducts(currentFilters);
            sidebar.classList.remove('active');
            document.body.style.overflow = '';
          } else if (university) {
            window.location.href = `buyerPage.html?university=${university}`;
          }
        });
      }
    }
  }
}

// Open mobile search
function openMobileSearch() {
  const searchOverlay = document.getElementById('searchOverlay');
  const sidebar = document.getElementById('sidebar') || document.getElementById('mySidebar');
  
  if (sidebar) {
    sidebar.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  if (searchOverlay) {
    searchOverlay.classList.add('active');
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 300);
    }
  }
}

// Scroll Functions
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

// ==========================
// PRODUCT FUNCTIONS
// ==========================

// View Product
function viewProduct(productId) {
  window.location.href = `productDetail.html?id=${productId}`;
}

// Filter by Category
function filterByCategory(category) {
  window.location.href = `buyerPage.html?category=${category}`;
}

// Render Products
function renderProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (!products || products.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6c757d;">No products available</p>';
    return;
  }

  products.forEach(product => {
    const imageUrl = product.image_url 
      ? `https://bid-it-backend.onrender.com${product.image_url}` 
      : 'https://via.placeholder.com/300x300?text=Product';

    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.cursor = 'pointer';
    card.onclick = () => viewProduct(product.id);
    
    card.innerHTML = `
      <div class="product-image">
        <img src="${imageUrl}" alt="${product.title}" 
             onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'" />
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">${formatCurrency(product.starting_price)}</div>
        <div class="product-meta">
          <span><i class="fas fa-user"></i> ${product.seller_username || 'Seller'}</span>
          <span><i class="fas fa-university"></i> ${product.university || 'N/A'}</span>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary" onclick="event.stopPropagation(); viewProduct(${product.id})">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn btn-outline" onclick="event.stopPropagation(); addToWishlist(${product.id})">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Add to Wishlist
async function addToWishlist(productId) {
  const token = getAuthToken();
  if (!token) {
    showToast('Please login to add to wishlist', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  try {
    const response = await cleanFetch(`${API_BASE_URL}/wishlist`, {
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
    console.error('Error adding to wishlist:', error);
    showToast('Failed to add to wishlist', 'error');
  }
}

// ==========================
// INDEX PAGE FUNCTIONS
// ==========================

// Load Featured Products
async function loadFeaturedProducts() {
  try {
    const response = await cleanFetch(`${API_BASE_URL}/items?limit=8`);
    if (!response.ok) throw new Error('Failed to fetch');
    
    const items = await response.json();
    renderProducts(items, 'featuredGrid');
  } catch (error) {
    console.error('Error loading featured products:', error);
    const container = document.getElementById('featuredGrid');
    if (container) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #dc3545;">Failed to load products</p>';
    }
  }
}

// Load Flash Sales
async function loadFlashSales() {
  try {
    const response = await cleanFetch(`${API_BASE_URL}/flash-sales`);
    if (!response.ok) {
      // Fallback to regular products if flash sales endpoint doesn't exist
      const fallbackResponse = await cleanFetch(`${API_BASE_URL}/items?limit=4`);
      const items = await fallbackResponse.json();
      renderProducts(items, 'flashSalesGrid');
      return;
    }
    
    const data = await response.json();
    renderProducts(data.flashSales || [], 'flashSalesGrid');
  } catch (error) {
    console.error('Error loading flash sales:', error);
  }
}

// Load Auctions
async function loadAuctions() {
  try {
    const response = await cleanFetch(`${API_BASE_URL}/items?is_auction=true&limit=8`);
    if (!response.ok) throw new Error('Failed to fetch');
    
    const items = await response.json();
    renderProducts(items, 'auctionGrid');
  } catch (error) {
    console.error('Error loading auctions:', error);
  }
}

// Flash Sale Timer
async function updateFlashTimer() {
  try {
    const response = await cleanFetch(`${API_BASE_URL}/flash-sales/timer`);
    if (!response.ok) return;
    
    const data = await response.json();
    if (data.timeRemaining) {
      const timer = document.getElementById('flashTimer');
      if (timer) {
        let seconds = data.timeRemaining;
        
        const updateTimer = () => {
          if (seconds <= 0) {
            timer.textContent = 'Sale Ended';
            return;
          }
          
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;
          
          timer.textContent = `Ends in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          seconds--;
        };
        
        updateTimer();
        setInterval(updateTimer, 1000);
      }
    }
  } catch (error) {
    console.error('Timer error:', error);
  }
}

// Newsletter Submit
function handleNewsletterSubmit(event) {
  event.preventDefault();
  const email = event.target.querySelector('input[type="email"]').value;
  
  cleanFetch(`${API_BASE_URL}/newsletter/subscribe`, {
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
    console.error('Newsletter error:', error);
    showToast('Subscription failed. Please try again.', 'error');
  });
}

// Initialize Index Page
function initIndexPage() {
  console.log('Initializing index page...');
  
  initIntroAnimation();
  
  setTimeout(() => {
    initHeroTyping();
    loadFeaturedProducts();
    loadFlashSales();
    loadAuctions();
    updateFlashTimer();
  }, 2500);
}

// ==========================
// BUYER PAGE FUNCTIONS
// ==========================

let currentFilters = {
  category: null,
  university: null,
  search: null,
  is_auction: null
};

// Load Products with Filters
async function loadProducts(filters = {}) {
  const containers = ['featuredGrid', 'auctionGrid', 'notAuctionList'];
  
  // Show loading state
  containers.forEach(containerId => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';
    }
  });

  try {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.university) queryParams.append('university', filters.university);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.is_auction !== null) queryParams.append('is_auction', filters.is_auction);

    const response = await cleanFetch(`${API_BASE_URL}/items?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    
    const items = await response.json();
    
    // Render to different sections
    renderProducts(items, 'featuredGrid');
    renderProducts(items.filter(i => i.is_auction), 'auctionGrid');
    renderProducts(items.filter(i => !i.is_auction), 'notAuctionList');
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Failed to load products', 'error');
    
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #dc3545;">Failed to load products</p>';
      }
    });
  }
}

// Quick Search Functionality
function initQuickSearch() {
  const searchInput = document.getElementById('navQuickSearch');
  const searchResults = document.getElementById('navQuickSearchResults');
  const searchBtn = document.getElementById('navQuickSearchBtn');

  if (searchInput && searchResults) {
    let searchTimeout;
    
    searchInput.addEventListener('input', async (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
      }

      searchTimeout = setTimeout(async () => {
        try {
          const response = await cleanFetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
          
          if (!response.ok) {
            // Fallback to regular items search
            const fallbackResponse = await cleanFetch(`${API_BASE_URL}/items?search=${encodeURIComponent(query)}&limit=5`);
            const items = await fallbackResponse.json();
            
            if (items.length > 0) {
              searchResults.innerHTML = items.map(item => `
                <li role="option" onclick="selectSearchItem(${item.id})" style="cursor: pointer; padding: 0.75rem;">
                  <strong>${item.title}</strong><br>
                  <small>${item.category} • ${formatCurrency(item.starting_price)}</small>
                </li>
              `).join('');
              searchResults.style.display = 'block';
            } else {
              searchResults.innerHTML = '<li style="padding: 0.75rem;">No results found</li>';
              searchResults.style.display = 'block';
            }
            return;
          }
          
          const data = await response.json();
          
          if (data.suggestions && data.suggestions.length > 0) {
            searchResults.innerHTML = data.suggestions.map(item => `
              <li role="option" onclick="selectSearchItem(${item.id})" style="cursor: pointer; padding: 0.75rem;">
                <strong>${item.title}</strong><br>
                <small>${item.category} • ${formatCurrency(item.price || item.starting_price)}</small>
              </li>
            `).join('');
            searchResults.style.display = 'block';
          } else {
            searchResults.innerHTML = '<li style="padding: 0.75rem;">No results found</li>';
            searchResults.style.display = 'block';
          }
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 300);
    });
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        currentFilters.search = query;
        loadProducts(currentFilters);
      }
    });
  }
}

// Select Search Item
function selectSearchItem(itemId) {
  window.location.href = `productDetail.html?id=${itemId}`;
}

// University Select
function initUniversityFilter() {
  const universitySelect = document.getElementById('universitySelect');
  const mobileUniversitySelect = document.getElementById('mobileUniversitySelect');

  if (universitySelect) {
    universitySelect.addEventListener('change', (e) => {
      currentFilters.university = e.target.value;
      loadProducts(currentFilters);
    });
  }

  if (mobileUniversitySelect) {
    mobileUniversitySelect.addEventListener('change', (e) => {
      currentFilters.university = e.target.value;
      loadProducts(currentFilters);
    });
  }
}

// Category Filter
function initCategoryFilter() {
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const category = e.target.dataset.category || e.target.closest('.category-chip').dataset.category;
      if (category) {
        currentFilters.category = category;
        loadProducts(currentFilters);
      }
    });
  });
}

// Load Recently Viewed
async function loadRecentlyViewed() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await cleanFetch(`${API_BASE_URL}/recently-viewed`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) return;
    
    const data = await response.json();
    const container = document.getElementById('recentlyViewedStrip');
    
    if (container && data.recentlyViewed && data.recentlyViewed.length > 0) {
      container.innerHTML = data.recentlyViewed.map(item => {
        const imageUrl = item.image_url 
          ? `https://bid-it-backend.onrender.com${item.image_url}` 
          : 'https://via.placeholder.com/150x120?text=Product';
          
        return `
          <div class="rv-item" onclick="viewProduct(${item.id})" style="cursor: pointer;">
            <div class="rv-image">
              <img src="${imageUrl}" alt="${item.title}" 
                   onerror="this.src='https://via.placeholder.com/150x120?text=No+Image'" />
            </div>
            <div class="rv-info">
              <div class="rv-title">${item.title}</div>
              <div class="rv-price">${formatCurrency(item.starting_price)}</div>
            </div>
          </div>
        `;
      }).join('');
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
    await cleanFetch(`${API_BASE_URL}/recently-viewed`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId })
    });
  } catch (error) {
    console.error('Error tracking view:', error);
  }
}

// Initialize Buyer Page
function initBuyerPage() {
  console.log('Initializing buyer page...');
  
  initQuickSearch();
  initUniversityFilter();
  initCategoryFilter();
  loadProducts(currentFilters);
  loadRecentlyViewed();
  
  // Check URL params
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const university = urlParams.get('university');
  
  if (category) {
    currentFilters.category = category;
    loadProducts(currentFilters);
  }
  
  if (university) {
    currentFilters.university = university;
    loadProducts(currentFilters);
    
    // Set select values
    const universitySelect = document.getElementById('universitySelect');
    const mobileUniversitySelect = document.getElementById('mobileUniversitySelect');
    if (universitySelect) universitySelect.value = university;
    if (mobileUniversitySelect) mobileUniversitySelect.value = university;
  }
}

// ==========================
// PAGE DETECTION & INIT
// ==========================

// Detect which page we're on and initialize accordingly
function initializePage() {
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';

  console.log('Current page:', filename);

  // Initialize common elements
  initHamburgerMenu();
  initSearchOverlay();
  initMobileUniversityFilter();

  // Initialize page-specific functionality
  if (filename === 'index.html' || filename === '') {
    initIndexPage();
  } else if (filename === 'buyerPage.html') {
    initBuyerPage();
  } else if (filename === 'productDetail.html') {
    // Product detail initialization is in product.js
    console.log('Product detail page detected');
  } else if (filename === 'cart.html') {
    // Cart initialization is in cart.js
    console.log('Cart page detected');
  }

  // Check authentication status
  updateAuthUI();
}

// Update UI based on authentication status
function updateAuthUI() {
  const token = getAuthToken();
  const authButtons = document.querySelectorAll('.auth-required');
  
  authButtons.forEach(button => {
    if (!token) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Please login to continue', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      });
    }
  });
}

// ==========================
// EVENT LISTENERS
// ==========================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    initMobileUniversityFilter();
  }, 250);
});

// Expose functions globally
window.viewProduct = viewProduct;
window.addToWishlist = addToWishlist;
window.filterByCategory = filterByCategory;
window.scrollToTop = scrollToTop;
window.scrollToSection = scrollToSection;
window.handleNewsletterSubmit = handleNewsletterSubmit;
window.selectSearchItem = selectSearchItem;
window.showToast = showToast;
window.openMobileSearch = openMobileSearch;

console.log('BID IT Main JavaScript Loaded Successfully');
