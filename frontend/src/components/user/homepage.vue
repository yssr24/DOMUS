<script setup>
import { ref, onMounted, watch } from 'vue'
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
const currentContent = ref('home')

// Navigation handlers
function goToLogin() {
  router.push('/login')
}
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}
function goToProject() {
  currentContent.value = 'project'
  window.history.replaceState(null, '', '/projects')
  showDropdown.value = false
}
function goToNotifications() {
  router.push('/user/client/notifications')
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
          <!-- Notification icon for client -->
          <button
            v-if="user.role === 'client'"
            class="notif-btn"
            @click="goToNotifications"
            style="background:none;border:none;cursor:pointer;padding:0;margin-right:5px;"
            title="Notifications"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16Z" fill="#e6b23a"/>
            </svg>
          </button>
          <span class="profile-icon" @click="toggleDropdown" title="Profile">
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
          : currentContent === 'projectDetails'
          ? ProjectDetails
          : currentContent === 'project'
          ? (user && user.role === 'client' ? ProjectContent : HomeContent)
          : HomeContent"
      />
    </main>
  </div>
</template>