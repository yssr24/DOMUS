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

// Admin user data
const admin = ref(null)

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
  if (showNotifDropdown.value && notifications.value.length === 0) {
    fetchNotifications()
  }
}

// Get admin ID from localStorage
function getAdminId() {
  const userData = localStorage.getItem('domus_user')
  if (!userData) return null
  const user = JSON.parse(userData)
  return user.id || user.docId || user.userId
}

// Fetch notifications
async function fetchNotifications() {
  const adminId = getAdminId()
  if (!adminId) return

  loadingNotifs.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/notifications?adminId=${adminId}&limit=20`)
    const json = await res.json()
    if (json.success) {
      notifications.value = json.data || []
    }
  } catch (e) {
    console.error('Failed to fetch notifications:', e)
  } finally {
    loadingNotifs.value = false
  }
}

// Mark single notification as read
async function markAsRead(notif) {
  if (notif.read) return
  try {
    await fetch(`${API_BASE_URL}/api/admin/mark-notification-read`, {
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
  const adminId = getAdminId()
  if (!adminId) return
  try {
    await fetch(`${API_BASE_URL}/api/admin/mark-all-notifications-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
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
    router.push('/admin/task-management')
  } else if (notif.type === 'created_project' || notif.type === 'project_update') {
    router.push('/admin/project-management')
  } else if (notif.type === 'file_upload') {
    router.push('/admin/file-and-document')
  } else if (notif.type === 'message' || notif.type === 'contact') {
    router.push('/admin/client-portal')
  } else {
    router.push('/admin')
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
    created_project: '🏗️',
    project_update: '📋',
    staff_assigned: '👷',
    staff_removed: '🚫',
    task_created: '✅',
    task_assigned: '📝',
    file_upload: '📄',
    message: '💬',
    contact: '📧',
    user_registered: '👤'
  }
  return icons[type] || '🔔'
}

// Close dropdowns when clicking outside
function handleClickOutside(e) {
  if (!e.target.closest('.profile-menu') && !e.target.closest('.notif-wrapper')) {
    showProfileDropdown.value = false
    showNotifDropdown.value = false
  }
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

function checkNarrow() {
  isNarrow.value = window.innerWidth <= 900
}

onMounted(() => {
  checkNarrow()
  window.addEventListener('resize', checkNarrow)
  document.addEventListener('click', handleClickOutside)
  const userData = localStorage.getItem('domus_user')
  admin.value = userData ? JSON.parse(userData) : null
  fetchNotifications()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkNarrow)
  document.removeEventListener('click', handleClickOutside)
})

// Navigation for sidebar
function goTo(path) {
  router.push(path)
  if (isNarrow.value) {
    showSidebar.value = false
  }
}
</script>

