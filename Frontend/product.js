// ========================================
// PRODUCT DETAIL PAGE JAVASCRIPT
// ========================================

// Check if main.js functions are available, if not define minimal versions
if (typeof API_BASE_URL === 'undefined') {
  const API_BASE_URL = 'https://bid-it-backend.onrender.com/api';
}

if (typeof cleanFetch === 'undefined') {
  const originalXHR = window.XMLHttpRequest;
  window.cleanFetch = function(url, options = {}) {
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
  };
}

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// Product state
let currentProduct = null;
let auctionTimer = null;

// ==========================
// LOAD PRODUCT DETAIL
// ==========================
async function loadProductDetail() {
  if (!productId) {
    showProductNotFound();
    return;
  }

  const container = document.getElementById('productContainer');
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading product details...</p>
    </div>
  `;

  try {
    const response = await cleanFetch(`${API_BASE_URL}/items/${productId}`);
    
    if (!response.ok) {
      throw new Error('Product not found');
    }

    currentProduct = await response.json();
    renderProductDetail(currentProduct);
    loadRelatedProducts(currentProduct.category);
    
    // Track product view if user is logged in
    if (window.trackProductView && typeof window.trackProductView === 'function') {
      window.trackProductView(productId);
    }
  } catch (error) {
    console.error('Error loading product:', error);
    showProductNotFound();
  }
}

// ==========================
// RENDER PRODUCT DETAIL
// ==========================
function renderProductDetail(product) {
  const container = document.getElementById('productContainer');
  if (!container) return;

  // Update breadcrumb
  const breadcrumbCategory = document.getElementById('breadcrumbCategory');
  if (breadcrumbCategory) {
    breadcrumbCategory.textContent = product.category || 'Product';
  }

  const imageUrl = product.image_url 
    ? `https://bid-it-backend.onrender.com${product.image_url}` 
    : 'https://via.placeholder.com/500x500?text=Product';

  const isAuction = product.is_auction;
  const token = localStorage.getItem('token');

  container.innerHTML = `
    <div class="product-container">
      <!-- Product Gallery -->
      <div class="product-gallery">
        <div class="main-image">
          <img src="${imageUrl}" alt="${product.title}" 
               onerror="this.src='https://via.placeholder.com/500x500?text=No+Image'" />
        </div>
      </div>

      <!-- Product Details -->
      <div class="product-details">
        <h1 class="product-title">${product.title}</h1>
        
        <div class="product-meta">
          <div class="meta-item">
            <i class="fas fa-tag"></i>
            <span>${product.category || 'General'}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-calendar"></i>
            <span>${formatDate(product.created_at)}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-eye"></i>
            <span>${product.views || 0} views</span>
          </div>
        </div>

        ${isAuction ? renderAuctionSection(product) : renderBuyNowSection(product)}

        <!-- Seller Info -->
        <div class="seller-info">
          <div class="seller-avatar">
            ${(product.seller_username || 'S')[0].toUpperCase()}
          </div>
          <div class="seller-details">
            <h4>${product.seller_username || 'Seller'}</h4>
            <p><i class="fas fa-university"></i> ${product.university || 'University'}</p>
          </div>
        </div>

        <!-- Product Description -->
        <div class="product-description">
          <h3>Description</h3>
          <p>${product.description || 'No description available.'}</p>
        </div>

        <!-- Action Buttons -->
        ${renderActionButtons(product, token)}
      </div>
    </div>
  `;

  // Initialize auction timer if it's an auction
  if (isAuction && product.auction_end_time) {
    initAuctionTimer(product.auction_end_time);
  }
}

// ==========================
// RENDER AUCTION SECTION
// ==========================
function renderAuctionSection(product) {
  const currentBid = product.current_bid || product.starting_price;
  const timeRemaining = getTimeRemaining(product.auction_end_time);

  return `
    <div class="auction-section">
      <div class="auction-header">
        <h3><i class="fas fa-gavel"></i> Live Auction</h3>
        <div class="auction-timer" id="auctionTimer">${timeRemaining}</div>
      </div>
      
      <div class="current-bid">
        Current Bid: ${formatCurrency(currentBid)}
      </div>
      
      <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
        <i class="fas fa-users"></i> ${product.bid_count || 0} bid(s)
      </p>

      <div class="bid-form">
        <input type="number" id="bidAmount" placeholder="Enter your bid" 
               min="${parseFloat(currentBid) + 100}" step="100" 
               style="flex: 1; padding: 0.875rem; border: 2px solid #ffc107; border-radius: 12px; font-size: 1rem;" />
        <button class="btn btn-warning" onclick="placeBid()" style="padding: 0.875rem 1.5rem;">
          <i class="fas fa-gavel"></i> Place Bid
        </button>
      </div>

      <div class="bid-history" id="bidHistory">
        <h4>Bid History</h4>
        <div id="bidHistoryList">
          <p style="text-align: center; padding: 1rem; color: #666;">Loading bid history...</p>
        </div>
      </div>
    </div>
  `;
}

