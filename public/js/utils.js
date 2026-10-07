// ===== API BASE =====
const API_BASE = '/api';

// ===== AUTH HELPERS =====
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

function requireAuth(requiredRole) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = '/';
    return false;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = '/';
    return false;
  }
  return true;
}

// ===== API FETCH WRAPPER =====
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (response.status === 401) {
      logout();
      return null;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}

// ===== UI HELPERS =====
function showAlert(elementId, message, type = 'danger') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = message;
  setTimeout(() => { el.classList.remove('show'); }, 5000);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour > 12 ? hour - 12 : hour}:${m} ${ampm}`;
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function statusBadge(status) {
  const map = {
    scheduled: 'badge-info',
    ongoing: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    present: 'badge-success',
    absent: 'badge-danger',
    flagged: 'badge-warning',
    pending: 'badge-secondary'
  };
  return `<span class="badge ${map[status] || 'badge-secondary'}">${status}</span>`;
}

// ===== SIDEBAR TOGGLE (Mobile) =====
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}

// Close sidebar on overlay click (mobile)
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.querySelector('.hamburger');
  if (sidebar && sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// ===== MODAL HELPERS =====
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}
