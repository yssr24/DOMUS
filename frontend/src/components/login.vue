<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../config'

import '/public/css/style.css'

const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const keepSignedIn = ref(false)
const alertMsg = ref('')
const alertType = ref('success')

function togglePassword() {
  showPassword.value = !showPassword.value
}

async function login() {
  alertMsg.value = ''
  const res = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value, password: password.value })
  })
  const result = await res.json()
  if (result.success && result.user) {
    localStorage.setItem('domus_user', JSON.stringify(result.user))
      await fetch(`${API_BASE_URL}/api/admin/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: result.user.email, status: 'active' })
    })
    // Redirect based on role
    if (result.user.role === 'admin') {
      router.push('/admin')
    } else if (result.user.role === 'staff') {
      router.push('/staff')
    } else {
      router.push('/')
    }
  } else {
    alertType.value = 'error'
    alertMsg.value = 'Invalid user. The email or password you entered is incorrect.'
    email.value = ''
    password.value = ''
    setTimeout(() => { alertMsg.value = '' }, 3000)
  }
}
function goToSignUp() {
  router.push('/signup')
}
function goToForgotPassword() {
  router.push('/forgot-password')
}
function goToHome() {
  router.push('/')
}
</script>

<template>
  <div>
   <div v-if="alertMsg" :class="['alert', alertType]" style="position:fixed;top:0;left:0;right:0;z-index:1000;text-align:center;padding:12px;">
      {{ alertMsg }}
    </div>
    <!-- Architectural background shapes -->
    <div class="arch-bg-shape shape1"></div>
    <div class="arch-bg-shape shape2"></div>

    <div class="top-left-header">
      <div class="logo-section"  @click='goToHome'>
        <img src="../assets/domus.png" alt="Logo" class="logo" />
        <span class="domus-name">DOMUS</span>
      </div>
    </div>
    <div class="center-container">
      <div class="login-container">
        <div class="form-card">     
          <div class="form-header">
            <span class="login-title">Login</span>
            <span class="signup-link" @click="goToSignUp">Don't have account?</span>
          </div>
          <form @submit.prevent="login">
            <div class="input-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                type="email"
                v-model="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <div class="input-group">
              <label for="password">Password</label>
              <div class="password-wrapper">
                <input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  placeholder="Enter your password"
                  required
                />
                <span class="toggle-icon" @click="togglePassword">
                </span>
              </div>
            </div>
            <div class="options-row">
              <label class="keep-signed-in">
                <input type="checkbox" v-model="keepSignedIn" />
                Keep me signed in
              </label>
              <a href="#" class="forgot-password" @click="goToForgotPassword">Forgot password?</a>
            </div>
            <button class="login-btn" type="submit">Login</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

