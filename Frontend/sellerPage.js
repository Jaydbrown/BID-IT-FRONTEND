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

// Replace your apiFetch function with this version
async function apiFetch(url, options = {}) {
  try {
    const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
    let body = options.body;

    // Handle FormData specially to avoid cloning issues
    if (body instanceof FormData) {
      // Don't set Content-Type for FormData - let browser set it with boundary
      // Don't try to serialize FormData
    } else if (body) {
      // Only for non-FormData bodies
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }

    // Create a clean options object to avoid any cloning issues
    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      body,
      // Don't spread the original options to avoid including problematic properties
    };

    console.log('Making request to:', `${API_BASE_URL}${url}`);
    console.log('Request options:', {
      ...fetchOptions,
      body: fetchOptions.body instanceof FormData ? '[FormData object]' : fetchOptions.body
    });

    const res = await fetch(`${API_BASE_URL}${url}`, fetchOptions);

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
    console.error('Full error object:', err);
    throw err;
  }
}

// ==========================
// LOAD LISTINGS
// ==========================
async function loadListings() {
  listingContainer.innerHTML = "";
  try {
    const items = await apiFetch("/api/items/my");

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
    alert("Failed to load your listings. Please try again later.");
  }
}

// ==========================
// ADD LISTING
// ==========================
addForm.addEventListener("submit", async (e) => {
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
    formData.append("auction_duration", selectedDuration);
  }

  try {
    await apiFetch("/api/items", {
      method: "POST",
      body: formData,
    });

    addForm.reset();
    addModal.style.display = "none";
    await loadListings();
  } catch (err) {
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
async function editItem(id) {
  try {
    const item = await apiFetch(`/api/items/${id}`);

     editForm.querySelector('input[name="id"]').value = item.id;

    editForm.id.value = item.id;
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
    alert("Failed to load item for editing.");
  }
}
window.editItem = editItem;

// ==========================
editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get item ID from hidden input
  const id = editForm.querySelector('input[name="id"]').value;

  // Use FormData for PATCH request (supports file uploads)
  const formData = new FormData(editForm);

  // If auction selected, ensure duration is provided
  if (formData.get("is_auction") === "true") {
    const duration = formData.get("auction_duration");
    if (!duration) {
      alert("Please select a valid auction duration.");
      return;
    }
  }

  try {
    await apiFetch(`/api/items/${id}`, {
      method: "PATCH",
      body: formData,
    });

    editModal.style.display = "none";
    await loadListings();
  } catch (err) {
    alert(`Failed to update listing: ${err.message}`);
  }
});

document.querySelectorAll('#editListingForm select[name="is_auction"]').forEach((select) => {
  select.addEventListener('change', () => {
    const form = select.closest('form');
    const container = form.querySelector('.auction-duration-container');
    container.style.display = select.value === 'true' ? 'block' : 'none';
  });
});



// ==========================
// AUCTION DURATION TOGGLE
// ==========================
document.querySelectorAll('select[name="is_auction"]').forEach((select) => {
  select.addEventListener("change", () => toggleAuctionDurationVisibility(select, select.closest("form")));
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
// INITIAL LOAD
// ==========================
loadListings();




