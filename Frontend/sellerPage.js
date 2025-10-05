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
// SIDEBAR TOGGLE HANDLING
// ==========================
const sidebar = document.getElementById("mySidebar");
const hamburger = document.getElementById("hamburger");
const closeBtn = sidebar?.querySelector(".closebtn");

function openSidebar() {
  if (sidebar) {
    sidebar.style.width = window.innerWidth <= 768 ? "100%" : "30%";
    sidebar.setAttribute("aria-hidden", "false");
  }
}

function closeSidebar() {
  if (sidebar) {
    sidebar.style.width = "0";
    sidebar.setAttribute("aria-hidden", "true");
  }
}

hamburger?.addEventListener("click", openSidebar);
hamburger?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") openSidebar();
});
closeBtn?.addEventListener("click", closeSidebar);
sidebar?.addEventListener("click", (e) => {
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
  window.location.href = "/frontend/login.html";
}

// ==========================
// UPDATED apiFetch FUNCTION
// ==========================
async function apiFetch(url, options = {}) {
  try {
    const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
    let body = options.body;

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

    const res = await cleanFetch(`${API_BASE_URL}${url}`, fetchOptions);

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
  if (!listingContainer) return;
  listingContainer.innerHTML = "";

  try {
    const items = await apiFetch("/api/items/my");
    
    if (activeCountEl) {
      activeCountEl.textContent = items.length;
    }

    if (items.length === 0) {
      listingContainer.innerHTML = `<p class="no-listings">No active listings yet.</p>`;
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "listing-card";

      const imageUrl = item.image_url ? `${API_BASE_URL}${item.image_url}` : "https://via.placeholder.com/100";
      
      card.innerHTML = `
        <div class="listing-image">
          <img src="${imageUrl}" alt="${item.title}">
        </div>
        <div class="listing-info">
          <h4>${item.title}</h4>
          <p>₦${item.starting_price.toLocaleString()}</p>
        </div>
        <div class="listing-actions">
          <button class="edit">Edit</button>
          <button class="delete">Delete</button>
        </div>
      `;

      const editBtn = card.querySelector('.edit');
      const deleteBtn = card.querySelector('.delete');

      editBtn.addEventListener('click', () => editItem(item.id));
      deleteBtn.addEventListener('click', () => deleteItem(item.id));

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

  const formData = new FormData(addForm);

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
  }

  try {
    await apiFetch("/api/items", {
      method: "POST",
      body: formData,
    });

    addForm.reset();
    if (addModal) addModal.style.display = "none";
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
    console.error('Delete error:', err);
    alert("Failed to delete listing.");
  }
}

// ==========================
// EDIT ITEM
// ==========================
async function editItem(id) {
  if (!id) {
    alert('Invalid item ID');
    return;
  }

  try {
    const item = await apiFetch(`/api/items/${id}`);

    // Store ID in dataset
    editForm.dataset.itemId = String(id);

    // Populate form fields
    editForm.querySelector('input[name="title"]').value = item.title;
    editForm.querySelector('textarea[name="description"]').value = item.description;
    editForm.querySelector('input[name="starting_price"]').value = item.starting_price;
    editForm.querySelector('select[name="category"]').value = item.category || "";

    const select = editForm.querySelector('select[name="is_auction"]');
    if (select) {
      select.value = item.is_auction ? "true" : "false";
      toggleAuctionDurationVisibility(select, editForm);
    }

    if (editModal) editModal.style.display = "flex";
  } catch (err) {
    console.error('Error in editItem:', err);
    alert("Failed to load item for editing.");
  }
}

// ==========================
// EDIT FORM SUBMISSION
// ==========================
editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = editForm.dataset.itemId;
  
  if (!id) {
    alert("Item ID is missing. Please close and reopen the edit form.");
    return;
  }

  // Get form values
  const title = editForm.querySelector('input[name="title"]').value;
  const description = editForm.querySelector('textarea[name="description"]').value;
  const starting_price = editForm.querySelector('input[name="starting_price"]').value;
  const category = editForm.querySelector('select[name="category"]').value;
  const is_auction = editForm.querySelector('select[name="is_auction"]').value;

  // Validate auction duration if needed
  let auction_duration = null;
  if (is_auction === "true") {
    auction_duration = editForm.querySelector('select[name="auction_duration"]').value;
    if (!auction_duration) {
      alert("Please select a valid auction duration.");
      return;
    }
  }

  // Check for new image
  const imageInput = editForm.querySelector('input[name="image"]');
  const hasNewImage = imageInput && imageInput.files && imageInput.files.length > 0;

  try {
    // Build FormData manually
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('starting_price', starting_price);
    formData.append('category', category);
    formData.append('is_auction', is_auction);
    
    if (is_auction === "true" && auction_duration) {
      formData.append('auction_duration', auction_duration);
    }
    
    if (hasNewImage) {
      formData.append('image', imageInput.files[0]);
    }

    await apiFetch(`/api/items/${id}`, {
      method: "PATCH",
      body: formData,
    });

    if (editModal) editModal.style.display = "none";
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
  if (durationContainer) {
    durationContainer.style.display = select.value === "true" ? "block" : "none";
  }
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

    if (profileModal) profileModal.style.display = "flex";
  } catch (err) {
    alert("Could not load profile information.");
  }
});

// ==========================
// INITIAL LOAD
// ==========================
loadListings();
