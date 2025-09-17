<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../config'
import '/public/css/style.css'

const email = ref('')
const loading = ref(false)
const alertMsg = ref('')
const alertType = ref('success')
const router = useRouter()

function goBack() {
  router.push('/login')
}

async function sendReset() {
  alertMsg.value = ''
  loading.value = true
  const res = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value })
  })
  const result = await res.json()
  loading.value = false
  if (result.success) {
    alertType.value = 'success'
    alertMsg.value = 'A password reset email has been sent to your address. Please check your inbox and follow the instructions to reset your password.'
    setTimeout(() => {
      alertMsg.value = ''
      router.push('/login')
    }, 2500)
  } else {
    alertType.value = 'error'
    alertMsg.value = result.message || 'We could not process your request. Please ensure your email is registered and try again.'
    setTimeout(() => { alertMsg.value = '' }, 3500)
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
          <div class="form-header" style="display:flex;justify-content:space-between;align-items:center;">
            <span class="login-title">Forgot Password</span>
            <span class="signup-link" @click="goBack">Go back to login</span>
          </div>
          <form @submit.prevent="sendReset">
            <div class="input-group">
              <label for="email">Enter your email</label>
              <input
                id="email"
                type="email"
                v-model="email"
                placeholder="Email address"
                required
              />
            </div>
            <button class="login-btn" type="submit" :disabled="loading">
              <span v-if="loading">Sending...</span>
              <span v-else>Confirm</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>