<template>
  <div class="cp-wrap">
    <header class="cp-header">
      <h2>Client Portal</h2>
      <input v-model="search" type="search" class="cp-search" placeholder="Search client, email, company, status..." />
    </header>

    <!-- KPI Cards -->
    <section class="cp-cards">
      <div class="cp-card total">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5Z" fill="#1976d2"/></svg>
        </div>
        <div class="info">
          <div class="label">Total Clients</div>
          <div class="value">{{ totalClients }}</div>
        </div>
      </div>
      <div class="cp-card active">
        <div class="icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#43a047"/><path d="M4 20v-1a8 8 0 0 1 16 0v1" fill="#43a047"/></svg>
        </div>
        <div class="info">
          <div class="label">Active Clients</div>
          <div class="value">{{ activeClients }}</div>
        </div>
      </div>
      <div class="cp-card projects">
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" fill="#e6b23a"/><path d="M3 7l9 6 9-6" stroke="#fff" stroke-width="2"/></svg>
        </div>
        <div class="info">
          <div class="label">Open Projects</div>
          <div class="value">{{ openProjects }}</div>
        </div>
      </div>
      <div class="cp-card requests">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v11.5A2.5 2.5 0 0 0 4.5 20H18l4 3V6a2 2 0 0 0-2-2z" fill="#8e24aa"/></svg>
        </div>
        <div class="info">
          <div class="label">Pending Requests</div>
          <div class="value">{{ pendingRequests }}</div>
        </div>
      </div>
    </section>

    <!-- Activity + Quick Message -->
    <section class="cp-panels">
      <div class="panel">
        <h3>Recent Activity</h3>
        <ul class="activity">
          <li v-for="(a, i) in recentActivity" :key="i">
            <span class="dot"></span>
            <div class="txt">
              <div class="title">{{ a.title }}</div>
              <div class="meta">{{ a.client }} • {{ formatDate(a.when) }}</div>
            </div>
          </li>
        </ul>
      </div>
      <div class="panel">
        <h3>Quick Message</h3>
        <form class="msg-form" @submit.prevent="sendMessage">
          <div class="field">
            <label>To (Client)</label>
            <select v-model="msg.to">
              <option value="" disabled>Select client</option>
              <option v-for="c in clients" :key="c.id" :value="c.email">{{ c.name }} — {{ c.email }}</option>
            </select>
          </div>
          <div class="field">
            <label>Subject</label>
            <input v-model="msg.subject" type="text" placeholder="Subject" />
          </div>
          <div class="field">
            <label>Message</label>
            <textarea v-model="msg.body" rows="5" placeholder="Type your message..."></textarea>
          </div>
          <button class="send" type="submit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
            Send
          </button>
          <p v-if="sent" class="sent">Message sent.</p>
        </form>
      </div>
    </section>

    <!-- Clients Table -->
    <section class="cp-table-card">
      <h3>Clients</h3>
      <div class="table-wrap">
        <table class="cp-table">
          <thead>
            <tr>
              <th @click="toggleSort('name')" :class="thClass('name')">Client</th>
              <th @click="toggleSort('company')" :class="thClass('company')">Company</th>
              <th @click="toggleSort('email')" :class="thClass('email')">Email</th>
              <th @click="toggleSort('projects')" :class="thClass('projects')">Projects</th>
              <th @click="toggleSort('status')" :class="thClass('status')">Status</th>
              <th @click="toggleSort('lastActive')" :class="thClass('lastActive')">Last Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in sortedRows" :key="c.id">
              <td>{{ c.name }}</td>
              <td class="ellipsis" :title="c.company">{{ c.company }}</td>
              <td>{{ c.email }}</td>
              <td class="mono">{{ c.projects }}</td>
              <td><span class="pill" :class="c.status">{{ c.status }}</span></td>
              <td class="mono">{{ formatDate(c.lastActive) }}</td>
              <td><button class="link-btn" @click="viewClient(c)">View</button></td>
            </tr>
            <tr v-if="!sortedRows.length">
              <td colspan="7" class="center muted">No clients found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')
const sortKey = ref('lastActive')
const sortDir = ref('desc')
const sent = ref(false)

const clients = ref([
  { id: 'c1', name: 'Labad, Dianne Clarisse', company: 'DOMUS', email: 'dianelabad01@gmail.com', projects: 1, status: 'active', lastActive: new Date() },
])

const recentActivity = ref([
  { title: 'Uploaded Letter of Intent file', client: 'Labad, Dianne Clarisse', when: new Date(Date.now() - 2*3600000) },
  { title: 'Uploaded Owner-Architect Design Build Agreement file', client: 'Labad, Dianne Clarisse', when: new Date(Date.now() - 2*3600000) },
  { title: 'Uploaded Annex A file', client: 'Labad, Dianne Clarisse', when: new Date(Date.now() - 2*3600000) },
])

const totalClients = computed(() => clients.value.length)
const activeClients = computed(() => clients.value.filter(c => c.status === 'active').length)
const openProjects = computed(() => clients.value.reduce((s, c) => s + c.projects, 0))
const pendingRequests = ref(3)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return clients.value
  return clients.value.filter(c =>
    String(c.name).toLowerCase().includes(q) ||
    String(c.company).toLowerCase().includes(q) ||
    String(c.email).toLowerCase().includes(q) ||
    String(c.status).toLowerCase().includes(q)
  )
})

