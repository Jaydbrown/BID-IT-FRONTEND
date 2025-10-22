// ==========================
// CONSTANTS
// ==========================
const API_BASE_URL = "https://bid-it-backend.onrender.com";
const PAYSTACK_PUBLIC_KEY = 'pk_test_f50f3f81315685aaee766c97128f172c9abe1adf';

// ==========================
// BYPASS PROVIDER.JS
// ==========================
const originalFetch = window.fetch;
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
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

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
    animation: slideIn 0.3s ease;
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

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatTimeRemaining(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;
  
  if (diff <= 0) return 'Auction Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

// ==========================
// GET ITEM ID FROM URL
// ==========================
const container = document.getElementById('productContainer');
const params = new URLSearchParams(window.location.search);
const itemId = params.get('id');

if (!itemId) {
  container.innerHTML = `
    <div style="text-align: center; padding: 4rem;">
      <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #dc3545;"></i>
      <h3>Invalid Product ID</h3>
      <p>The product you're looking for doesn't exist.</p>
      <a href="buyerPage.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #4361ee; color: white; border-radius: 8px; text-decoration: none;">
        Back to Products
      </a>
    </div>
  `;
  throw new Error('Missing product ID');
}

// ==========================
// FETCH ITEM DETAILS
// ==========================
async function fetchItem() {
  try {
    console.log(`Fetching item ${itemId}...`);
    
    const res = await cleanFetch(`${API_BASE_URL}/api/items/${itemId}`);
    
    if (!res.ok) {
      throw new Error(`Item not found (Status: ${res.status})`);
    }
    
    const item = await res.json();
    console.log('Item loaded:', item);
    
    // Update breadcrumb
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = item.category || 'Product';
    }
    
    renderItem(item);
    
    // Fetch bids if it's an auction
    if (item.is_auction) {
      fetchBids(itemId);
    }
    
    // Fetch similar products
    fetchSimilarProducts(item.category, item.university, itemId);
    
    // Track view
    trackProductView(itemId);
    
  } catch (error) {
    console.error('Error fetching item:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem;">
        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ffc107;"></i>
        <h3>Failed to load product</h3>
        <p style="color: #6c757d;">${error.message}</p>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #4361ee; color: white; border: none; border-radius: 8px; cursor: pointer;">
          Try Again
        </button>
      </div>
    `;
  }
}

// ==========================
// TRACK PRODUCT VIEW
// ==========================
async function trackProductView(productId) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    await cleanFetch(`${API_BASE_URL}/api/recently-viewed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId })
    });
  } catch (error) {
    console.log('Could not track view:', error);
  }
}

// ==========================
// RENDER ITEM
// ==========================
function renderItem(item) {
  const imageUrl = item.image_url 
    ? `${API_BASE_URL}${item.image_url}` 
    : 'https://via.placeholder.com/800x600?text=Product+Image';
  
  const sellerName = item.seller_username || `Seller #${item.seller_id}`;
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  
  container.innerHTML = `
    <div class="product-container">
      <!-- Product Gallery -->
      <div class="product-gallery">
        <div class="main-image">
          <img src="${imageUrl}" alt="${escapeHtml(item.title)}" 
               onerror="this.src='https://via.placeholder.com/800x600?text=Image+Not+Found'">
        </div>
        <div class="thumbnail-gallery">
          <div class="thumbnail active">
            <img src="${imageUrl}" alt="Thumbnail" 
                 onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
          </div>
        </div>
      </div>

      <!-- Product Details -->
      <div class="product-details">
        <h1 class="product-title">${escapeHtml(item.title)}</h1>
        
        <div class="product-meta">
          <div class="meta-item">
            <i class="fas fa-tag"></i>
            <span>${escapeHtml(item.category || 'N/A')}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-university"></i>
            <span>${escapeHtml(item.university || 'N/A')}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-eye"></i>
            <span>${item.views || 0} views</span>
          </div>
        </div>

        <div class="product-price">
          <span class="price-label">${item.is_auction ? 'Starting Bid' : 'Price'}</span><br>
          ₦${Number(item.starting_price || 0).toLocaleString()}
        </div>

        <!-- Seller Info -->
        <div class="seller-info">
          <div class="seller-avatar">${sellerInitial}</div>
          <div class="seller-details">
            <h4>${escapeHtml(sellerName)}</h4>
            <p>${escapeHtml(item.university || 'University')}</p>
          </div>
        </div>

        ${item.is_auction ? `
          <!-- Auction Section -->
          <div class="auction-section">
            <div class="auction-header">
              <h3><i class="fas fa-gavel"></i> Live Auction</h3>
              <div class="auction-timer" id="auctionTimer">
                ${formatTimeRemaining(item.auction_end_time)}
              </div>
            </div>
            <div class="current-bid">
              Current Bid: ₦${Number(item.current_highest_bid || item.starting_price).toLocaleString()}
            </div>
            <form id="bidForm" class="bid-form">
              <input 
                type="number" 
                id="bidAmount"
                name="bid_amount" 
                placeholder="Enter your bid (₦)" 
                min="${(item.current_highest_bid || item.starting_price) + 1}" 
                required 
              />
              <button type="submit" class="btn btn-warning">
                <i class="fas fa-gavel"></i> Place Bid
              </button>
            </form>
            <div id="bidHistory" class="bid-history">
              <h4>Bid History</h4>
              <p style="text-align: center; color: #6c757d;">Loading bids...</p>
            </div>
          </div>
        ` : `
          <!-- Action Buttons for Non-Auction -->
          <div class="action-buttons">
            <button class="btn btn-primary" onclick="handleBuyNow(${item.id}, ${item.starting_price}, '${escapeHtml(item.title)}')">
              <i class="fas fa-shopping-cart"></i> Buy Now
            </button>
            <button class="btn btn-outline" onclick="addToWishlist(${item.id})">
              <i class="fas fa-heart"></i> Save
            </button>
          </div>
        `}

        <!-- Description -->
        <div class="product-description">
          <h3>Description</h3>
          <p>${escapeHtml(item.description)}</p>
        </div>
      </div>
    </div>
  `;
  
  // Setup auction bid form if applicable
  if (item.is_auction) {
    const bidForm = document.getElementById('bidForm');
    bidForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bidAmount = parseFloat(document.getElementById('bidAmount').value);
      
      const minBid = (item.current_highest_bid || item.starting_price) + 1;
      if (bidAmount < minBid) {
        showToast(`Your bid must be at least ₦${Number(minBid).toLocaleString()}`, 'error');
        return;
      }
      
      await handlePlaceBid(item.id, bidAmount, item.title);
    });

    // Update timer every minute
    setInterval(() => {
      const timerElement = document.getElementById('auctionTimer');
      if (timerElement) {
        timerElement.textContent = formatTimeRemaining(item.auction_end_time);
      }
    }, 60000);
  }
}