<template>
  <div class="admin-layout">
    <header class="admin-topbar">
      <button class="sidebar-toggle-btn" @click="toggleSidebar">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="2" rx="1" fill="#e6b23a"/><rect x="4" y="11" width="16" height="2" rx="1" fill="#e6b23a"/><rect x="4" y="16" width="16" height="2" rx="1" fill="#e6b23a"/></svg>
      </button>
      <div class="topbar-title" v-show="!isNarrow">DOMUS</div>
      <div class="topbar-actions">
        <div class="topbar-search">
          <input type="text" placeholder="Search..." />
        </div>
        
        <!-- Notification Button with Dropdown -->
        <div class="notif-wrapper">
          <button class="notif-btn" title="Notifications" @click.stop="toggleNotifDropdown">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 10-3 0v.68C7.63 5.36 6 7.92 6 11v5l-1.7 1.7a1 1 0 00.7 1.7h14a1 1 0 00.7-1.7L18 16z" fill="#e6b23a"/></svg>
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          </button>
          
          <!-- Notification Dropdown -->
          <div v-if="showNotifDropdown" class="notif-dropdown" @click.stop>
            <div class="notif-header">
              <h3>Notifications</h3>
              <button v-if="unreadCount > 0" class="mark-all-btn" @click="markAllAsRead">Mark all read</button>
            </div>
            
            <div class="notif-body">
              <div v-if="loadingNotifs" class="notif-loading">
                <div class="spinner-small"></div>
              </div>
              
              <div v-else-if="notifications.length === 0" class="notif-empty">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 10-3 0v.68C7.63 5.36 6 7.92 6 11v5l-1.7 1.7a1 1 0 00.7 1.7h14a1 1 0 00.7-1.7L18 16z" fill="#ccc"/></svg>
                <p>No notifications</p>
              </div>
              
              <ul v-else class="notif-list">
                <li 
                  v-for="notif in notifications" 
                  :key="notif.id"
                  :class="['notif-item', { unread: !notif.read }]"
                  @click="handleNotifClick(notif)"
                >
                  <div class="notif-icon">{{ getNotifIcon(notif.type) }}</div>
                  <div class="notif-content">
                    <p class="notif-message">{{ notif.message }}</p>
                    <span class="notif-time">{{ timeAgo(notif.createdAt) }}</span>
                  </div>
                  <div v-if="!notif.read" class="unread-dot"></div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="profile-menu">
          <span class="profile-icon" @click.stop="toggleProfileDropdown">
            <img src="../../assets/domus.png" alt="Profile" class="profile-img" />
          </span>
          <div v-if="showProfileDropdown" class="profile-dropdown">
            <div class="profile-info">
              <img src="../../assets/domus.png" alt="Profile" class="profile-img" />
              <span class="profile-name">{{ admin?.firstname || 'Admin' }}</span>
            </div>
            <button class="logout-btn" @click="logout">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" style="vertical-align:middle;margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="#c62828" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
    <div class="admin-body">
      <aside
        :class="[
          'admin-sidebar',
          { collapsed: !showSidebar },
          { hideall: isNarrow && !showSidebar },
          { mobilefull: isNarrow && showSidebar }
        ]"
      >
        <nav class="sidebar-nav">
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path === '/admin' || route.path === '/admin/' }"
            @click.prevent="goTo('/admin')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="2" fill="#1976d2"/>
                <rect x="14" y="3" width="7" height="7" rx="2" fill="#e6b23a"/>
                <rect x="14" y="14" width="7" height="7" rx="2" fill="#43a047"/>
                <rect x="3" y="14" width="7" height="7" rx="2" fill="#fbc02d"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Overview</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/admin/user-management') }"
            @click.prevent="goTo('/admin/user-management')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" fill="#1976d2"/>
                <ellipse cx="12" cy="18" rx="7" ry="4" fill="#1976d2"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">User Management</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/admin/project-management') }"
            @click.prevent="goTo('/admin/project-management')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#e6b23a"/>
                <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" fill="#fff"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Project Management</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/admin/task-management') || route.path === '/admin/create-task' }"
            @click.prevent="goTo('/admin/task-management')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#43a047"/>
                <path d="M7 12l3 3 7-7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Task Management</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/admin/file-and-document') || route.path.startsWith('/admin/file-view') }"
            @click.prevent="goTo('/admin/file-and-document')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="3" fill="#8e24aa"/>
                <path d="M8 7h8M8 11h8M8 15h5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">File & Document</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/admin/client-portal') }"
            @click.prevent="goTo('/admin/client-portal')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="3" fill="#1976d2"/>
                <path d="M3 9h18" stroke="#fff" stroke-width="2"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Client Portal</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/admin/notification-center') }"
            @click.prevent="goTo('/admin/notification-center')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 10-3 0v.68C7.63 5.36 6 7.92 6 11v5l-1.7 1.7a1 1 0 00.7 1.7h14a1 1 0 00.7-1.7L18 16z" fill="#fbc02d"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Notification Center</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/admin/billing-and-finance') }"
            @click.prevent="goTo('/admin/billing-and-finance')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="3" fill="#43a047"/>
                <circle cx="12" cy="12" r="3" fill="#fff"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Billing & Finance</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/admin/website') }"
            @click.prevent="goTo('/admin/website')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#1976d2"/>
                <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#fff" stroke-width="2"/>
                <path d="M2 12h20" stroke="#fff" stroke-width="2"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Website</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/admin/system-security') }"
            @click.prevent="goTo('/admin/system-security')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path d="M12 2L4 6v6c0 5.25 3.4 10.15 8 11.62 4.6-1.47 8-6.37 8-11.62V6l-8-4z" fill="#e6b23a"/>
                <path d="M10 12l2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">System Security</span>
          </a>
        </nav>
      </aside>
      <main class="admin-main">
        <div class="admin-content-scroll">
          <section class="admin-content">
            <router-view />
          </section>
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
.topbar-search {
  display: flex;
  align-items: center;
}
.topbar-search input {
  width: 140px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #dedddd;
  font-size: 1rem;
  outline: none;
  background: #f7f7f7;
  color: #213547;
  transition: border-color 0.2s;
}
.topbar-search input:focus {
  border-color: #e6b23a;
}

