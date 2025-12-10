<script setup>
import { ref, onMounted } from 'vue'
import { API_BASE_URL } from '../../../config'

const name = ref('')
const email = ref('')
const message = ref('')
const sent = ref(false)
const sending = ref(false)
const isLoggedIn = ref(false)
const userId = ref(null)
const alertMsg = ref('')
const alertType = ref('success')
const recaptchaToken = ref('')
const recaptchaWidgetId = ref(null)

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

onMounted(() => {
  const userData = localStorage.getItem('domus_user')
  if (userData) {
    const user = JSON.parse(userData)
    isLoggedIn.value = true
    userId.value = user.id || user.docId || null
    name.value = [user.firstname, user.lastname].filter(Boolean).join(' ')
    email.value = user.email || ''
  }

  // Load reCAPTCHA script
  if (!document.getElementById('recaptcha-script')) {
    const script = document.createElement('script')
    script.id = 'recaptcha-script'
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }

  // Define callback for when reCAPTCHA loads
  window.onRecaptchaLoad = () => {
    if (window.grecaptcha && document.getElementById('recaptcha-container')) {
      recaptchaWidgetId.value = window.grecaptcha.render('recaptcha-container', {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: onRecaptchaSuccess,
        'expired-callback': onRecaptchaExpired
      })
    }
  }

  // If grecaptcha already loaded
  if (window.grecaptcha && window.grecaptcha.render) {
    setTimeout(() => {
      if (document.getElementById('recaptcha-container')) {
        recaptchaWidgetId.value = window.grecaptcha.render('recaptcha-container', {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: onRecaptchaSuccess,
          'expired-callback': onRecaptchaExpired
        })
      }
    }, 100)
  }
})

function onRecaptchaSuccess(token) {
  recaptchaToken.value = token
}

function onRecaptchaExpired() {
  recaptchaToken.value = ''
}

function resetRecaptcha() {
  if (window.grecaptcha && recaptchaWidgetId.value !== null) {
    window.grecaptcha.reset(recaptchaWidgetId.value)
    recaptchaToken.value = ''
  }
}

function showAlert(msg, type = 'success') {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => {
    alertMsg.value = ''
  }, 4000)
}

