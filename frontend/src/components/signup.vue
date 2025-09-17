<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../config'

import '/public/css/style.css'

const router = useRouter()
const firstname = ref('')
const lastname = ref('')
const gender = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const alertMsg = ref('')
const alertType = ref('success')

function goToLogin() {
  router.push('/login')
}

function togglePassword() {
  showPassword.value = !showPassword.value
}

async function signup() {
  loading.value = true
  alertMsg.value = ''
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
  const createdAt = new Date().toISOString()
  const userData = {
    firstname: firstname.value,
    lastname: lastname.value,
    gender: gender.value,
    email: email.value,
    password: password.value,
    createdAt,
    verificationCode
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    const result = await res.json()
    if (result.success) {
    setTimeout(() => {
    router.push({
      path: '/verification',
      query: {
        email: email.value,
        msg: 'Email verification code is sent. Please check your email.'
      }
    })
    }, 1500)
    } else {
      alertType.value = 'error'
      alertMsg.value = result.message || 'Failed to create account.'
    }
  } catch (err) {
    alertType.value = 'error'
    alertMsg.value = 'Network error. Please try again.'
  }
  setTimeout(() => {
    alertMsg.value = ''
  }, 3000)
  loading.value = false
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
    
    <div class="top-left-header"  @click='goToHome' >
      <div class="logo-section">
        <img src="../assets/domus.png" alt="Logo" class="logo" />
        <span class="domus-name">DOMUS</span>
      </div>
    </div>

    <div class="center-container">
      <div class="login-container">
        <div class="form-card" style="max-width:480px;">
          <div class="form-header">
            <span class="login-title">Sign Up</span>
            <span class="signup-link" @click="goToLogin" style="white-space:nowrap;">Already have an account?</span>
          </div>
          <form @submit.prevent="signup">
            <div class="row-two-inputs">
              <div class="input-group">
                <label for="firstname">First Name</label>
                <input
                  id="firstname"
                  type="text"
                  v-model="firstname"
                  placeholder="First name"
                  required
                />
              </div>
              <div class="input-group">
                <label for="lastname">Last Name</label>
                <input
                  id="lastname"
                  type="text"
                  v-model="lastname"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            <div class="row-two-inputs">
              <div class="input-group">
                <label for="gender">Gender</label>
                <select
                  id="gender"
                  v-model="gender"
                  required
                  class="styled-select"
                >
                  <option value="" disabled>Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              
            </div>
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
                  placeholder="Create a password"
                  required
                />
                <span class="toggle-icon" @click="togglePassword"></span>
              </div>
            </div>
            <div style="margin-bottom: 12px;">
              <label style="font-size:0.85rem; color:#555e6a;">
                By Signing up, you agree to our
                <a href="#" style="color:#d9842b;text-decoration:underline;">Terms of Service</a>
                and
                <a href="#" style="color:#d9842b;text-decoration:underline;">Privacy Policy</a>.
              </label>
            </div>
            <button class="login-btn" type="submit" :disabled="loading">
              <span v-if="loading">Creating Account...</span>
              <span v-else>Create Account</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.row-two-inputs {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.styled-select,
.styled-date {
  padding: 10px 12px;
  border: 1px solid #dedddd;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  background: #fff;
  color: #555e6a;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.styled-select:focus,
.styled-date:focus {
  border-color: #fcc644;
}
@media (max-width: 600px) {
  .row-two-inputs {
    flex-direction: column;
    gap: 0;
  }
}
</style>