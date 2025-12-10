<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HomeContent from './content/Home.vue'
import AboutContent from './content/About.vue'
import ContactContent from './content/Contact.vue'
import ProjectContent from './client/Project.vue'
import { API_BASE_URL } from '../../config'

import '/public/css/user/user.css'

const router = useRouter()
const route = useRoute()
const user = ref(null)
const showDropdown = ref(false)
const showNotifDropdown = ref(false)
const currentContent = ref('home')

// Notifications state
const notifications = ref([])
const loadingNotifs = ref(false)

// Navigation handlers
function goToLogin() {
  router.push('/login')
}
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  showNotifDropdown.value = false
}
function toggleNotifDropdown() {
  showNotifDropdown.value = !showNotifDropdown.value
  showDropdown.value = false
  if (showNotifDropdown.value && notifications.value.length === 0) {
    fetchNotifications()
  }
}
function goToProject() {
  currentContent.value = 'project'
  window.history.replaceState(null, '', '/projects')
  showDropdown.value = false
}
function showHome() {
  currentContent.value = 'home'
  window.history.replaceState(null, '', '/')
}
function showAbout() {
  currentContent.value = 'about'
  window.history.replaceState(null, '', '/about')
}
function showContact() {
  currentContent.value = 'contact'
  window.history.replaceState(null, '', '/contact')
}

// Get client ID from localStorage
function getClientId() {
  const userData = localStorage.getItem('domus_user')
  if (!userData) return null
  const userObj = JSON.parse(userData)
  return userObj.id || userObj.docId || userObj.userId
}

// Fetch notifications
async function fetchNotifications() {
  const clientId = getClientId()
  if (!clientId) return

  loadingNotifs.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/notifications?clientId=${clientId}&limit=20`)
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
    await fetch(`${API_BASE_URL}/api/user/mark-notification-read`, {
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
  const clientId = getClientId()
  if (!clientId) return
  try {
    await fetch(`${API_BASE_URL}/api/user/mark-all-notifications-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId })
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
  // Navigate to project page for most notifications
  if (notif.type === 'created_project' || notif.type === 'project_update' || notif.type === 'staff_assigned') {
    currentContent.value = 'project'
    window.history.replaceState(null, '', '/projects')
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
    file_upload: '📄',
    message: '💬',
    task_update: '✅'
  }
  return icons[type] || '🔔'
}

// Close dropdowns when clicking outside
function handleClickOutside(e) {
  if (!e.target.closest('.profile-menu') && !e.target.closest('.notif-wrapper')) {
    showDropdown.value = false
    showNotifDropdown.value = false
  }
}

async function logout() {
  const userData = localStorage.getItem('domus_user')
  if (userData) {
    const userObj = JSON.parse(userData)
    await fetch(`${API_BASE_URL}/api/admin/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userObj.email, status: 'offline' })
    })
  }
  localStorage.removeItem('domus_user')
  user.value = null
  showDropdown.value = false
  router.push('/login')
}

// Set initial content based on URL
onMounted(() => {
  const userData = localStorage.getItem('domus_user')
  user.value = userData ? JSON.parse(userData) : null

  if (route.path === '/about') currentContent.value = 'about'
  else if (route.path === '/contact') currentContent.value = 'contact'
  else if (route.path === '/projects') currentContent.value = 'project'
  else currentContent.value = 'home'

  document.addEventListener('click', handleClickOutside)
  
  // Fetch notifications if client is logged in
  if (user.value?.role === 'client') {
    fetchNotifications()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for route changes (browser navigation)
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/about') currentContent.value = 'about'
    else if (newPath === '/contact') currentContent.value = 'contact'
    else if (newPath === '/projects') currentContent.value = 'project'
    else currentContent.value = 'home'
  }
)
</script>

<template>
  <div class="domus-homepage">
    <header class="domus-header">
      <div class="header-left">
        <img src="../../assets/domus.png" alt="DOMUS Logo" class="domus-logo" />
        <span class="domus-title">DOMUS</span>
      </div>
      <nav class="header-right">
        <a href="#" class="nav-link" :class="{active: currentContent==='home'}" @click.prevent="showHome">Home</a>
        <a href="#" class="nav-link" :class="{active: currentContent==='about'}" @click.prevent="showAbout">About</a>
        <a href="#" class="nav-link" :class="{active: currentContent==='contact'}" @click.prevent="showContact">Contact</a>
        <button v-if="!user" class="login-btn" @click="goToLogin">Login</button>
        <div v-else class="profile-menu" style="display:flex;align-items:center;gap:10px;">
          <!-- Notification dropdown for client -->
          <div v-if="user.role === 'client'" class="notif-wrapper">
            <button
              class="notif-btn"
              @click.stop="toggleNotifDropdown"
              title="Notifications"
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16Z" fill="#e6b23a"/>
              </svg>
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
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                    <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16Z" fill="#ccc"/>
                  </svg>
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
          
          <span class="profile-icon" @click.stop="toggleDropdown" title="Profile">
            <img src="../../assets/domus.png" alt="Profile" class="profile-img" />
          </span>
          <div v-if="showDropdown" class="profile-dropdown">
            <div class="profile-info">
              <img src="../../assets/domus.png" alt="Profile" class="profile-img" />
              <span class="profile-name">{{ user.firstname }} {{ user.lastname }}</span>
            </div>
            <!-- Show Project link only for client role -->
            <button
              v-if="user.role === 'client'"
              class="profile-dropdown-btn"
              @click="goToProject"
              style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#213547;font-size:1rem;padding:8px 0;cursor:pointer;"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#e6b23a"/>
                <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" fill="#fff"/>
              </svg>
              <span>Project</span>
            </button>
            <button class="logout-btn" @click="logout">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" style="vertical-align:middle;margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="#c62828" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
    <main class="domus-main">
      <component
        :is="currentContent === 'home'
          ? HomeContent
          : currentContent === 'about'
          ? AboutContent
          : currentContent === 'contact'
          ? ContactContent
          : currentContent === 'project'
          ? (user && user.role === 'client' ? ProjectContent : HomeContent)
          : HomeContent"
      />
    </main>
  </div>
</template>

<style scoped>
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
  background: rgba(230, 178, 58, 0.1);
}
.notif-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #c62828;
  color: #fff;
  font-size: 0.6rem;
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
  top: 44px;
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
  color: #e6b23a;
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

@media (max-width: 600px) {
  .notif-dropdown {
    width: 100vw;
    right: -60px;
    border-radius: 0 0 12px 12px;
  }
}
</style>