async function submitForm() {
  if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
    showAlert('Please fill in all required fields.', 'error')
    return
  }

  if (!recaptchaToken.value) {
    showAlert('Please complete the reCAPTCHA verification.', 'error')
    return
  }

  sending.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        message: message.value,
        senderId: userId.value,
        recaptchaToken: recaptchaToken.value
      })
    })

    const result = await res.json()

    if (result.success) {
      sent.value = true
      showAlert('Message sent successfully! We\'ll get back to you shortly.', 'success')
      setTimeout(() => (sent.value = false), 3000)
      message.value = ''
      if (!isLoggedIn.value) {
        name.value = ''
        email.value = ''
      }
      resetRecaptcha()
    } else {
      showAlert(result.message || 'Failed to send message. Please try again.', 'error')
      resetRecaptcha()
    }
  } catch (err) {
    console.error('Contact form error:', err)
    showAlert('Network error. Please check your connection and try again.', 'error')
    resetRecaptcha()
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="contact">
    <!-- Alert -->
    <div v-if="alertMsg" :class="['alert', alertType]">
      {{ alertMsg }}
    </div>

    <header class="header">
      <h1>Contact Us</h1>
      <p>Questions or ready to start? DOMUS is here to help.</p>
    </header>

    <div class="grid">
      <!-- Contact cards -->
      <div class="cards">
        <div class="card">
          <span class="icon">
            <svg viewBox="0 0 24 24"><path d="M4 6l8 6 8-6" stroke="#fff" stroke-width="2" fill="none"/><rect x="3" y="4" width="18" height="16" rx="2" fill="#1976d2"/></svg>
          </span>
          <div class="info">
            <h3>Email</h3>
            <a href="mailto:domus.architecture92@gmail.com">domus.architecture92@gmail.com</a>
          </div>
        </div>  

        <div class="card">
          <span class="icon">
            <svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1.5 1.5 0 011.5-.36 9.7 9.7 0 003.1.5 1.5 1.5 0 011.5 1.5V20a2 2 0 01-2 2A18 18 0 012 6a2 2 0 012-2h3.2a1.5 1.5 0 011.5 1.5 9.7 9.7 0 00.5 3.1 1.5 1.5 0 01-.36 1.5L6.6 10.8z" fill="#43a047"/></svg>
          </span>
          <div class="info">
            <h3>Phone</h3>
            <p>+63 907 904 8433</p>
          </div>
        </div>

        <div class="card">
          <span class="icon">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="#e6b23a"/></svg>
          </span>
          <div class="info">
            <h3>Location</h3>
            <p>Mindoro, Philippines</p>
          </div>
        </div>
      </div>

      <!-- Contact form -->
      <form class="form" @submit.prevent="submitForm">
        <h2>Send a Message</h2>
        <div class="row">
          <div class="field">
            <label>Name</label>
            <input 
              v-model="name" 
              type="text" 
              placeholder="Your name" 
              required
              :readonly="isLoggedIn"
              :class="{ 'readonly-input': isLoggedIn }"
            />
          </div>
          <div class="field">
            <label>Email</label>
            <input 
              v-model="email" 
              type="email" 
              placeholder="Your email" 
              required
              :readonly="isLoggedIn"
              :class="{ 'readonly-input': isLoggedIn }"
            />
          </div>
        </div>

        <div class="field">
          <label>Message</label>
          <textarea v-model="message" rows="5" placeholder="How can we help?" required></textarea>
        </div>

        <!-- reCAPTCHA -->
        <div class="field recaptcha-field">
          <div id="recaptcha-container"></div>
          <p v-if="!recaptchaToken" class="recaptcha-hint">Please verify you're not a robot</p>
        </div>

        <button class="send" type="submit" :disabled="sending || !recaptchaToken">
          <svg v-if="!sending" width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
          <span v-if="sending" class="spinner"></span>
          {{ sending ? 'Sending...' : 'Send' }}
        </button>

        <p v-if="sent" class="sent">Thanks! We'll get back shortly.</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
/* Alert styles */
.alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 4px 20px #00000022;
  animation: slideDown 0.3s ease;
}
.alert.success { background: #e6f7e6; color: #2e7d32; border: 1px solid #a5d6a7; }
.alert.error { background: #ffeaea; color: #c62828; border: 1px solid #ef9a9a; }

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.contact {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
}
.header { text-align: center; margin-bottom: 10px; }
.header h1 { margin: 0; color: #213547; }
.header p { color: #5a6675; }

.grid {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 18px;
}

.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 2px 12px #00000010;
  padding: 14px;
}
.icon {
  width: 52px; height: 52px; border-radius: 12px;
  display: grid; place-items: center;
  background: #f8f8f8; box-shadow: inset 0 0 0 1px #eee;
}
.icon svg { width: 28px; height: 28px; }
.info h3 { margin: 0 0 4px; color: #213547; }
.info a, .info p { color: #5a6675; text-decoration: none; margin: 0; }

.form {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 2px 12px #00000010;
  padding: 16px;
}
.form h2 { margin: 0 0 10px; color: #213547; }

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
label { font-weight: 600; color: #213547; }
input, textarea {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  outline: none;
  background: #fff;
  font-size: 1rem;
  transition: border-color 0.2s;
}
input:focus, textarea:focus { border-color: #e6b23a; }

.readonly-input {
  background: #f5f5f5;
  color: #555;
  cursor: not-allowed;
}

/* reCAPTCHA styles */
.recaptcha-field {
  margin-bottom: 14px;
}
.recaptcha-hint {
  margin: 6px 0 0;
  font-size: 0.85rem;
  color: #c62828;
}

.send {
  display: inline-flex; align-items: center; gap: 8px;
  background: #1976d2; color: #fff; border: none;
  border-radius: 10px; padding: 10px 16px; font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px #1976d244;
  transition: background 0.2s, opacity 0.2s;
}
.send:hover:not(:disabled) { background: #1565c0; }
.send:disabled { opacity: 0.7; cursor: not-allowed; }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.sent { color: #2e7d32; margin-top: 8px; font-weight: 600; }

@media (max-width: 920px) {
  .grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .row { grid-template-columns: 1fr; }
}
</style>