/* Notification Styles */
.notif-wrapper {
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
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
.notif-dropdown {
  position: absolute;
  top: 48px;
  right: 0;
  width: 340px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
  animation: dropIn 0.2s ease;
}
@keyframes dropIn {
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
  max-height: 360px;
  overflow-y: auto;
}
.notif-loading, .notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #888;
}
.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid #f0f0f0;
  border-top-color: #e6b23a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.notif-empty p {
  margin: 10px 0 0;
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
  background: #fffbf0;
}
.notif-item.unread:hover {
  background: #fff7e0;
}
.notif-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  background: #f5f5f5;
  flex-shrink: 0;
}
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
  font-size: 0.75rem;
  color: #999;
}
.unread-dot {
  width: 8px;
  height: 8px;
  background: #e6b23a;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

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
  cursor: pointer;
  padding: 8px 0 0 0;
  transition: color 0.18s;
}
.logout-btn:hover {
  color: #a31515;
}
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
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
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
  padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
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
  width: 100%;
  display: flex;
  flex-direction: column;
}
.admin-content {
  flex: 1;
  padding: 32px 40px;
  background: #f7f7f7;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}
.admin-sidebar.mobilefull {
  width: 100vw !important;
  min-width: 100vw !important;
  left: 0;
  top: 0;
  height: 100vh !important;
  position: fixed !important;
  z-index: 999;
  box-shadow: 2px 0 16px #0001;
  background: #213547;
  transition: width 0.2s, left 0.2s, top 0.2s;
}
@media (max-width: 1200px) {
  .admin-content {
    max-width: 100vw;
    padding: 18px 8px;
  }
}
@media (max-width: 900px) {
  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 70px;
    height: calc(100vh - 70px);
    z-index: 100;
    box-shadow: 2px 0 16px #0001;
    transition: transform 0.2s, width 0.2s;
    transform: translateX(0);
  }
  .admin-sidebar.collapsed {
    transform: translateX(-100%);
    width: 0;
    min-width: 0;
  }
  .admin-sidebar.mobilefull {
    top: 0;
    height: 100vh !important;
  }
  .admin-main {
    margin-left: 0;
  }
  .admin-content {
    padding: 18px 8px;
  }
  .admin-topbar {
    padding: 0 8px;
    height: 56px;
  }
  .topbar-search input {
    width: 90px;
    font-size: 0.95rem;
  }
  .topbar-title {
    font-size: 1rem;
  }
  .notif-dropdown {
    width: 300px;
    right: -50px;
  }
}
@media (max-width: 600px) {
  .admin-sidebar {
    top: 0;
    height: 100vh !important;
  }
  .admin-sidebar.mobilefull {
    top: 0;
    height: 100vh !important;
    width: 100vw !important;
    min-width: 100vw !important;
  }
  .admin-content {
    padding: 8px 2px;
  }
  .notif-dropdown {
    width: 100vw;
    right: -14px;
    border-radius: 0 0 12px 12px;
  }
}
</style>