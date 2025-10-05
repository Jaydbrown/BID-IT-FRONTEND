// ==========================
// BYPASS PROVIDER.JS INTERFERENCE
// ==========================
// Store the original fetch before any extensions can override it
const originalFetch = window.fetch;

// Create a clean fetch function that bypasses provider.js
function cleanFetch(url, options) {
  return originalFetch.call(window, url, options);
}

// ==========================
// GLOBAL CONSTANTS
// ==========================
const API_BASE_URL = "https://bid-it-backend.onrender.com";
const token = localStorage.getItem("token");

// ==========================
// SIDEBAR TOGGLE HANDLING
// ==========================
const sidebar = document.getElementById("mySidebar");
const hamburger = document.getElementById("hamburger");
const closeBtn = sidebar.querySelector(".closebtn");

function openSidebar() {
  sidebar.style.width = window.innerWidth <= 768 ? "100%" : "30%";
  sidebar.setAttribute("aria-hidden", "false");
}

function closeSidebar() {
  sidebar.style.width = "0";
  sidebar.setAttribute("aria-hidden", "true");
}

hamburger.addEventListener("click", openSidebar);
hamburger.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") openSidebar();
});
closeBtn.addEventListener("click", closeSidebar);
sidebar.addEventListener("click", (e) => {
  if (e.target === sidebar) closeSidebar();
});

// ==========================
// ELEMENT REFERENCES
// ==========================
const listingContainer = document.getElementById("listingContainer");
const activeCountEl = document.getElementById("activeCount");

const addModal = document.getElementById("addListingModal");
const addForm = document.getElementById("addListingForm");
const openModalBtn = document.getElementById("openAddListingModal");
const closeModalBtn = addModal.querySelector(".close-btn");

const editModal = document.getElementById("editListingModal");
const editForm = document.getElementById("editListingForm");
const closeEditModalBtn = editModal?.querySelector(".close-btn");

const profileModal = document.getElementById("profileModal");
const openProfileBtn = document.getElementById("openProfileModal");
const closeProfileBtn = profileModal.querySelector(".close-btn");

// ==========================
// MODAL HANDLING
// ==========================
openModalBtn.onclick = () => (addModal.style.display = "flex");
closeModalBtn.onclick = () => (addModal.style.display = "none");
closeEditModalBtn?.addEventListener("click", () => (editModal.style.display = "none"));
closeProfileBtn.onclick = () => (profileModal.style.display = "none");

window.onclick = (e) => {
  if (e.target === addModal) addModal.style.display = "none";
  if (e.target === editModal) editModal.style.display = "none";
  if (e.target === profileModal) profileModal.style.display = "none";
};

// ==========================
// TOKEN VALIDATION
// ==========================
if (!token) {
  alert("Session expired. Please log in again.");
  window.location.href = "/frontend/login.html";
}