// ==========================
// FETCH BIDS FOR AUCTION
// ==========================
async function fetchBids(itemId) {
  try {
    const res = await cleanFetch(`${API_BASE_URL}/api/bids/item/${itemId}`);
    
    if (!res.ok) {
      throw new Error('Failed to fetch bids');
    }
    
    const bids = await res.json();
    console.log('Bids loaded:', bids);
    
    const bidHistoryContainer = document.getElementById('bidHistory');
    if (!bidHistoryContainer) return;
    
    if (bids.length === 0) {
      bidHistoryContainer.innerHTML = `
        <h4>Bid History</h4>
        <p style="text-align: center; color: #6c757d;">No bids yet. Be the first to bid!</p>
      `;
      return;
    }
    
    bidHistoryContainer.innerHTML = `
      <h4>Bid History (${bids.length})</h4>
      ${bids.slice(0, 10).map(bid => `
        <div class="bid-item">
          <div>
            <strong>₦${Number(bid.amount).toLocaleString()}</strong>
            <span style="color: #6c757d; margin-left: 0.5rem;">by ${escapeHtml(bid.bidder_username || 'Anonymous')}</span>
          </div>
          <span class="bid-time">${new Date(bid.created_at).toLocaleString()}</span>
        </div>
      `).join('')}
    `;
    
  } catch (error) {
    console.error('Error fetching bids:', error);
  }
}

