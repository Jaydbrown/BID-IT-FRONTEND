// ========================================
// BID IT - COMPLETE ADMIN DASHBOARD JS
// ========================================

// ==========================
// CONSTANTS
// ==========================
const API_BASE_URL = 'https://bid-it-backend.onrender.com/api';
const ADMIN_CREDENTIALS = {
  email: 'jaiyeolawety705@gmail.com',
  password: 'jaiyeola'
};

// ==========================
// BYPASS PROVIDER.JS
// ==========================
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
// AUTHENTICATION
// ==========================

// Check if admin is logged in
function checkAuth() {
  const isLoggedIn = localStorage.getItem('adminLoggedIn');
  const adminToken = localStorage.getItem('adminToken');
  
  if (isLoggedIn === 'true' && adminToken) {
    showDashboard();
  } else {
    showLoginPage();
  }
}

// Show login page
function showLoginPage() {
  const loginPage = document.getElementById('loginPage');
  const adminDashboard = document.getElementById('adminDashboard');
  
  if (loginPage) loginPage.style.display = 'flex';
  if (adminDashboard) adminDashboard.style.display = 'none';
}

// Show dashboard
function showDashboard() {
  const loginPage = document.getElementById('loginPage');
  const adminDashboard = document.getElementById('adminDashboard');
  
  if (loginPage) loginPage.style.display = 'none';
  if (adminDashboard) adminDashboard.style.display = 'block';
  
  loadDashboardData();
}

// Admin Login
const adminLoginForm = document.getElementById('loginForm');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');

    // Show loading
    const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;

    try {
      // Check hardcoded credentials first
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminToken', 'admin-master-token');
        showToast('Login successful!', 'success');
        showDashboard();
        return;
      }

      // Try backend authentication
      const response = await cleanFetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminToken', data.token);
        showToast('Login successful!', 'success');
        showDashboard();
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      errorMsg.textContent = 'Invalid email or password';
      errorMsg.classList.add('show');
      setTimeout(() => {
        errorMsg.classList.remove('show');
      }, 3000);
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminToken');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
      location.reload();
    }, 1000);
  }
}

// ==========================
// UTILITY FUNCTIONS
// ==========================

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
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

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.style.cssText = `
    position: fixed;
    top: 100px;
    right: 2rem;
    z-index: 4000;
  `;
  document.body.appendChild(container);
  return container;
}

// Format Currency
function formatCurrency(amount) {
  return `₦${parseFloat(amount || 0).toLocaleString()}`;
}

// Format Date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Get Auth Headers
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  };
}

// ==========================
// SIDEBAR FUNCTIONS
// ==========================

// Toggle Sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
  }
}

// Show Section
function showSection(section) {
  // Hide all sections
  document.querySelectorAll('.content-area > div').forEach(div => {
    if (div.id && div.id.endsWith('Section')) {
      div.style.display = 'none';
    }
  });

  // Remove active class from all menu items
  document.querySelectorAll('.sidebar-menu a').forEach(a => {
    a.classList.remove('active');
  });

  // Show selected section
  const sectionMap = {
    'dashboard': 'dashboardSection',
    'users': 'usersSection',
    'products': 'productsSection',
    'orders': 'ordersSection',
    'auctions': 'auctionsSection',
    'flash-sales': 'flashSalesSection',
    'universities': 'universitiesSection',
    'reports': 'reportsSection',
    'analytics': 'analyticsSection',
    'settings': 'settingsSection'
  };

  const sectionId = sectionMap[section];
  const sectionElement = document.getElementById(sectionId);
  
  if (sectionElement) {
    sectionElement.style.display = 'block';
  }

  // Update page title
  const titles = {
    'dashboard': 'Dashboard Overview',
    'users': 'Users Management',
    'products': 'Products Management',
    'orders': 'Orders Management',
    'auctions': 'Auctions Management',
    'flash-sales': 'Flash Sales Management',
    'universities': 'Universities Management',
    'reports': 'Reports & Flags',
    'analytics': 'Analytics',
    'settings': 'Settings'
  };
  
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = titles[section];
  }

  // Add active class to clicked menu item
  if (event && event.target) {
    event.target.closest('a').classList.add('active');
  }

  // Load section-specific data
  if (section === 'users') loadUsers();
  if (section === 'products') loadProducts();
  if (section === 'orders') loadOrders();
  if (section === 'auctions') loadAuctions();
}

// ==========================
// DASHBOARD DATA
// ==========================

async function loadDashboardData() {
  try {
    console.log('Loading dashboard data...');
    
    // Load all items
    const itemsResponse = await cleanFetch(`${API_BASE_URL}/items`);
    const items = itemsResponse.ok ? await itemsResponse.json() : [];

    // Calculate stats
    const totalProducts = items.length;
    const activeAuctions = items.filter(item => item.is_auction).length;
    const totalRevenue = items.reduce((sum, item) => sum + parseFloat(item.starting_price || 0), 0);

    // Update stats on page
    updateStat('totalProducts', totalProducts);
    updateStat('totalRevenue', formatCurrency(totalRevenue));
    updateStat('totalUsers', '1,234'); // Mock data
    updateStat('totalOrders', '432'); // Mock data

    // Load recent orders
    loadRecentOrders(items.slice(0, 5));

    console.log('Dashboard data loaded successfully');
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showToast('Failed to load dashboard data', 'error');
  }
}