// ==========================
// UPDATED apiFetch FUNCTION
// ==========================
async function apiFetch(url, options = {}) {
  try {
    const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
    let body = options.body;

    // Handle FormData specially
    if (body instanceof FormData) {
      // Don't set Content-Type for FormData - let browser handle it
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

    // Use cleanFetch instead of window.fetch to bypass provider.js
    const res = await cleanFetch(`${API_BASE_URL}${url}`, fetchOptions);

    console.log('Response status:', res.status);
    console.log('Response ok:', res.ok);

    if (!res.ok) {
      let errorData = {};
      try {
        errorData = await res.json();
      } catch (e) {
        console.log('Could not parse error response as JSON');
      }
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
// LOAD LISTINGS
// ==========================
async function loadListings() {
  console.log('Loading listings...');
  listingContainer.innerHTML = "";
  
  try {
    const items = await apiFetch("/api/items/my");
    console.log('Loaded items:', items);

    activeCountEl.textContent = items.length;

    if (items.length === 0) {
      listingContainer.innerHTML = `<p class="no-listings">No active listings yet.</p>`;
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "listing-card";
      card.innerHTML = `
        <div class="listing-image">
          <img src="${item.image_url ? `${API_BASE_URL}${item.image_url}` : "https://via.placeholder.com/100"}" alt="${item.title}">
        </div>
        <div class="listing-info">
          <h4>${item.title}</h4>
          <p>₦${item.starting_price.toLocaleString()}</p>
        </div>
        <div class="listing-actions">
          <button class="edit" onclick="editItem('${item.id}')">Edit</button>
          <button class="delete" onclick="deleteItem('${item.id}')">Delete</button>
        </div>
      `;
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
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  console.log('Add form submitted');
  
  const formData = new FormData(addForm);
  
  // Log form data for debugging
  console.log('Form data entries:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

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
    console.log('About to submit form...');
    
    // Make sure the URL doesn't have trailing slash
    await apiFetch("/api/items", {
      method: "POST",
      body: formData,
    });

    console.log('Form submitted successfully');
    addForm.reset();
    addModal.style.display = "none";
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
  if (!confirm("Are you sure you want to delete this item?")) return;
  try {
    await apiFetch(`/api/items/${id}`, { method: "DELETE" });
    await loadListings();
  } catch (err) {
    alert("Failed to delete listing.");
  }
}
window.deleteItem = deleteItem;

// ==========================
// EDIT ITEM
// ==========================
// ==========================
// EDIT ITEM
// ==========================
async function editItem(id) {
  console.log('editItem called with id:', id); // DEBUG
  
  try {
    const item = await apiFetch(`/api/items/${id}`);
    console.log('Loaded item:', item); // DEBUG

    // Store ID in form's dataset
    editForm.dataset.itemId = id;
    console.log('Set editForm.dataset.itemId to:', editForm.dataset.itemId); // DEBUG

    editForm.title.value = item.title;
    editForm.description.value = item.description;
    editForm.starting_price.value = item.starting_price;
    editForm.category.value = item.category || "";

    const select = editForm.querySelector('select[name="is_auction"]');
    if (select) {
      select.value = item.is_auction ? "true" : "false";
      toggleAuctionDurationVisibility(select, editForm);
    }

    editModal.style.display = "flex";
  } catch (err) {
    console.error('Error in editItem:', err);
    alert("Failed to load item for editing.");
  }
}
window.editItem = editItem; // ADD THIS LINE - it was missing!

// ==========================
// EDIT FORM SUBMISSION
// ==========================
editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log('Edit form submitted'); // DEBUG
  const id = editForm.dataset.itemId;
  console.log('Editing item ID:', id); // DEBUG

  if (!id) {
    alert("Item ID is missing. Please try again.");
    return;
  }

  const formData = new FormData(editForm);
  
  // Remove the id field - it should only be in the URL
  formData.delete("id");

  if (formData.get("is_auction") === "true") {
    const duration = formData.get("auction_duration");
    if (!duration) {
      alert("Please select a valid auction duration.");
      return;
    }
  }

  try {
    console.log(`Sending PATCH to /api/items/${id}`); // DEBUG
    
    await apiFetch(`/api/items/${id}`, {
      method: "PATCH",
      body: formData,
    });

    console.log('Update successful'); // DEBUG
    editModal.style.display = "none";
    await loadListings();
  } catch (err) {
    console.error('Edit form error:', err);
    alert(`Failed to update listing: ${err.message}`);
  }
});
// ==========================
// AUCTION DURATION TOGGLE
// ==========================
document.querySelectorAll('select[name="is_auction"]').forEach((select) => {
  select.addEventListener("change", () => toggleAuctionDurationVisibility(select, select.closest("form")));
});

document.querySelectorAll('#editListingForm select[name="is_auction"]').forEach((select) => {
  select.addEventListener('change', () => {
    const form = select.closest('form');
    const container = form.querySelector('.auction-duration-container');
    container.style.display = select.value === 'true' ? 'block' : 'none';
  });
});

function toggleAuctionDurationVisibility(select, form) {
  const durationContainer = form.querySelector(".auction-duration-container");
  durationContainer.style.display = select.value === "true" ? "block" : "none";
}

// ==========================
// PROFILE MODAL
// ==========================
openProfileBtn.onclick = async () => {
  try {
    const data = await apiFetch("/api/users/me");

    document.getElementById("profileUsername").textContent = data.username || "N/A";
    document.getElementById("profileEmail").textContent = data.email || "N/A";
    document.getElementById("profileInstitution").textContent = data.institution || "N/A";
    document.getElementById("profileCreatedAt").textContent = new Date(data.created_at).toLocaleDateString();

    profileModal.style.display = "flex";
  } catch (err) {
    alert("Could not load profile information.");
  }
};

// ==========================
// TEST ENDPOINTS FUNCTION
// ==========================
async function testEndpoints() {
  console.log('Testing endpoints...');
  
  // Test basic connectivity
  try {
    const response = await cleanFetch('https://bid-it-backend.onrender.com/api/items');
    console.log('Basic endpoint test - Status:', response.status);
  } catch (error) {
    console.error('Basic endpoint test failed:', error);
  }
  
  // Test authenticated endpoint
  try {
    const response = await cleanFetch('https://bid-it-backend.onrender.com/api/items/my', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Auth endpoint test - Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Auth endpoint data:', data);
    }
  } catch (error) {
    console.error('Auth endpoint test failed:', error);
  }
}

// ==========================
// INITIAL LOAD
// ==========================
console.log('sellerPage.js loaded');
testEndpoints();
loadListings();



