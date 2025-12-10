<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE_URL } from '../../config'
import '/public/css/style.css'

const showSidebar = ref(true)
const showProfileDropdown = ref(false)
const showNotifDropdown = ref(false)
const isNarrow = ref(false)
const router = useRouter()
const route = useRoute()

// Notifications state
const notifications = ref([])
const loadingNotifs = ref(false)
const notifError = ref('')

function toggleSidebar() {
  showSidebar.value = !showSidebar.value
}
function toggleProfileDropdown() {
  showProfileDropdown.value = !showProfileDropdown.value
  showNotifDropdown.value = false
}
function toggleNotifDropdown() {
  showNotifDropdown.value = !showNotifDropdown.value
  showProfileDropdown.value = false
  if (showNotifDropdown.value) {
    fetchNotifications()
  }
}
function checkNarrow() {
  isNarrow.value = window.innerWidth <= 900
}
function goTo(path) {
  router.push(path)
  if (isNarrow.value) {
    showSidebar.value = false
  }
}

// Get staff ID from localStorage
function getStaffId() {
  const userData = localStorage.getItem('domus_user')
  if (!userData) return null
  const user = JSON.parse(userData)
  return user.id || user.docId || user.userId
}

// Fetch notifications
async function fetchNotifications() {
  const staffId = getStaffId()
  if (!staffId) return

  loadingNotifs.value = true
  notifError.value = ''

  try {
    const res = await fetch(`${API_BASE_URL}/api/staff/notifications?staffId=${staffId}&limit=20`)
    const json = await res.json()
    if (json.success) {
      notifications.value = json.data || []
    } else {
      notifError.value = json.message || 'Failed to load notifications'
    }
  } catch (e) {
    notifError.value = 'Network error'
  } finally {
    loadingNotifs.value = false
  }
}

// Mark single notification as read
async function markAsRead(notif) {
  if (notif.read) return

  try {
    await fetch(`${API_BASE_URL}/api/staff/mark-notification-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: notif.id })
    })
    notif.read = true
  } catch (e) {
    console.error('Failed to mark as read:', e)
  }
}

// Mark all as read
async function markAllAsRead() {
  const staffId = getStaffId()
  if (!staffId) return

  try {
    await fetch(`${API_BASE_URL}/api/staff/mark-all-notifications-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId })
    })
    notifications.value.forEach(n => (n.read = true))
  } catch (e) {
    console.error('Failed to mark all as read:', e)
  }
}

// Handle notification click
function handleNotifClick(notif) {
  markAsRead(notif)
  showNotifDropdown.value = false

  // Navigate based on notification type
  if (notif.type === 'task_created' || notif.type === 'task_assigned') {
    router.push('/staff/tasks')
  } else if (notif.type === 'staff_assigned' || notif.type === 'created_project') {
    router.push('/staff/projects')
  } else {
    router.push('/staff')
  }
}

// Computed
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

// Time ago helper
function timeAgo(date) {
  if (!date) return ''
  const d = new Date(date)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const dd = Math.floor(h / 24)
  if (dd < 7) return `${dd}d ago`
  return d.toLocaleDateString()
}

// Get icon for notification type
function getNotifIcon(type) {
  const icons = {
    staff_assigned: '📋',
    staff_removed: '🚫',
    task_created: '✅',
    task_assigned: '📝',
    created_project: '🏗️',
    file_upload: '📄',
    message: '💬',
    default: '🔔'
  }
  return icons[type] || icons.default
}

