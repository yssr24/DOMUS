<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const name = ref('')
const email = ref('')
const message = ref('')
const sent = ref(false)
const defaultName = ref('')

const storageKeys = ['domusUser', 'user', 'authUser']

function resolveStoredUserName() {
  if (typeof window === 'undefined') return ''
  for (const key of storageKeys) {
    const raw = window.localStorage?.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      const resolved =
        [parsed.firstname, parsed.lastname].filter(Boolean).join(' ') ||
        parsed.name ||
        ''
      if (resolved) return resolved
    } catch {
      if (raw.trim()) return raw
    }
  }
  return ''
}

function applyStoredName() {
  const resolved = resolveStoredUserName()
  defaultName.value = resolved
  name.value = resolved
}

function handleStorageChange(event) {
  if (!event.key || storageKeys.includes(event.key)) {
    applyStoredName()
  }
}

onMounted(() => {
  applyStoredName()
  window.addEventListener('storage', handleStorageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorageChange)
})

function submitForm() {
  sent.value = true
  setTimeout(() => (sent.value = false), 2500)
  email.value = ''
  message.value = ''
  name.value = defaultName.value
}
</script>
<template>
  <section class="contact">
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
            <a href="mailto:domus.architecture@email.com">domus.architecture@email.com</a>
          </div>
        </div>

        <div class="card">
          <span class="icon">
            <svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1.5 1.5 0 011.5-.36 9.7 9.7 0 003.1.5 1.5 1.5 0 011.5 1.5V20a2 2 0 01-2 2A18 18 0 012 6a2 2 0 012-2h3.2a1.5 1.5 0 011.5 1.5 9.7 9.7 0 00.5 3.1 1.5 1.5 0 01-.36 1.5L6.6 10.8z" fill="#43a047"/></svg>
          </span>
          <div class="info">
            <h3>Phone</h3>
            <a href="tel:+639123456789">+63 912 345 6789</a>
          </div>
        </div>

        <div class="card">
          <span class="icon">
            <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="#e6b23a"/></svg>
          </span>
          <div class="info">
            <h3>Location</h3>
            <p>123 Main St, Mindoro, Philippines</p>
          </div>
        </div>
      </div>

      <!-- Contact form -->
      <form class="form" @submit.prevent="submitForm">
        <h2>Send a Message</h2>
        <div class="row">
          <div class="field">
            <label>Name</label>
            <input v-model="name" type="text" placeholder="Your name" required />
          </div>
          <div class="field">
            <label>Email</label>
            <input v-model="email" type="email" placeholder="you@email.com" required />
          </div>
        </div>

        <div class="field">
          <label>Message</label>
          <textarea v-model="message" rows="5" placeholder="How can we help?" required></textarea>
        </div>

        <button class="send" type="submit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
          Send
        </button>

        <p v-if="sent" class="sent">Thanks! We’ll get back shortly.</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
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
.info a, .info p { color: #5a6675; text-decoration: none; }

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
}
input:focus, textarea:focus { border-color: #e6b23a; }

.send {
  display: inline-flex; align-items: center; gap: 8px;
  background: #1976d2; color: #fff; border: none;
  border-radius: 10px; padding: 10px 16px; font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px #1976d244;
}
.sent { color: #2e7d32; margin-top: 8px; font-weight: 600; }

/* Responsive */
@media (max-width: 920px) {
  .grid { grid-template-columns: 1fr; }
}
</style>