// ==========================
// RENDER BUY NOW SECTION
// ==========================
function renderBuyNowSection(product) {
  return `
    <div class="product-price">
      <span class="price-label">Price</span>
      ${formatCurrency(product.starting_price)}
    </div>
  `;
}

// ==========================
// RENDER ACTION BUTTONS
// ==========================
function renderActionButtons(product, token) {
  if (!token) {
    return `
      <div class="action-buttons">
        <button class="btn btn-primary" onclick="showLoginRequired()">
          <i class="fas fa-sign-in-alt"></i> Login to ${product.is_auction ? 'Bid' : 'Buy'}
        </button>
      </div>
    `;
  }

  if (product.is_auction) {
    return ''; // Bid button is in auction section
  }

  return `
    <div class="action-buttons">
      <button class="btn btn-primary" onclick="addToCart(${product.id})">
        <i class="fas fa-shopping-cart"></i> Add to Cart
      </button>
      <button class="btn btn-outline" onclick="buyNow(${product.id})">
        <i class="fas fa-bolt"></i> Buy Now
      </button>
    </div>
  `;
}

// ==========================
// AUCTION TIMER
// ==========================
function initAuctionTimer(endTime) {
  const timerElement = document.getElementById('auctionTimer');
  if (!timerElement) return;

  // Clear any existing timer
  if (auctionTimer) clearInterval(auctionTimer);

  function updateTimer() {
    const timeString = getTimeRemaining(endTime);
    timerElement.textContent = timeString;

    // Check if auction ended
    if (timeString === 'Auction Ended') {
      clearInterval(auctionTimer);
      timerElement.style.background = '#dc3545';
    }
  }

  updateTimer();
  auctionTimer = setInterval(updateTimer, 1000);
}

function getTimeRemaining(endTime) {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const remaining = end - now;

  if (remaining <= 0) {
    return 'Auction Ended';
  }

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
}