function updateStat(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

function loadRecentOrders(items) {
  const tbody = document.getElementById('recentOrdersTable');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No recent orders</td></tr>';
    return;
  }

  tbody.innerHTML = items.map((item, index) => `
    <tr>
      <td>#ORD${1000 + index}</td>
      <td>${item.seller_username || 'N/A'}</td>
      <td>${item.title}</td>
      <td>${formatCurrency(item.starting_price)}</td>
      <td><span class="status-badge status-active">Active</span></td>
      <td>${formatDate(item.created_at)}</td>
    </tr>
  `).join('');
}

// ==========================
// USERS MANAGEMENT
// ==========================

async function loadUsers() {
  const tbody = document.getElementById('usersTable');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading users...</td></tr>';

  try {
    // Try to fetch real users (this endpoint might not exist yet)
    // For now, we'll use mock data
    const mockUsers = [
      { 
        id: 1, 
        username: 'John Doe', 
        email: 'john@example.com', 
        institution: 'UNIBEN', 
        created_at: '2024-01-15',
        role: 'Buyer',
        status: 'Active'
      },
      { 
        id: 2, 
        username: 'Jane Smith', 
        email: 'jane@example.com', 
        institution: 'UNILAG', 
        created_at: '2024-02-20',
        role: 'Seller',
        status: 'Active'
      },
      { 
        id: 3, 
        username: 'Mike Johnson', 
        email: 'mike@example.com', 
        institution: 'ABU', 
        created_at: '2024-03-10',
        role: 'Both',
        status: 'Pending'
      }
    ];

    renderUsersTable(mockUsers);
  } catch (error) {
    console.error('Error loading users:', error);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #dc3545;">Failed to load users</td></tr>';
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTable');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.institution}</td>
      <td>${user.role || 'Buyer'}</td>
      <td><span class="status-badge status-${user.status?.toLowerCase() || 'active'}">${user.status || 'Active'}</span></td>
      <td>${formatDate(user.created_at)}</td>
      <td class="action-buttons">
        <button class="action-btn view" onclick="viewUser(${user.id})" title="View">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn edit" onclick="editUser(${user.id})" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete" onclick="deleteUser(${user.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function searchUsers() {
  const searchInput = document.querySelector('#usersSection .search-box');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll('#usersTable tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function viewUser(userId) {
  showToast(`Viewing user ${userId}`, 'success');
  // Implement view user modal
}

function editUser(userId) {
  showToast(`Editing user ${userId}`, 'success');
  // Implement edit user modal
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    showToast('Deleting user...', 'success');
    // Implement delete API call
    setTimeout(() => {
      showToast('User deleted successfully', 'success');
      loadUsers();
    }, 1000);
  } catch (error) {
    showToast('Failed to delete user', 'error');
  }
}

// ==========================
// PRODUCTS MANAGEMENT
// ==========================

async function loadProducts() {
  const tbody = document.getElementById('productsTable');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading products...</td></tr>';

  try {
    const response = await cleanFetch(`${API_BASE_URL}/items`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const products = await response.json();
    renderProductsTable(products);
  } catch (error) {
    console.error('Error loading products:', error);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #dc3545;">Failed to load products</td></tr>';
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTable');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No products found</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(product => `
    <tr>
      <td>${product.id}</td>
      <td>${product.title}</td>
      <td>${product.category || 'N/A'}</td>
      <td>${formatCurrency(product.starting_price)}</td>
      <td>${product.seller_username || 'N/A'}</td>
      <td><span class="status-badge status-active">Active</span></td>
      <td>${product.views || 0}</td>
      <td class="action-buttons">
        <button class="action-btn view" onclick="viewProduct(${product.id})" title="View">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn edit" onclick="createFlashSaleForProduct(${product.id})" title="Create Flash Sale">
          <i class="fas fa-bolt"></i>
        </button>
        <button class="action-btn delete" onclick="deleteProduct(${product.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function searchProducts() {
  const searchInput = document.querySelector('#productsSection .search-box');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll('#productsTable tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function viewProduct(productId) {
  window.open(`productDetail.html?id=${productId}`, '_blank');
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const response = await cleanFetch(`${API_BASE_URL}/items/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      showToast('Product deleted successfully', 'success');
      loadProducts();
    } else {
      throw new Error('Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    showToast('Failed to delete product', 'error');
  }
}

// ==========================
// FLASH SALES
// ==========================

function createFlashSaleForProduct(productId) {
  const modal = document.getElementById('flashSaleModal');
  if (modal) {
    document.getElementById('flashProductId').value = productId;
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function openCreateFlashSale() {
  const modal = document.getElementById('flashSaleModal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function closeFlashSaleModal() {
  const modal = document.getElementById('flashSaleModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.getElementById('flashSaleForm').reset();
  }
}

const flashSaleForm = document.getElementById('flashSaleForm');
if (flashSaleForm) {
  flashSaleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('flashProductId').value;
    const flashPrice = document.getElementById('flashPrice').value;
    const discountPercentage = document.getElementById('flashDiscount').value;
    const endTime = document.getElementById('flashEndTime').value;
    const quantityLimit = document.getElementById('flashQuantity').value;

    const submitBtn = flashSaleForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    submitBtn.disabled = true;

    try {
      const response = await cleanFetch(`${API_BASE_URL}/flash-sales`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId,
          flashPrice: parseFloat(flashPrice),
          discountPercentage: parseInt(discountPercentage),
          endTime,
          quantityLimit: quantityLimit ? parseInt(quantityLimit) : null
        })
      });

      if (response.ok) {
        showToast('Flash sale created successfully!', 'success');
        closeFlashSaleModal();
        flashSaleForm.reset();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create flash sale');
      }
    } catch (error) {
      console.error('Error creating flash sale:', error);
      showToast(error.message || 'Failed to create flash sale', 'error');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// ==========================
// ORDERS MANAGEMENT
// ==========================

async function loadOrders() {
  const container = document.getElementById('ordersSection');
  if (!container) return;

  container.innerHTML = `
    <div class="data-table-section">
      <div class="table-header">
        <h3>All Orders</h3>
        <div class="table-actions">
          <input type="search" class="search-box" placeholder="Search orders..." onkeyup="searchOrders()" />
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="ordersTable">
          <tr><td colspan="7" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  // Mock orders data
  const mockOrders = [
    { id: 1, customer: 'John Doe', product: 'Engineering Textbook', amount: 5500, status: 'Completed', date: '2025-01-15' },
    { id: 2, customer: 'Jane Smith', product: 'HP Laptop', amount: 85000, status: 'Pending', date: '2025-01-14' },
    { id: 3, customer: 'Mike Johnson', product: 'Designer Sneakers', amount: 12000, status: 'Completed', date: '2025-01-13' }
  ];

  const tbody = document.getElementById('ordersTable');
  tbody.innerHTML = mockOrders.map(order => `
    <tr>
      <td>#ORD${1000 + order.id}</td>
      <td>${order.customer}</td>
      <td>${order.product}</td>
      <td>${formatCurrency(order.amount)}</td>
      <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
      <td>${formatDate(order.date)}</td>
      <td class="action-buttons">
        <button class="action-btn view" onclick="viewOrder(${order.id})" title="View">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function searchOrders() {
  const searchInput = document.querySelector('#ordersSection .search-box');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll('#ordersTable tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function viewOrder(orderId) {
  showToast(`Viewing order ${orderId}`, 'success');
}

// ==========================
// AUCTIONS MANAGEMENT
// ==========================

async function loadAuctions() {
  const container = document.getElementById('auctionsSection');
  if (!container) return;

  container.innerHTML = `
    <div class="data-table-section">
      <h3>Active Auctions</h3>
      <p style="text-align: center; padding: 2rem; color: #6c757d;">
        <i class="fas fa-spinner fa-spin"></i> Loading auctions...
      </p>
    </div>
  `;

  try {
    const response = await cleanFetch(`${API_BASE_URL}/items?is_auction=true`);
    const auctions = response.ok ? await response.json() : [];

    container.innerHTML = `
      <div class="data-table-section">
        <div class="table-header">
          <h3>Active Auctions (${auctions.length})</h3>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
          ${auctions.length === 0 
            ? '<p style="text-align: center; padding: 2rem; color: #6c757d;">No active auctions</p>'
            : auctions.map(auction => `
              <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h4>${auction.title}</h4>
                <p style="color: #6c757d; margin: 0.5rem 0;">Starting: ${formatCurrency(auction.starting_price)}</p>
                <p style="color: #4361ee; font-weight: 600;">Current: ${formatCurrency(auction.current_highest_bid || auction.starting_price)}</p>
                <p style="font-size: 0.85rem; color: #856404; background: #fff3cd; padding: 0.5rem; border-radius: 6px; margin-top: 1rem;">
                  Ends: ${formatDate(auction.auction_end_time)}
                </p>
                <button onclick="viewProduct(${auction.id})" class="btn btn-primary btn-sm" style="width: 100%; margin-top: 1rem;">
                  View Details
                </button>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading auctions:', error);
    container.innerHTML = `
      <div class="data-table-section">
        <p style="text-align: center; padding: 2rem; color: #dc3545;">Failed to load auctions</p>
      </div>
    `;
  }
}

// ==========================
// INITIALIZE
// ==========================

// Add CSS animations
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

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin Dashboard JS Loaded');
  checkAuth();
});

// Close modals when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
    e.target.classList.remove('active');
  }
});

console.log('BID IT Admin Dashboard JavaScript Loaded Successfully');
