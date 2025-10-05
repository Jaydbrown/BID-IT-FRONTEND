// Fixed sellerPage.js - single loadListings, robust ID handling, no duplicate functions
// Changes made:
// - Removed duplicate loadListings definitions
// - Use event listeners (no inline onclick)
// - Normalize item ID (item.id || item.item_id || item._id)
// - Ensure editForm is set only once (global) and dataset.itemId is always set before submit
// - Added small helpers and extra console logs for debugging

// ==========================
// BYPASS PROVIDER.JS INTERFERENCE
// ==========================
const originalFetch = window.fetch;
function cleanFetch(url, options) {
  return originalFetch.call(window, url, options);
}

// ==========================
// GLOBAL CONSTANTS
// ==========================
const API_BASE_URL = "https://bid-it-backend.onrender.com";
const token = localStorage.getItem("token");

// ==========================
// ELEMENT REFERENCES
// ==========================
const listingContainer = document.getElementById("listingContainer");
const activeCountEl = document.getElementById("activeCount");

const addModal = document.getElementById("addListingModal");
const addForm = document.getElementById("addListingForm");
const openModalBtn = document.getElementById("openAddListingModal");
const closeModalBtn = addModal?.querySelector(".close-btn");

const editModal = document.getElementById("editListingModal");
const editForm = document.getElementById("editListingForm");
const closeEditModalBtn = editModal?.querySelector(".close-btn");

const profileModal = document.getElementById("profileModal");
const openProfileBtn = document.getElementById("openProfileModal");
const closeProfileBtn = profileModal?.querySelector(".close-btn");

// ==========================
// MODAL HANDLING
// ==========================
openModalBtn?.addEventListener("click", () => { if (addModal) addModal.style.display = "flex"; });
closeModalBtn?.addEventListener("click", () => { if (addModal) addModal.style.display = "none"; });
closeEditModalBtn?.addEventListener("click", () => { if (editModal) editModal.style.display = "none"; });
closeProfileBtn?.addEventListener("click", () => { if (profileModal) profileModal.style.display = "none"; });

window.addEventListener('click', (e) => {
  if (e.target === addModal) addModal.style.display = "none";
  if (e.target === editModal) editModal.style.display = "none";
  if (e.target === profileModal) profileModal.style.display = "none";
});

// ==========================
// TOKEN VALIDATION
// ==========================
if (!token) {
  alert("Session expired. Please log in again.");
  window.location.replace("/frontend/login.html");
}

// ==========================
// HELPERS
// ==========================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================
// UPDATED apiFetch FUNCTION
// ==========================
async function apiFetch(url, options = {}) {
  try {
    const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
    let body = options.body;

    if (body instanceof FormData) {
      // let browser set Content-Type (multipart/form-data)
    } else if (body) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }

    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      body,
    };

    console.log('Making request to:', `${API_BASE_URL}${url}`);
    console.log('Request method:', fetchOptions.method);
    console.log('Request headers:', fetchOptions.headers);

    const res = await cleanFetch(`${API_BASE_URL}${url}`, fetchOptions);

    console.log('Response status:', res.status);
    console.log('Response ok:', res.ok);

    if (!res.ok) {
      let errorData = {};
      try { errorData = await res.json(); } catch (e) { console.log('Could not parse error response as JSON'); }
      throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    const responseData = await res.json();
    console.log('Response data:', responseData);
    return responseData;
  } catch (err) {
    console.error(`API Error [${url}]:`, err);
    throw err;
  }
}

