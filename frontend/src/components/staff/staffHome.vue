<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE_URL } from '../../config'
import '/public/css/style.css'

const showSidebar = ref(true)
const showProfileDropdown = ref(false)
const isNarrow = ref(false)
const router = useRouter()
const route = useRoute()

function toggleSidebar() {
  showSidebar.value = !showSidebar.value
}
function toggleProfileDropdown() {
  showProfileDropdown.value = !showProfileDropdown.value
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
onMounted(() => {
  checkNarrow()
  window.addEventListener('resize', checkNarrow)
  const userData = localStorage.getItem('domus_user')
  staff.value = userData ? JSON.parse(userData) : null
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkNarrow)
})
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
        <button class="notif-btn" title="Notifications">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 10-3 0v.68C7.63 5.36 6 7.92 6 11v5l-1.7 1.7a1 1 0 00.7 1.7h14a1 1 0 00.7-1.7L18 16z" fill="#e6b23a"/></svg>
        </button>
        <div class="profile-menu">
          <span class="profile-icon" @click="toggleProfileDropdown">
            <img src="../../assets/domus.png" alt="Profile" class="profile-img" />
          </span>
          <div v-if="showProfileDropdown" class="profile-dropdown">
            <div class="profile-info">
              <img src="../../assets/domus.png" alt="Profile" class="profile-img" />
              <span class="profile-name">{{ staff?.firstname || 'Staff' }}</span>
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
          <div class="sidebar-link" style="margin-bottom:10px;display:flex;align-items:center;gap:10px;">
            <img src="../../assets/domus.png" alt="Profile" class="profile-img" style="width:32px;height:32px;" />
            <span v-if="showSidebar" class="profile-name" style="color:#e6b23a;">{{ staff?.firstname || 'Staff' }}</span>
          </div>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path === '/staff' }"
            @click.prevent="goTo('/staff')"
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
            :class="{ active: route.path === '/staff/projects' }"
            @click.prevent="goTo('/staff/projects')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#1976d2"/>
                <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" fill="#fff"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Projects</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path === '/staff/tasks' }"
            @click.prevent="goTo('/staff/tasks')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#43a047"/>
                <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" fill="#fff"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Tasks</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path === '/staff/collaboration' }"
            @click.prevent="goTo('/staff/collaboration')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <circle cx="8" cy="8" r="4" fill="#1976d2"/>
                <circle cx="16" cy="16" r="4" fill="#e6b23a"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Collaboration</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path === '/staff/calendar' }"
            @click.prevent="goTo('/staff/calendar')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="16" rx="4" fill="#fbc02d"/>
                <rect x="7" y="9" width="10" height="2" rx="1" fill="#fff"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Calendar</span>
          </a>
          <a
            v-if="!isNarrow || showSidebar"
            href="#"
            class="sidebar-link"
            :class="{ active: route.path === '/staff/performance' }"
            @click.prevent="goTo('/staff/performance')"
          >
            <span class="sidebar-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#e6b23a"/>
                <path d="M7 17v-6m5 6V7m5 10v-3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </span>
            <span v-if="showSidebar" class="sidebar-text">Performance</span>
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
  overflow: hidden; /* Prevent layout scrollbars */
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
.notif-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
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
  overflow: hidden; /* Prevent admin-main itself from scrolling */
}

.admin-content-scroll {
  flex: 1;
  height: 100%;
  overflow-y: auto; /* Only this div scrolls */
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
}
</style>