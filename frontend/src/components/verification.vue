<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '../config'

import '/public/css/style.css'

const code = ref('')
const route = useRoute()
const router = useRouter()
const email = route.query.email
const sending = ref(false)
const verifying = ref(false)
const resendMsg = ref('')
const alertMsg = ref('')
const alertType = ref('success')

function showAlert(msg, type = 'success') {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => {
    alertMsg.value = ''
  }, 3000)
}

onMounted(() => {
  if (route.query.msg) {
    showAlert(route.query.msg, 'success')
  }
})

async function verify() {
  alertMsg.value = ''
  verifying.value = true
  const res = await fetch(`${API_BASE_URL}/api/users/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: code.value })
  })
  const result = await res.json()
  verifying.value = false
  if (result.success) {
    showAlert('Created Account Successfully!', 'success')
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } else {
    showAlert(result.message || 'Incorrect code!', 'error')
  }
}

async function resendCode() {
  sending.value = true
  resendMsg.value = ''
  const res = await fetch(`${API_BASE_URL}/api/users/resend-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  const result = await res.json()
  sending.value = false
  if (result.success) {
    showAlert('A new code has been sent to your email.', 'success')
  } else {
    showAlert(result.message || 'Failed to resend code.', 'error')
  }
}
function goToHome() {
  router.push('/')
}
</script>

<template>
  <div>
    <div v-if="alertMsg" :class="['alert', alertType]" :style="{ position: 'fixed', top: '0', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, textAlign: 'center', padding: '12px', minWidth: '200px', width: 'auto', maxWidth: '90vw', borderRadius: '8px', boxShadow: '0 2px 8px #00000022' }">
      {{ alertMsg }}
    </div>
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
        <div class="form-card" style="max-width:400px;">
          <div class="form-header">
            <span class="login-title">Email Verification</span>
          </div>
          <form @submit.prevent="verify">
            <div class="input-group" style="margin-bottom: 28px;">
              <label for="code">Enter Verification Code</label>
              <div style="display: flex; align-items: center;">
                <input
                  id="code"
                  type="text"
                  v-model="code"
                  placeholder="Enter code"
                  style="flex:1; margin-right:8px;"
                  :disabled="verifying"
                />
                <button
                  type="submit"
                  class="login-btn"
                  style="width:auto; padding:8px 18px; font-size:1rem;"
                  :disabled="verifying"
                >
                  <span v-if="verifying">Verifying...</span>
                  <span v-else>Verify</span>
                </button>
              </div>
            </div>
          </form>
          <div style="font-size:0.95rem; color:#555e6a; text-align:center;">
            Please check your email for the verification code.
          </div>
          <button
            class="login-btn"
            style="margin-top: 18px; width: 100%; background:#e6b23a; color:#213547;"
            :disabled="sending"
            @click="resendCode"
          >
            {{ sending ? 'Sending...' : 'Send Another Code' }}
          </button>
          <div v-if="resendMsg" style="margin-top:10px; color:#e6b23a; text-align:center;">
            {{ resendMsg }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.alert.success { background: #e6f7e6; color: #2e7d32; border-bottom: 2px solid #2e7d32; }
.alert.error { background: #ffeaea; color: #c62828; border-bottom: 2px solid #c62828; }
</style>