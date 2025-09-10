const container = document.getElementById('productContainer');
const params = new URLSearchParams(window.location.search);
const itemId = params.get('id');

if (!itemId) {
  container.innerHTML = '<p>Invalid product ID.</p>';
  throw new Error('Missing product ID');
}

async function fetchItem() {
  try {
    const res = await fetch(`http://localhost:5000/api/items/${itemId}`);
    if (!res.ok) throw new Error('Item not found');
    const item = await res.json();
    renderItem(item);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p>Failed to load product details.</p>';
  }
}

function renderItem(item) {
  container.innerHTML = `
    <div class="product-image">
      <img src="${item.image_url || 'https://via.placeholder.com/800x400?text=Product+Image'}" alt="${item.title}">
    </div>
    <div class="product-info">
      <h2>${item.title}</h2>
      <p><strong>Description:</strong> ${item.description}</p>
      <p><strong>Price:</strong> ₦${Number(item.starting_price || 0).toLocaleString()}</p>
      <p><strong>Seller ID:</strong> ${item.seller_id}</p>
    </div>
    <div class="action-buttons">
      ${item.is_auction ? `
        <form id="bidForm" class="bid-form">
          <input type="number" name="bid_amount" placeholder="Enter your bid amount (₦)" required />
          <button type="submit" class="place-bid-btn">Place Bid</button>
        </form>
      ` : `
        <button class="buy-now-btn" onclick="launchPayment(${item.starting_price}, '${item.title}', '${item.id}', false)">Buy Now</button>
      `}
    </div>
  `;

  if (item.is_auction) {
    const bidForm = document.getElementById('bidForm');
    bidForm.addEventListener('submit', e => {
      e.preventDefault();
      const bidAmount = bidForm.bid_amount.value;
      launchPayment(bidAmount, item.title, item.id, true);
    });
  }
}

function launchPayment(amount, itemTitle, itemId, isBid) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to continue.');
    return;
  }

  const parsedAmount = parseInt(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  const handler = PaystackPop.setup({
    key: 'pk_test_f50f3f81315685aaee766c97128f172c9abe1adf', // ✅ Your provided public key
    email: "user@example.com", // Replace with the real user's email if you have it
    amount: parsedAmount * 100, // Paystack expects amount in kobo
    currency: "NGN",
    ref: `BIDIT-${itemId}-${Date.now()}`,
    metadata: {
      custom_fields: [
        { display_name: "Item", variable_name: "item", value: itemTitle }
      ],
    },
    callback: function (response) {
      console.log('Payment callback triggered:', response);

      // Use an async IIFE INSIDE the synchronous callback
      (async () => {
        try {
          const endpoint = isBid
            ? 'http://localhost:5000/api/bids/place-bid'
            : 'http://localhost:5000/api/bids/buy-now';

          const payload = isBid
            ? { item_id: itemId, bid_amount: parsedAmount, transaction_ref: response.reference }
            : { item_id: itemId, transaction_ref: response.reference };

          const confirmRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });

          if (!confirmRes.ok) throw new Error('Server rejected the payment confirmation.');
          alert(isBid ? 'Bid placed successfully!' : 'Purchase completed successfully!');
        } catch (error) {
          console.error('Error confirming payment:', error);
          alert('Payment succeeded but confirmation failed on the server.');
        }
      })();
    },
    onClose: function () {
      console.log('Payment popup closed by user.');
    }
  });

  handler.openIframe();
}

fetchItem();
