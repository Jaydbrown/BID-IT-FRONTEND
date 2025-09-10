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

const API_BASE_URL = 'https://bid-it-backend.onrender.com';
let allItems = [];

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const searchOverlay = document.getElementById('searchOverlay');
  const searchIcon = document.getElementById('searchIcon');
  const closeSearchBtn = document.getElementById('closeSearch');
  const overlaySearchInput = searchOverlay.querySelector('input[type="search"]');
  const overlayCategorySelect = searchOverlay.querySelector('select[aria-label="Select category"]');
  const universitySelect = document.querySelector('.dropdown select');

  const availableAuctionList = document.getElementById('availableAuctionList');
  const notAuctionList = document.getElementById('notAuctionList');
  const seeMoreOverlay = document.getElementById('seeMoreOverlay');
  const seeMoreGrid = document.getElementById('seeMoreItemsGrid');
  const closeSeeMore = document.getElementById('closeSeeMore');
  const seeMoreSearchInput = document.querySelector('.see-more-search');
  const seeMoreCategorySelect = document.querySelector('.see-more-categories-select');

  const slides = document.querySelectorAll(".slideshow-container .slide");

  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      searchOverlay.setAttribute('aria-hidden', 'false');
      overlaySearchInput?.focus();
    });
  }
  closeSearchBtn?.addEventListener('click', resetSearchOverlay);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) resetSearchOverlay();
  });

  function resetSearchOverlay() {
    searchOverlay.classList.remove('active');
    searchOverlay.setAttribute('aria-hidden', 'true');
    overlaySearchInput.value = '';
    overlayCategorySelect.value = '';
    loadAuctionAndFixedItems();
  }

  async function fetchAllItems() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      allItems = await res.json();
    } catch (err) {
      console.error('Failed to fetch items:', err);
      allItems = [];
    }
  }

  async function loadAuctionAndFixedItems() {
    const university = universitySelect?.value || '';
    const searchTerm = overlaySearchInput?.value.trim() || '';
    const category = overlayCategorySelect?.value || '';

    const auctionItems = await fetchFilteredItems(true, university, searchTerm, category);
    const fixedItems = await fetchFilteredItems(false, university, searchTerm, category);

    renderItemList(availableAuctionList, auctionItems);
    renderItemList(notAuctionList, fixedItems);
  }

  async function fetchFilteredItems(isAuction, university, search, category) {
    const url = new URL(`${API_BASE_URL}/api/items`);
    url.searchParams.set('is_auction', isAuction);
    if (university) url.searchParams.set('university', university);
    if (search) url.searchParams.set('search', search);
    if (category) url.searchParams.set('category', category);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Fetch failed:', err);
      return [];
    }
  }

function renderItemList(container, items) {
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = '<p>No items found.</p>';
    return;
  }
  items.forEach(item => {
    const cardLink = document.createElement('a');
    cardLink.href = `product.html?id=${item.id}`;
    cardLink.className = 'auction-card';

    // Format auction timer or blank
    let timerHTML = '';
    if (item.is_auction && item.end_time) {
      const endDate = new Date(item.end_time);
      timerHTML = `
        <p class="auction-timer" data-end-time="${endDate.toISOString()}">
          Ends in: <span class="time-remaining">calculating...</span>
        </p>`;
    }

    cardLink.innerHTML = `
      <div class="image-placeholder">
        <img src="${item.image_url ? `${API_BASE_URL}${item.image_url}` : 'https://via.placeholder.com/150'}" alt="${item.title}" />
      </div>
      <div class="card-content">
        <h3 class="product-name">${item.title}</h3>
        <p class="product-description">${item.description.slice(0, 60)}...</p>
        <p class="price">₦${item.starting_price?.toLocaleString() || 0}</p>
        <p class="seller-info">Seller: ${item.seller_username || 'Unknown'}</p>
        ${timerHTML}
      </div>`;

    container.appendChild(cardLink);
  });

  // Start updating countdowns for all auction timers
  updateCountdowns();
}

function updateCountdowns() {
  const timers = document.querySelectorAll('.auction-timer');
  timers.forEach(timer => {
    const endTime = new Date(timer.dataset.endTime);
    const remainingEl = timer.querySelector('.time-remaining');
    if (!remainingEl) return;

    const update = () => {
      const now = new Date();
      const diff = endTime - now;
      if (diff <= 0) {
        remainingEl.textContent = 'Auction ended';
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      remainingEl.textContent = `${hours}h ${minutes}m ${seconds}s`;
    };

    update(); // Initial call
    setInterval(update, 1000); // Update every second
  });
}

  let seeMoreType = null;
  document.querySelectorAll('.see-more-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      seeMoreType = btn.dataset.type; // remember type for live filtering
      await loadSeeMoreItems();
      seeMoreOverlay.classList.add('active');
      seeMoreOverlay.setAttribute('aria-hidden', 'false');
    });
  });

  closeSeeMore?.addEventListener('click', () => {
    seeMoreOverlay.classList.remove('active');
    seeMoreOverlay.setAttribute('aria-hidden', 'true');
    seeMoreGrid.innerHTML = '';
    seeMoreSearchInput.value = '';
    seeMoreCategorySelect.value = '';
  });

  async function loadSeeMoreItems() {
    const search = seeMoreSearchInput?.value.trim() || '';
    const category = seeMoreCategorySelect?.value || '';
    const isAuction = seeMoreType === 'auction';
    const university = universitySelect?.value || '';

    const filteredItems = await fetchFilteredItems(isAuction, university, search, category);
    seeMoreGrid.innerHTML = '';
    if (!filteredItems.length) {
      seeMoreGrid.innerHTML = '<p>No items found.</p>';
      return;
    }
    filteredItems.forEach(item => {
      const link = document.createElement('a');
      link.href = `product.html?id=${item.id}`;
      link.className = 'grid-item';
      link.innerHTML = `
        <img src="${item.image_url ? `${API_BASE_URL}${item.image_url}` : 'https://via.placeholder.com/150'}" alt="${item.title}" />
        <p>${item.title}</p>
        <p>₦${item.starting_price?.toLocaleString() || 0}</p>`;
      seeMoreGrid.appendChild(link);
    });
  }

  const debouncedLoad = debounce(loadAuctionAndFixedItems, 300);
  const debouncedSeeMoreLoad = debounce(loadSeeMoreItems, 300);

  overlaySearchInput?.addEventListener('input', debouncedLoad);
  overlayCategorySelect?.addEventListener('change', loadAuctionAndFixedItems);
  universitySelect?.addEventListener('change', loadAuctionAndFixedItems);

  // NEW: Live See More search and category
  seeMoreSearchInput?.addEventListener('input', debouncedSeeMoreLoad);
  seeMoreCategorySelect?.addEventListener('change', loadSeeMoreItems);

  let currentSlide = 0;
  function showSlide(index) {
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  }
  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }
  showSlide(currentSlide);
  setInterval(nextSlide, 4000);

  await fetchAllItems();
  await loadAuctionAndFixedItems();
});