async function logout() {
  const userData = localStorage.getItem('domus_user')
  if (userData) {
    const user = JSON.parse(userData)
    await fetch(`${API_BASE_URL}/api/admin/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, status: 'offline' })
    })
  }
  localStorage.removeItem('domus_user')
  showProfileDropdown.value = false
  router.push('/login')
}

const staff = ref(null)

// Close dropdowns when clicking outside
function handleClickOutside(e) {
  if (!e.target.closest('.profile-menu') && !e.target.closest('.notif-menu')) {
    showProfileDropdown.value = false
    showNotifDropdown.value = false
  }
}

onMounted(() => {
  checkNarrow()
  window.addEventListener('resize', checkNarrow)
  document.addEventListener('click', handleClickOutside)
  const userData = localStorage.getItem('domus_user')
  staff.value = userData ? JSON.parse(userData) : null
  
  // Initial fetch of notifications
  fetchNotifications()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkNarrow)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="admin-layout">
    <!-- Topbar -->
    <header class="admin-topbar">
      <button class="sidebar-toggle-btn" @click="toggleSidebar">
        <svg width="28" height="28" fill="none" stroke="#213547" stroke-width="2">
          <path d="M4 7h20M4 14h20M4 21h20"/>
        </svg>
      </button>
      <span class="topbar-title">DOMUS</span>
      <div class="topbar-actions">
        <!-- Notification Bell -->
        <div class="notif-menu">
          <button class="notif-btn" @click.stop="toggleNotifDropdown" title="Notifications">
            <svg width="26" height="26" fill="none" stroke="#213547" stroke-width="2">
              <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          </button>
          
          <!-- Notification Dropdown -->
          <div v-if="showNotifDropdown" class="notif-dropdown" @click.stop>
            <div class="notif-header">
              <h3>Notifications</h3>
              <button v-if="unreadCount > 0" class="mark-all-btn" @click="markAllAsRead">
                Mark all as read
              </button>
            </div>
            
            <div class="notif-body">
              <!-- Loading -->
              <div v-if="loadingNotifs" class="notif-loading">
                <div class="spinner-small"></div>
                <span>Loading...</span>
              </div>
              
              <!-- Error -->
              <div v-else-if="notifError" class="notif-error">
                <p>{{ notifError }}</p>
                <button @click="fetchNotifications">Retry</button>
              </div>
              
              <!-- Empty -->
              <div v-else-if="notifications.length === 0" class="notif-empty">
                <svg width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5">
                  <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p>No notifications yet</p>
              </div>
              
              <!-- Notification List -->
              <ul v-else class="notif-list">
                <li 
                  v-for="notif in notifications" 
                  :key="notif.id"
                  :class="['notif-item', { unread: !notif.read }]"
                  @click="handleNotifClick(notif)"
                >
                  <div class="notif-icon" :class="notif.type">
                    {{ getNotifIcon(notif.type) }}
                  </div>
                  <div class="notif-content">
                    <p class="notif-message">{{ notif.message }}</p>
                    <span class="notif-time">{{ timeAgo(notif.createdAt) }}</span>
                  </div>
                  <div v-if="!notif.read" class="unread-dot"></div>
                </li>
              </ul>
            </div>
            
            <div class="notif-footer">
              <button @click="goTo('/staff'); showNotifDropdown = false">
                See all notifications
              </button>
            </div>
          </div>
        </div>
        
        <!-- Profile Menu -->
        <div class="profile-menu">
          <span class="profile-icon" @click.stop="toggleProfileDropdown">
            <img 
              v-if="staff?.profilePic" 
              :src="staff.profilePic" 
              class="profile-img" 
              alt="Profile"
            />
            <img 
              v-else 
              src="https://ui-avatars.com/api/?name=Staff&background=e6b23a&color=fff" 
              class="profile-img" 
              alt="Profile"
            />
          </span>
          <div v-if="showProfileDropdown" class="profile-dropdown">
            <div class="profile-info">
              <img 
                v-if="staff?.profilePic" 
                :src="staff.profilePic" 
                class="profile-img" 
                alt="Profile"
              />
              <img 
                v-else 
                src="https://ui-avatars.com/api/?name=Staff&background=e6b23a&color=fff" 
                class="profile-img" 
                alt="Profile"
              />
              <span class="profile-name">{{ staff?.firstname }} {{ staff?.lastname }}</span>
            </div>
            <button class="logout-btn" @click="logout">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Body -->
    <div class="admin-body">
      <!-- Sidebar -->
      <aside 
        class="admin-sidebar" 
        :class="{ 
          collapsed: !showSidebar && !isNarrow, 
          hideall: !showSidebar && isNarrow,
          mobilefull: showSidebar && isNarrow 
        }"
      >
        <nav class="sidebar-nav">
          <div class="logo-link">
            <img src="../../assets/domus.png" alt="Logo" class="sidebar-logo" />
            <span class="sidebar-title">DOMUS</span>
          </div>
          <div 
            class="sidebar-link" 
            :class="{ active: route.path === '/staff' || route.path === '/staff/' }"
            @click="goTo('/staff')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </span>
            <span class="sidebar-text">Overview</span>
          </div>
          <div 
            class="sidebar-link" 
            :class="{ active: route.path.startsWith('/staff/projects') }"
            @click="goTo('/staff/projects')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <span class="sidebar-text">Projects</span>
          </div>
          <div 
            class="sidebar-link" 
            :class="{ active: route.path.startsWith('/staff/tasks') }"
            @click="goTo('/staff/tasks')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </span>
            <span class="sidebar-text">Tasks</span>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="admin-main">
        <div class="admin-content-scroll">
          <div class="admin-content">
            <router-view />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f7f7f7;
  height: 100vh;
  overflow: hidden;
}
.admin-topbar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 18px;
  height: 70px;
  box-shadow: 0 2px 12px #e6b23a22;
  position: relative;
  z-index: 10;
  justify-content: flex-start;
}
.sidebar-toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
}
.topbar-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e6b23a;
  letter-spacing: 1px;
  margin-right: auto;
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}

/* Notification Menu */
.notif-menu {
  position: relative;
}
.notif-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  position: relative;
  transition: background 0.2s;
}
.notif-btn:hover {
  background: #f5f5f5;
}
.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #c62828;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* Notification Dropdown */
.notif-dropdown {
  position: absolute;
  top: 48px;
  right: 0;
  width: 360px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
  animation: dropdownIn 0.2s ease;
}
@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.notif-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #213547;
}
.mark-all-btn {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.mark-all-btn:hover {
  text-decoration: underline;
}

.notif-body {
  max-height: 400px;
  overflow-y: auto;
}

.notif-loading, .notif-error, .notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #888;
}
.notif-loading .spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid #f0f0f0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.notif-error button {
  margin-top: 10px;
  background: #1976d2;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.notif-empty svg {
  margin-bottom: 10px;
  opacity: 0.5;
}
.notif-empty p {
  margin: 0;
  font-size: 0.95rem;
}

.notif-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.notif-item:hover {
  background: #f8f8f8;
}
.notif-item.unread {
  background: #f0f7ff;
}
.notif-item.unread:hover {
  background: #e3f0fc;
}

.notif-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: #f0f0f0;
  flex-shrink: 0;
}
.notif-icon.staff_assigned { background: #e3f0fc; }
.notif-icon.staff_removed { background: #ffebee; }
.notif-icon.task_created, .notif-icon.task_assigned { background: #e8f5e9; }
.notif-icon.created_project { background: #fff7e1; }
.notif-icon.file_upload { background: #f3e5f5; }
.notif-icon.message { background: #e3f2fd; }

.notif-content {
  flex: 1;
  min-width: 0;
}
.notif-message {
  margin: 0 0 4px;
  font-size: 0.9rem;
  color: #213547;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.notif-time {
  font-size: 0.78rem;
  color: #888;
}

.unread-dot {
  width: 10px;
  height: 10px;
  background: #1976d2;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

.notif-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}
.notif-footer button {
  background: none;
  border: none;
  color: #1976d2;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}
.notif-footer button:hover {
  text-decoration: underline;
}

/* Profile Menu */
.profile-menu {
  position: relative;
  display: inline-block;
}
.profile-icon {
  cursor: pointer;
  display: flex;
  align-items: center;
}
.profile-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e6b23a;
  object-fit: cover;
}
.profile-dropdown {
  position: absolute;
  top: 44px;
  right: 0;
  background: #fff;
  min-width: 220px;
  box-shadow: 0 4px 24px #0002;
  border-radius: 12px;
  padding: 18px 18px 12px 18px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.profile-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.profile-info .profile-img {
  width: 38px;
  height: 38px;
  margin-right: 12px;
}
.profile-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: #213547;
}
.logout-btn {
  background: none;
  border: none;
  color: #c62828;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 0 0 0;
  transition: color 0.18s;
}
.logout-btn:hover {
  color: #a31515;
}

/* Sidebar & Layout */
.admin-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.admin-sidebar {
  width: 260px;
  background: #213547;
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
  min-width: 64px;
  z-index: 20;
  position: relative;
  height: auto;
}
.admin-sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}
.admin-sidebar.hideall {
  display: none !important;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 8px;
}
.logo-link {
  margin-bottom: 10px;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 0;
  display: flex;
}
.sidebar-link {
  color: #fff;
  text-decoration: none;
  font-size: 1.07rem;
  padding: 10px 8px;
  border-radius: 8px;
  transition: background 0.18s, color 0.18s;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 44px;
  justify-content: flex-start;
}
.sidebar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 38px;
}
.sidebar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e6b23a;
  letter-spacing: 2px;
  margin-left: 12px;
  transition: opacity 0.2s;
}
.admin-sidebar.collapsed .sidebar-title {
  display: none;
}
.sidebar-text {
  transition: opacity 0.2s;
}
.admin-sidebar.collapsed .sidebar-text {
  display: none;
}
.sidebar-link.active,
.sidebar-link:hover {
  background: #e6b23a33;
  color: #e6b23a;
}
.sidebar-logo {
  width: 38px;
  height: 38px;
}
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
}
.admin-content-scroll {
  flex: 1;
  height: 100%;
  overflow-y: auto;
}
.admin-content {
  padding: 18px;
  min-height: 100%;
}
.admin-sidebar.mobilefull {
  position: fixed;
  top: 70px;
  left: 0;
  bottom: 0;
  width: 260px;
  z-index: 100;
}

@media (max-width: 1200px) {
  .admin-sidebar { width: 220px; }
}
@media (max-width: 900px) {
  .admin-sidebar { width: 64px; }
  .admin-sidebar.mobilefull { width: 220px; }
  .notif-dropdown { width: 320px; }
}
@media (max-width: 600px) {
  .admin-content { padding: 10px; }
  .notif-dropdown { width: 100vw; right: -18px; border-radius: 0 0 12px 12px; }
}
</style>