// ==========================
// PLACE BID
// ==========================
async function placeBid() {
  const token = localStorage.getItem('token');
  if (!token) {
    showLoginRequired();
    return;
  }

  const bidInput = document.getElementById('bidAmount');
  if (!bidInput) return;

  const bidAmount = parseFloat(bidInput.value);
  const currentBid = currentProduct.current_bid || currentProduct.starting_price;

  if (!bidAmount || bidAmount <= currentBid) {
    showToast(`Bid must be higher than ${formatCurrency(currentBid)}`, 'error');
    return;
  }

  try {
    const response = await cleanFetch(`${API_BASE_URL}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        item_id: productId,
        bid_amount: bidAmount
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to place bid');
    }

    showToast('Bid placed successfully!', 'success');
    bidInput.value = '';
    
    // Reload product to get updated bid info
    setTimeout(() => loadProductDetail(), 1000);
  } catch (error) {
    console.error('Error placing bid:', error);
    showToast(error.message || 'Failed to place bid', 'error');
  }
}

// ==========================
// ADD TO CART
// ==========================
async function addToCart(itemId) {
  const token = localStorage.getItem('token');
  if (!token) {
    showLoginRequired();
    return;
  }

  try {
    const response = await cleanFetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        item_id: itemId,
        quantity: 1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to cart');
    }

    showToast('Added to cart!', 'success');
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast(error.message || 'Failed to add to cart', 'error');
  }
}

// ==========================
// BUY NOW
// ==========================
async function buyNow(itemId) {
  const token = localStorage.getItem('token');
  if (!token) {
    showLoginRequired();
    return;
  }

  if (!currentProduct) return;

  // Get user email from token
  let userEmail = 'user@example.com';
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    userEmail = tokenPayload.email || userEmail;
  } catch (e) {
    console.log('Could not extract email');
  }

  // Launch Paystack payment
  const handler = PaystackPop.setup({
    key: 'pk_test_f50f3f81315685aaee766c97128f172c9abe1adf',
    email: userEmail,
    amount: currentProduct.starting_price * 100, // Convert to kobo
    currency: "NGN",
    ref: `ITEM-${itemId}-${Date.now()}`,
    metadata: {
      custom_fields: [
        { display_name: "Item ID", variable_name: "item_id", value: itemId },
        { display_name: "Item Title", variable_name: "item_title", value: currentProduct.title },
        { display_name: "Type", variable_name: "type", value: "Direct Purchase" }
      ],
    },
    callback: function (response) {
      handlePaymentSuccess(response, itemId);
    },
    onClose: function () {
      showToast('Payment cancelled', 'error');
    }
  });

  handler.openIframe();
}

// ==========================
// HANDLE PAYMENT SUCCESS
// ==========================
async function handlePaymentSuccess(response, itemId) {
  try {
    showToast('Payment successful! Processing order...', 'success');
    
    // You would typically send this to your backend to verify and create order
    console.log('Payment reference:', response.reference);
    
    setTimeout(() => {
      showToast(' Purchase complete! Thank you.', 'success');
      window.location.href = 'buyerPage.html';
    }, 2000);
  } catch (error) {
    console.error('Error processing payment:', error);
    showToast('Payment succeeded but order confirmation failed. Please contact support.', 'error');
  }
}

// ==========================
// LOAD RELATED PRODUCTS
// ==========================
async function loadRelatedProducts(category) {
  const container = document.getElementById('relatedProductsGrid');
  if (!container) return;

  try {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    queryParams.append('limit', '4');

    const response = await cleanFetch(`${API_BASE_URL}/items?${queryParams}`);
    
    if (!response.ok) throw new Error('Failed to load related products');
    
    const items = await response.json();
    
    // Filter out current product
    const relatedItems = items.filter(item => item.id !== parseInt(productId));

    if (relatedItems.length > 0) {
      container.innerHTML = relatedItems.map(item => {
        const imageUrl = item.image_url 
          ? `https://bid-it-backend.onrender.com${item.image_url}` 
          : 'https://via.placeholder.com/250x200?text=Product';

        return `
          <div class="product-card" onclick="window.location.href='productDetail.html?id=${item.id}'">
            <div class="product-card-image">
              <img src="${imageUrl}" alt="${item.title}" 
                   onerror="this.src='https://via.placeholder.com/250x200?text=No+Image'" />
            </div>
            <div class="product-card-info">
              <div class="product-card-title">${item.title}</div>
              <div class="product-card-price">${formatCurrency(item.starting_price)}</div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666; grid-column: 1/-1;">No related products found</p>';
    }
  } catch (error) {
    console.error('Error loading related products:', error);
    container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666; grid-column: 1/-1;">Could not load related products</p>';
  }
}

// ==========================
// UTILITY FUNCTIONS
// ==========================

function showProductNotFound() {
  const container = document.getElementById('productContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 4rem;">
      <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #dc3545; margin-bottom: 1rem;"></i>
      <h3 style="margin-bottom: 1rem;">Product not found</h3>
      <p style="color: #666; margin-bottom: 2rem;">The product you're looking for doesn't exist or has been removed.</p>
      <a href="buyerPage.html" class="btn btn-primary" style="display: inline-flex; text-decoration: none;">
        <i class="fas fa-arrow-left"></i> Back to Products
      </a>
    </div>
  `;
}

function showLoginRequired() {
  showToast('Please login to continue', 'error');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1500);
}

function formatCurrency(amount) {
  return `₦${parseFloat(amount || 0).toLocaleString()}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function showToast(message, type = 'success') {
  // Use global showToast if available
  if (window.showToast && typeof window.showToast === 'function') {
    window.showToast(message, type);
    return;
  }

  // Fallback toast implementation
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position: fixed; top: 100px; right: 2rem; z-index: 4000;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
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
  `;
  
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" 
       style="color: ${type === 'success' ? '#28a745' : '#dc3545'}"></i>
    ${message}
  `;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==========================
// EXPOSE FUNCTIONS GLOBALLY
// ==========================
window.loadProductDetail = loadProductDetail;
window.placeBid = placeBid;
window.addToCart = addToCart;
window.buyNow = buyNow;

// ==========================
// INITIALIZE ON LOAD
// ==========================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadProductDetail);
} else {
  loadProductDetail();
}

console.log(' Product Detail JavaScript Loaded');
