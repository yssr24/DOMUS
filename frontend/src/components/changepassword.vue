<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '../config'
import '/public/css/style.css'

const route = useRoute()
const router = useRouter()
const email = ref(route.query.email || '')
const token = ref(route.query.token || '')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordStrength = ref('')
const showPassword = ref(false)
const alertMsg = ref('')
const alertType = ref('success')
const loading = ref(false)

function togglePassword() {
  showPassword.value = !showPassword.value
}

function checkStrength(pw) {
  if (!pw) return ''
  if (pw.length < 6) return 'Weak'
  if (pw.match(/[A-Z]/) && pw.match(/[a-z]/) && pw.match(/[0-9]/) && pw.length >= 8) return 'Strong'
  return 'Medium'
}

function onPasswordInput() {
  passwordStrength.value = checkStrength(newPassword.value)
}

async function confirmChange() {
  alertMsg.value = ''
  if (newPassword.value !== confirmPassword.value) {
    alertType.value = 'error'
    alertMsg.value = 'Passwords do not match. Please ensure both fields are identical.'
    setTimeout(() => { alertMsg.value = '' }, 3000)
    return
  }
  if (passwordStrength.value === 'Weak' || !passwordStrength.value) {
    alertType.value = 'error'
    alertMsg.value = 'Your new password is too weak. Please use a stronger password.'
    setTimeout(() => { alertMsg.value = '' }, 3000)
    return
  }
  loading.value = true
  const res = await fetch(`${API_BASE_URL}/api/users/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      token: token.value,
      newPassword: newPassword.value
    })
  })
  const result = await res.json()
  loading.value = false
  if (result.success) {
    alertType.value = 'success'
    alertMsg.value = 'Your password has been updated successfully. You may now log in with your new password.'
    setTimeout(() => {
      alertMsg.value = ''
      router.push('/login')
    }, 2000)
  } else {
    alertType.value = 'error'
    alertMsg.value = result.message || 'Unable to update password. The reset link may have expired or is invalid.'
    setTimeout(() => { alertMsg.value = '' }, 4000)
  }
}
</script>

<template>
  <div>
    <div v-if="alertMsg" :class="['alert', alertType]" style="position:fixed;top:0;left:0;right:0;z-index:1000;text-align:center;padding:12px;">
      {{ alertMsg }}
    </div>
    <div class="arch-bg-shape shape1"></div>
    <div class="arch-bg-shape shape2"></div>
    <div class="top-left-header">
      <div class="logo-section">
        <img src="../assets/domus.png" alt="Logo" class="logo" />
        <span class="domus-name">DOMUS</span>
      </div>
    </div>
    <div class="center-container">
      <div class="login-container">
        <div class="form-card" style="max-width:400px;">
          <div class="form-header">
            <span class="login-title">Change Password</span>
          </div>
          <form @submit.prevent="confirmChange">
            <div class="input-group">
              <label for="newPassword">New Password</label>
              <div class="password-wrapper">
                <input
                  id="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="newPassword"
                  @input="onPasswordInput"
                  placeholder="Enter new password"
                  required
                />
                <span class="toggle-icon" @click="togglePassword"></span>
              </div>
              <div v-if="passwordStrength" :style="{
                color: passwordStrength === 'Strong' ? '#2e7d32' : (passwordStrength === 'Medium' ? '#e6b23a' : '#c62828'),
                fontWeight: 'bold',
                marginTop: '6px'
              }">
                Password strength: {{ passwordStrength }}
              </div>
            </div>
            <div class="input-group">
              <label for="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                v-model="confirmPassword"
                placeholder="Confirm new password"
                required
              />
            </div>
            <button class="login-btn" type="submit" :disabled="loading">
              <span v-if="loading">Updating...</span>
              <span v-else>Confirm</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>