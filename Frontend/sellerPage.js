const sidebar = document.getElementById('mySidebar');
const hamburger = document.getElementById('hamburger');
const closeBtn = sidebar.querySelector('.closebtn');

function openSidebar() {
  if (window.innerWidth <= 768) {
    sidebar.style.width = "100%";
  } else {
    sidebar.style.width = "30%";
  }
  sidebar.setAttribute('aria-hidden', 'false');
}

function closeSidebar() {
  sidebar.style.width = "0";
  sidebar.setAttribute('aria-hidden', 'true');
}

hamburger.addEventListener('click', openSidebar);
hamburger.addEventListener('keydown', e => {
  if (e.key === "Enter" || e.key === " ") openSidebar();
});
closeBtn.addEventListener('click', closeSidebar);
sidebar.addEventListener('click', e => {
  if (e.target === sidebar) closeSidebar();
});

const token = localStorage.getItem('token');
const listingContainer = document.getElementById('listingContainer');
const activeCountEl = document.getElementById('activeCount');

const addModal = document.getElementById('addListingModal');
const addForm = document.getElementById('addListingForm');
const openModalBtn = document.getElementById('openAddListingModal');
const closeModalBtn = addModal.querySelector('.close-btn');

const editModal = document.getElementById('editListingModal');
const editForm = document.getElementById('editListingForm');
const closeEditModalBtn = editModal?.querySelector('.close-btn');

openModalBtn.onclick = () => addModal.style.display = 'flex';
closeModalBtn.onclick = () => addModal.style.display = 'none';
closeEditModalBtn?.addEventListener('click', () => editModal.style.display = 'none');

window.onclick = e => {
  if (e.target === addModal) addModal.style.display = 'none';
  if (e.target === editModal) editModal.style.display = 'none';
  if (e.target === profileModal) profileModal.style.display = 'none';
};

async function loadListings() {
  listingContainer.innerHTML = '';
  try {
    const res = await fetch('https://bid-it-backend.onrender.com/api/items/my', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const items = await res.json();

    activeCountEl.textContent = items.length;

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'listing-card';
      card.innerHTML = `
        <div class="listing-image">
          <img src="${item.image_url ? `https://bid-it-backend.onrender.com${item.image_url}` : 'https://via.placeholder.com/100'}" alt="${item.title}">
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
    console.error('Load listings failed:', err);
    alert('Failed to load listings.');
  }
}

// Add listing
addForm.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(addForm);

  if (!formData.get('title') || !formData.get('description') || !formData.get('starting_price') || !formData.get('category')) {
    alert('Please fill all required fields.');
    return;
  }

  const isAuctionValue = formData.get('is_auction');
  if (isAuctionValue !== 'true' && isAuctionValue !== 'false') {
    alert('Please select auction type.');
    return;
  }

  if (isAuctionValue === 'true') {
    const durationSelect = addForm.querySelector('[name="auction_duration"]');
    const selectedDuration = durationSelect?.value;
    if (!selectedDuration) {
      alert('Please select auction duration.');
      return;
    }
    formData.append('auction_duration', selectedDuration);
  }

  try {
    const res = await fetch('https://bid-it-backend.onrender.com/api/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    await loadListings();
    setTimeout(() => {
      addModal.style.display = 'none';
      addForm.reset();
    }, 100);

  } catch (err) {
    console.error('Add failed:', err);
    alert(`Failed to add listing: ${err.message}`);
  }
});

// Delete item
async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  try {
    const res = await fetch(`https://bid-it-backend.onrender.com/api/items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Delete failed');
    await loadListings();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete listing.');
  }
}

// Edit item
async function editItem(id) {
  try {
    const res = await fetch(`https://bid-it-backend.onrender.com/api/items/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch item');
    const item = await res.json();

    editForm.id.value = item.id;
    editForm.title.value = item.title;
    editForm.description.value = item.description;
    editForm.starting_price.value = item.starting_price;
    editForm.category.value = item.category || '';

    const select = editForm.querySelector('select[name="is_auction"]');
    if (select) {
      select.value = item.is_auction ? 'true' : 'false';
      toggleAuctionDurationVisibility(select, editForm);
    }

    editModal.style.display = 'flex';
  } catch (err) {
    console.error('Edit fetch failed:', err);
    alert('Failed to load item for editing.');
  }
}

editForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const id = editForm.id.value;
  const formData = new FormData(editForm);

  const isAuctionValue = formData.get('is_auction');
  if (isAuctionValue !== 'true' && isAuctionValue !== 'false') {
    alert('Please select auction type.');
    return;
  }

  if (isAuctionValue === 'true') {
    const durationSelect = editForm.querySelector('[name="auction_duration"]');
    const selectedDuration = durationSelect?.value;
    if (!selectedDuration) {
      alert('Please select auction duration.');
      return;
    }
    formData.append('auction_duration', selectedDuration);
  }

  try {
    const res = await fetch(`https://bid-it-backend.onrender.com/api/items/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }
    editModal.style.display = 'none';
    await loadListings();
  } catch (err) {
    console.error('Edit failed:', err);
    alert(`Failed to update listing: ${err.message}`);
  }
});

// Show/hide auction duration on type change
document.querySelectorAll('select[name="is_auction"]').forEach(select => {
  select.addEventListener('change', () => toggleAuctionDurationVisibility(select, select.closest('form')));
});

function toggleAuctionDurationVisibility(select, form) {
  const durationContainer = form.querySelector('.auction-duration-container');
  if (select.value === 'true') {
    durationContainer.style.display = 'block';
  } else {
    durationContainer.style.display = 'none';
  }
}

// Initial listings load
loadListings();

// Profile modal
const profileModal = document.getElementById('profileModal');
const openProfileBtn = document.getElementById('openProfileModal');
const closeProfileBtn = profileModal.querySelector('.close-btn');

openProfileBtn.onclick = async () => {
  try {
    const res = await fetch('https://bid-it-backend.onrender.com/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    document.getElementById('profileUsername').textContent = data.username || 'N/A';
    document.getElementById('profileEmail').textContent = data.email || 'N/A';
    document.getElementById('profileInstitution').textContent = data.institution || 'N/A';
    document.getElementById('profileCreatedAt').textContent = new Date(data.created_at).toLocaleDateString();

    profileModal.style.display = 'flex';
  } catch (err) {
    console.error('Failed to load profile:', err);
    alert('Could not load profile information.');
  }
};

closeProfileBtn.onclick = () => profileModal.style.display = 'none';