function thClass(key) {
  return { sortable: true, 'sort-asc': sortKey.value === key && sortDir.value === 'asc', 'sort-desc': sortKey.value === key && sortDir.value === 'desc' }
}
function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

const sortedRows = computed(() => {
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    let va = a[key]; let vb = b[key]
    if (key === 'lastActive') {
      const ta = va ? new Date(va).getTime() : 0
      const tb = vb ? new Date(vb).getTime() : 0
      return (ta - tb) * dir
    }
    if (key === 'projects') return ((va || 0) - (vb || 0)) * dir
    va = (va ?? '').toString().toLowerCase()
    vb = (vb ?? '').toString().toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

const msg = ref({ to: '', subject: '', body: '' })
function sendMessage() {
  if (!msg.value.to || !msg.value.subject || !msg.value.body) return
  sent.value = true
  setTimeout(() => (sent.value = false), 1800)
  msg.value = { to: '', subject: '', body: '' }
}
function viewClient(c) {
  alert(`View client: ${c.name}`)
}
function formatDate(v) {
  if (!v) return '—'
  const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v
  return d.toLocaleDateString()
}
</script>

<style scoped>
.cp-wrap {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
}
.cp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.cp-header h2 { margin: 0; color: #213547; }
.cp-search {
  flex: 0 0 320px;
  max-width: 60vw;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fafafa;
  outline: none;
}
.cp-search:focus { border-color: #e6b23a; }

.cp-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.cp-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 12px #00000012;
  border: 1px solid #f0f0f0;
}
.cp-card .icon { width: 56px; height: 56px; border-radius: 12px; display: grid; place-items: center; background: #f8f8f8; }
.cp-card .icon svg { width: 32px; height: 32px; }
.cp-card .info { display: flex; flex-direction: column; }
.cp-card .label { color: #5a6675; font-weight: 600; font-size: .95rem; }
.cp-card .value { color: #213547; font-size: 1.6rem; font-weight: 800; }
.cp-card.total .icon { background: #e3f0fc; }
.cp-card.active .icon { background: #eafaf0; }
.cp-card.projects .icon { background: #fff7e1; }
.cp-card.requests .icon { background: #f6eaff; }

.cp-panels {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 16px;
  margin-bottom: 16px;
}
.panel {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 2px 12px #00000010;
  padding: 16px;
}
.panel h3 { margin: 0 0 10px; color: #213547; font-size: 1.1rem; }

.activity {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 10px;
}
.activity li { display: flex; gap: 10px; align-items: flex-start; }
.activity .dot { width: 10px; height: 10px; border-radius: 50%; background: #e6b23a; margin-top: 8px; box-shadow: 0 0 0 3px #ffe7b8; }
.activity .txt .title { color:#213547; font-weight:700; }
.activity .txt .meta { color:#5a6675; font-size:.9rem; }

.msg-form .field { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
.msg-form label { font-weight:600; color:#213547; }
.msg-form input, .msg-form select, .msg-form textarea {
  padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 10px; background: #fff; outline: none;
}
.msg-form input:focus, .msg-form select:focus, .msg-form textarea:focus { border-color:#e6b23a; }
.send { display:inline-flex; align-items:center; gap:8px; background:#1976d2; color:#fff; border:none; border-radius:10px; padding:10px 16px; font-weight:700; cursor:pointer; box-shadow:0 6px 20px #1976d244; }
.sent { color:#2e7d32; margin-top:8px; font-weight:600; }

.cp-table-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px #0000000f;
  border: 1px solid #f0f0f0;
  padding: 8px;
}
.cp-table-card h3 { margin: 0 0 10px 0; color: #213547; }
.table-wrap { overflow-x: auto; }
.cp-table { width: 100%; border-collapse: collapse; }
.cp-table thead th {
  text-align: left; padding: 12px 10px; border-bottom: 2px solid #f0f0f0;
  font-weight: 700; color: #213547; user-select: none; cursor: pointer; white-space: nowrap; position: relative;
}
.sortable::after {
  content: ' '; position: absolute; right: 8px; top: 50%;
  border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid #c0c0c0;
  transform: translateY(-8px);
}
.sort-asc::after  { border-top: 6px solid #1976d2; transform: translateY(-2px) rotate(180deg); }
.sort-desc::after { border-top: 6px solid #1976d2; transform: translateY(-8px); }

.cp-table tbody td { padding: 12px 10px; border-bottom: 1px solid #f5f5f5; color: #213547; }
.cp-table tbody tr:hover { background: #fafafa; }
.pill { padding: 6px 10px; border-radius: 999px; font-weight: 700; font-size: .78rem; text-transform: uppercase; border: 1px solid transparent; white-space: nowrap; }
.pill.active { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }
.pill.inactive { color:#888; background:#f3f3f3; border-color:#ddd; }

.center { text-align:center; }
.muted { color:#777; }
.mono { font-family: ui-monospace, Menlo, Consolas, Monaco, monospace; }
.ellipsis { max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }

@media (max-width: 900px) {
  .cp-cards { grid-template-columns: repeat(2, 1fr); }
  .cp-panels { grid-template-columns: 1fr; }
  .cp-search { flex: 1; min-width: 0; }
}
@media (max-width: 560px) {
  .cp-cards { grid-template-columns: 1fr; }
  .ellipsis { max-width: 140px; }
}
</style>