// ==========================
// SINGLE LOAD LISTINGS
// ==========================
async function loadListings() {
  console.log('Loading listings...');
  if (!listingContainer) return;
  listingContainer.innerHTML = "";

  try {
    const items = await apiFetch("/api/items/my");
    console.log('Loaded items:', items);

    const safeItems = Array.isArray(items) ? items : [];
    activeCountEl && (activeCountEl.textContent = String(safeItems.length));

    if (safeItems.length === 0) {
      listingContainer.innerHTML = `<p class="no-listings">No active listings yet.</p>`;
      return;
    }

    safeItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "listing-card";

      const imageUrl = item.image_url ? `${API_BASE_URL}${item.image_url}` : "https://via.placeholder.com/100";
      const title = escapeHtml(item.title || "Untitled");
      const price = Number(item.starting_price || 0).toLocaleString();

      card.innerHTML = `
        <div class="listing-image">
          <img src="${imageUrl}" alt="${title}">
        </div>
        <div class="listing-info">
          <h4>${title}</h4>
          <p>₦${price}</p>
        </div>
        <div class="listing-actions">
          <button class="edit">Edit</button>
          <button class="delete">Delete</button>
        </div>
      `;

      const editBtn = card.querySelector('.edit');
      const deleteBtn = card.querySelector('.delete');

      // Resolve ID from common fields
      const resolvedId = item.id ?? item.item_id ?? item._id;
      console.log('Attaching listeners for item id:', resolvedId, 'item object:', item);

      editBtn.addEventListener('click', () => {
        editItem(resolvedId);
      });

      deleteBtn.addEventListener('click', () => {
        if (!resolvedId) {
          alert('Cannot delete: invalid item id');
          return;
        }
        deleteItem(resolvedId);
      });

      listingContainer.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load listings:', err);
    alert("Failed to load your listings. Please try again later.");
  }
}

// ==========================
// ADD LISTING
// ==========================
addForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log('Add form submitted');

  const formData = new FormData(addForm);
  for (let [k, v] of formData.entries()) console.log(k, v);

  if (!formData.get("title") || !formData.get("description") || !formData.get("starting_price") || !formData.get("category")) {
    alert("Please fill all required fields.");
    return;
  }

  const isAuctionValue = formData.get("is_auction");
  if (isAuctionValue !== "true" && isAuctionValue !== "false") {
    alert("Please select auction type.");
    return;
  }

  if (isAuctionValue === "true") {
    const selectedDuration = addForm.querySelector('[name="auction_duration"]')?.value;
    if (!selectedDuration) {
      alert("Please select auction duration.");
      return;
    }
    formData.append("auction_duration", selectedDuration);
  }

  try {
    console.log('About to submit add form...');
    await apiFetch("/api/items", { method: "POST", body: formData });
    addForm.reset();
    addModal && (addModal.style.display = "none");
    await loadListings();
  } catch (err) {
    console.error('Form submission error:', err);
    alert(`Failed to add listing: ${err.message}`);
  }
});

// ==========================
// DELETE ITEM
// ==========================
async function deleteItem(id) {
  if (!id) { alert('Invalid id'); return; }
  if (!confirm("Are you sure you want to delete this item?")) return;
  try {
    await apiFetch(`/api/items/${Number(id)}`, { method: "DELETE" });
    await loadListings();
  } catch (err) {
    console.error('Delete error:', err);
    alert("Failed to delete listing.");
  }
}
window.deleteItem = deleteItem;

// ==========================
// EDIT ITEM
// ==========================
async function editItem(id) {
  console.log('=== EDIT ITEM CALLED ===');
  console.log('Raw ID:', id);
  if (id === undefined || id === null) {
    alert('Invalid item id');
    return;
  }

  try {
    const item = await apiFetch(`/api/items/${Number(id)}`);
    console.log('Successfully loaded item:', item);

    const resolvedId = item.id ?? item.item_id ?? item._id ?? id;
    editForm.dataset.itemId = String(resolvedId);
    console.log('Stored in dataset:', editForm.dataset.itemId);

    // populate form fields safely
    editForm.querySelector('input[name="title"]') && (editForm.querySelector('input[name="title"]').value = item.title ?? '');
    editForm.querySelector('textarea[name="description"]') && (editForm.querySelector('textarea[name="description"]').value = item.description ?? '');
    editForm.querySelector('input[name="starting_price"]') && (editForm.querySelector('input[name="starting_price"]').value = item.starting_price ?? '');
    editForm.querySelector('select[name="category"]') && (editForm.querySelector('select[name="category"]').value = item.category ?? '');

    const select = editForm.querySelector('select[name="is_auction"]');
    if (select) {
      select.value = item.is_auction ? "true" : "false";
      toggleAuctionDurationVisibility(select, editForm);
    }

    editModal && (editModal.style.display = "flex");
  } catch (err) {
    console.error('Error in editItem:', err);
    alert("Failed to load item for editing.");
  }
}
window.editItem = editItem;

