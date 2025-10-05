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
// GET ITEM ID FROM URL
// ==========================
const container = document.getElementById('productContainer');
const params = new URLSearchParams(window.location.search);
const itemId = params.get('id');

if (!itemId) {
  container.innerHTML = '<p>Invalid product ID.</p>';
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
    renderItem(item);
    
  } catch (error) {
    console.error('Error fetching item:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h2>Failed to load product</h2>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    `;
  }
}

// ==========================
// RENDER ITEM
// ==========================
function renderItem(item) {
  const imageUrl = item.image_url 
    ? `${API_BASE_URL}${item.image_url}` 
    : 'https://via.placeholder.com/800x400?text=Product+Image';
  
  const sellerName = item.seller_username || `Seller #${item.seller_id}`;
  
  container.innerHTML = `
    <div class="product-image">
      <img src="${imageUrl}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/800x400?text=Image+Not+Found'">
    </div>
    <div class="product-info">
      <h2>${item.title}</h2>
      <p><strong>Description:</strong> ${item.description}</p>
      <p><strong>Price:</strong> ₦${Number(item.starting_price || 0).toLocaleString()}</p>
      <p><strong>Category:</strong> ${item.category || 'N/A'}</p>
      <p><strong>Seller:</strong> ${sellerName}</p>
      <p><strong>University:</strong> ${item.university || 'N/A'}</p>
      ${item.is_auction ? `
        <p><strong>Auction Ends:</strong> ${new Date(item.auction_end_time).toLocaleString()}</p>
        <p><strong>Current Highest Bid:</strong> ₦${Number(item.current_highest_bid || item.starting_price).toLocaleString()}</p>
      ` : ''}
    </div>
    <div class="action-buttons">
      ${item.is_auction ? `
        <form id="bidForm" class="bid-form">
          <input 
            type="number" 
            name="bid_amount" 
            placeholder="Enter your bid amount (₦)" 
            min="${item.current_highest_bid || item.starting_price}" 
            required 
          />
          <button type="submit" class="place-bid-btn">Place Bid</button>
        </form>
      ` : `
        <button class="buy-now-btn" onclick="launchPayment(${item.starting_price}, '${escapeHtml(item.title)}', '${item.id}', false)">
          Buy Now - ₦${Number(item.starting_price).toLocaleString()}
        </button>
      `}
    </div>
  `;
  
  if (item.is_auction) {
    const bidForm = document.getElementById('bidForm');
    bidForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bidAmount = parseFloat(bidForm.bid_amount.value);
      
      const minBid = item.current_highest_bid || item.starting_price;
      if (bidAmount <= minBid) {
        alert(`Your bid must be higher than ₦${Number(minBid).toLocaleString()}`);
        return;
      }
      
      launchPayment(bidAmount, item.title, item.id, true);
    });
  }
}

// ==========================
// HELPER: ESCAPE HTML
// ==========================
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ==========================
// LAUNCH PAYMENT
// ==========================
function launchPayment(amount, itemTitle, itemId, isBid) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('You must be logged in to continue.');
    window.location.href = '/frontend/login.html';
    return;
  }
  
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }
  
  // Get user email from token or use a default
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
      ? `${API_BASE_URL}/api/bids/place-bid`
      : `${API_BASE_URL}/api/bids/buy-now`;
    
    const payload = isBid
      ? { 
          item_id: itemId, 
          bid_amount: amount, 
          transaction_ref: response.reference 
        }
      : { 
          item_id: itemId, 
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
    
    alert(isBid 
      ? '✅ Bid placed successfully!' 
      : '✅ Purchase completed successfully!');
    
    // Redirect to appropriate page
    setTimeout(() => {
      window.location.href = isBid 
        ? '/frontend/buyerPage.html' 
        : '/frontend/buyerPage.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error confirming payment:', error);
    alert(`Payment succeeded but confirmation failed: ${error.message}\n\nPlease contact support with reference: ${response.reference}`);
  }
}

// ==========================
// INITIALIZE
// ==========================
console.log('Product details page loaded');
fetchItem();