// ==========================
// FETCH SIMILAR PRODUCTS
// ==========================
async function fetchSimilarProducts(category, university, currentItemId) {
  try {
    console.log('Fetching similar products...');
    
    // Try to fetch products from same category first
    let res = await cleanFetch(`${API_BASE_URL}/api/items?category=${encodeURIComponent(category)}&limit=8`);
    
    if (!res.ok) {
      // Fallback to all products if category fetch fails
      res = await cleanFetch(`${API_BASE_URL}/api/items?limit=8`);
    }
    
    let items = await res.json();
    
    // Filter out current item and limit to 4
    items = items
      .filter(item => item.id !== parseInt(currentItemId))
      .slice(0, 4);
    
    console.log('Similar products loaded:', items);
    
    const relatedGrid = document.getElementById('relatedProductsGrid');
    if (!relatedGrid) return;
    
    if (items.length === 0) {
      relatedGrid.innerHTML = `
        <p style="text-align: center; color: #6c757d; grid-column: 1/-1;">
          No similar products found
        </p>
      `;
      return;
    }
    
    relatedGrid.innerHTML = items.map(item => {
      const imageUrl = item.image_url 
        ? `${API_BASE_URL}${item.image_url}` 
        : 'https://via.placeholder.com/250x200?text=Product';
      
      return `
        <div class="product-card" onclick="window.location.href='productDetail.html?id=${item.id}'">
          <div class="product-card-image">
            <img src="${imageUrl}" alt="${escapeHtml(item.title)}" 
                 onerror="this.src='https://via.placeholder.com/250x200?text=No+Image'">
          </div>
          <div class="product-card-info">
            <div class="product-card-title">${escapeHtml(item.title)}</div>
            <div class="product-card-price">₦${Number(item.starting_price).toLocaleString()}</div>
            <div style="font-size: 0.85rem; color: #6c757d; margin-top: 0.5rem;">
              <i class="fas fa-tag"></i> ${escapeHtml(item.category || 'N/A')}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error fetching similar products:', error);
    const relatedGrid = document.getElementById('relatedProductsGrid');
    if (relatedGrid) {
      relatedGrid.innerHTML = `
        <p style="text-align: center; color: #6c757d; grid-column: 1/-1;">
          Could not load similar products
        </p>
      `;
    }
  }
}

// ==========================
// HANDLE BUY NOW
// ==========================
async function handleBuyNow(itemId, price, itemTitle) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    showToast('Please login to make a purchase', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  launchPayment(price, itemTitle, itemId, false);
}

// ==========================
// HANDLE PLACE BID
// ==========================
async function handlePlaceBid(itemId, bidAmount, itemTitle) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    showToast('Please login to place a bid', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  launchPayment(bidAmount, itemTitle, itemId, true);
}

// ==========================
// ADD TO WISHLIST
// ==========================
async function addToWishlist(itemId) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    showToast('Please login to save items', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  try {
    const res = await cleanFetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: itemId })
    });
    
    if (res.ok) {
      showToast('Added to wishlist!', 'success');
    } else {
      throw new Error('Failed to add to wishlist');
    }
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    showToast('Could not add to wishlist', 'error');
  }
}

// ==========================
// LAUNCH PAYMENT
// ==========================
function launchPayment(amount, itemTitle, itemId, isBid) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    showToast('You must be logged in to continue', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    showToast('Please enter a valid amount', 'error');
    return;
  }
  
  // Get user email from token
  let userEmail = 'user@example.com';
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    userEmail = tokenPayload.email || userEmail;
  } catch (e) {
    console.log('Could not extract email from token');
  }
  
  console.log('Launching payment:', {
    amount: parsedAmount,
    itemTitle,
    itemId,
    isBid,
    email: userEmail
  });
  
  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: userEmail,
    amount: parsedAmount * 100, // Convert to kobo
    currency: "NGN",
    ref: `BIDIT-${itemId}-${Date.now()}`,
    metadata: {
      custom_fields: [
        { display_name: "Item", variable_name: "item", value: itemTitle },
        { display_name: "Item ID", variable_name: "item_id", value: itemId },
        { display_name: "Type", variable_name: "type", value: isBid ? "Bid" : "Purchase" }
      ],
    },
    callback: function (response) {
      console.log('Payment successful:', response);
      handlePaymentSuccess(response, itemId, parsedAmount, isBid, token);
    },
    onClose: function () {
      console.log('Payment popup closed by user.');
      showToast('Payment cancelled', 'error');
    }
  });
  
  handler.openIframe();
}

// ==========================
// HANDLE PAYMENT SUCCESS
// ==========================
async function handlePaymentSuccess(response, itemId, amount, isBid, token) {
  try {
    const endpoint = isBid
      ? `${API_BASE_URL}/api/bids`
      : `${API_BASE_URL}/api/orders`;
    
    const payload = isBid
      ? { 
          item_id: itemId, 
          amount: amount, 
          transaction_ref: response.reference 
        }
      : { 
          item_id: itemId,
          amount: amount,
          transaction_ref: response.reference 
        };
    
    console.log('Confirming payment with backend:', { endpoint, payload });
    
    const confirmRes = await cleanFetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload),
    });
    
    if (!confirmRes.ok) {
      const errorData = await confirmRes.json().catch(() => ({}));
      throw new Error(errorData.message || 'Server rejected the payment confirmation.');
    }
    
    const result = await confirmRes.json();
    console.log('Payment confirmed:', result);
    
    showToast(
      isBid 
        ? '✅ Bid placed successfully!' 
        : '✅ Purchase completed successfully!',
      'success'
    );
    
    // Redirect after success
    setTimeout(() => {
      window.location.href = 'buyerPage.html';
    }, 2000);
    
  } catch (error) {
    console.error('Error confirming payment:', error);
    showToast(
      `Payment succeeded but confirmation failed: ${error.message}\n\nPlease contact support with reference: ${response.reference}`,
      'error'
    );
  }
}

// ==========================
// INITIALIZE
// ==========================
console.log('Product details page loaded');

// Add CSS animation styles
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
`;
document.head.appendChild(style);

// Start fetching
fetchItem();