// ==========================
// EDIT FORM SUBMISSION
// ==========================
editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log('=== FORM SUBMIT CALLED ===');

  const rawId = editForm.dataset.itemId;
  const id = rawId?.trim();
  console.log('ID from dataset:', id);
  if (!id || isNaN(Number(id))) {
    alert("Item ID is missing or invalid. Please try again.");
    return;
  }

  const title = editForm.querySelector('input[name="title"]')?.value || '';
  const description = editForm.querySelector('textarea[name="description"]')?.value || '';
  const starting_price = editForm.querySelector('input[name="starting_price"]')?.value || '';
  const category = editForm.querySelector('select[name="category"]')?.value || '';
  const is_auction = editForm.querySelector('select[name="is_auction"]')?.value || 'false';

  console.log('Form values:', { title, description, starting_price, category, is_auction });

  let auction_duration = null;
  if (is_auction === "true") {
    auction_duration = editForm.querySelector('select[name="auction_duration"]')?.value;
    if (!auction_duration) { alert('Please select auction duration'); return; }
  }

  const imageInput = editForm.querySelector('input[name="image"]');
  const hasNewImage = imageInput && imageInput.files && imageInput.files.length > 0;
  console.log('Has new image:', hasNewImage);

  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('starting_price', starting_price);
    formData.append('category', category);
    formData.append('is_auction', is_auction);
    if (auction_duration) formData.append('auction_duration', auction_duration);
    if (hasNewImage) formData.append('image', imageInput.files[0]);

    console.log('=== SENDING FORMDATA ===');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) console.log(`${key}: [File: ${value.name}]`);
      else console.log(`${key}: "${value}"`);
    }

    console.log(`Making PATCH request to: /api/items/${Number(id)}`);
    await apiFetch(`/api/items/${Number(id)}`, { method: "PATCH", body: formData });

    console.log('Update successful');
    editModal && (editModal.style.display = "none");
    await loadListings();
  } catch (err) {
    console.error('Edit form error:', err);
    alert(`Failed to update listing: ${err.message}`);
  }
});

// ==========================
// AUCTION DURATION TOGGLE
// ==========================
function toggleAuctionDurationVisibility(select, form) {
  const durationContainer = form.querySelector(".auction-duration-container");
  if (durationContainer) durationContainer.style.display = select.value === "true" ? "block" : "none";
}

document.querySelectorAll('select[name="is_auction"]').forEach((select) => {
  select.addEventListener("change", () => toggleAuctionDurationVisibility(select, select.closest("form")));
});

// ==========================
// PROFILE MODAL
// ==========================
openProfileBtn?.addEventListener('click', async () => {
  try {
    const data = await apiFetch("/api/users/me");
    document.getElementById("profileUsername").textContent = data.username || "N/A";
    document.getElementById("profileEmail").textContent = data.email || "N/A";
    document.getElementById("profileInstitution").textContent = data.institution || "N/A";
    document.getElementById("profileCreatedAt").textContent = new Date(data.created_at).toLocaleDateString();
    profileModal && (profileModal.style.display = "flex");
  } catch (err) {
    alert("Could not load profile information.");
  }
});

// ==========================
// TEST ENDPOINTS FUNCTION
// ==========================
async function testEndpoints() {
  console.log('Testing endpoints...');
  try {
    const response = await cleanFetch(`${API_BASE_URL}/api/items`);
    console.log('Basic endpoint test - Status:', response.status);
  } catch (error) { console.error('Basic endpoint test failed:', error); }

  try {
    const response = await cleanFetch(`${API_BASE_URL}/api/items/my`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
    console.log('Auth endpoint test - Status:', response.status);
    if (response.ok) { const data = await response.json(); console.log('Auth endpoint data:', data); }
  } catch (error) { console.error('Auth endpoint test failed:', error); }
}

// ==========================
// INITIAL LOAD
// ==========================
console.log('sellerPage.js loaded');
testEndpoints();
loadListings();
