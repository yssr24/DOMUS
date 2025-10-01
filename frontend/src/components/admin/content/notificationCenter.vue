<template>
  <div class="nc-wrap">
    <header class="nc-header">
      <h2>Notification Center</h2>
      <div class="tools">
        <input v-model="search" type="search" class="nc-search" placeholder="Search title, message, source..." />
        <select v-model="filterType" class="nc-select">
          <option value="all">All types</option>
          <option value="task">Tasks</option>
          <option value="message">Messages</option>
          <option value="file">Files</option>
          <option value="alert">Alerts</option>
          <option value="mention">Mentions</option>
          <option value="system">System</option>
        </select>
        <select v-model="filterStatus" class="nc-select">
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <button class="btn ghost" @click="toggleSort">Sort: {{ sortDir.toUpperCase() }}</button>
        <button class="btn" @click="markAllRead">Mark all read</button>
        <button class="btn danger" @click="clearRead">Clear read</button>
      </div>
    </header>

    <!-- KPI Cards -->
    <section class="nc-cards">
      <div class="nc-card unread">
        <div class="icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1976d2"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg>
        </div>
        <div class="info">
          <div class="label">Unread</div>
          <div class="value">{{ unreadCount }}</div>
        </div>
      </div>
      <div class="nc-card mentions">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18h5v-2h-5a7 7 0 117-7v1a2 2 0 01-4 0V8h-2v5a4 4 0 108 0V12a9 9 0 00-9-9z" fill="#8e24aa"/></svg>
        </div>
        <div class="info">
          <div class="label">Mentions</div>
          <div class="value">{{ mentionsCount }}</div>
        </div>
      </div>
      <div class="nc-card alerts">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2z" fill="#e6b23a"/><circle cx="12" cy="17" r="1.6" fill="#fff"/><rect x="11" y="9" width="2" height="6" rx="1" fill="#fff"/></svg>
        </div>
        <div class="info">
          <div class="label">System Alerts</div>
          <div class="value">{{ alertsCount }}</div>
        </div>
      </div>
      <div class="nc-card due">
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="#43a047"/><path d="M7 2v4M17 2v4M3 10h18" stroke="#fff" stroke-width="2"/><circle cx="12" cy="15" r="3" fill="#fff"/></svg>
        </div>
        <div class="info">
          <div class="label">Tasks Due Soon</div>
          <div class="value">{{ tasksDue }}</div>
        </div>
      </div>
    </section>

    <!-- Notifications list -->
    <section class="nc-list-card">
      <div class="list-toolbar">
        <span class="hint">{{ sortedRows.length }} of {{ totalCount }} shown</span>
        <button class="btn ghost" @click="loadMore" v-if="hasMore">Load more</button>
      </div>

      <ul class="nc-list">
        <li v-for="n in sortedRows" :key="n.id" :class="['item', n.read ? 'read' : 'unread']">
          <div class="left">
            <span class="badge" :class="n.type" :title="n.type"></span>
          </div>
          <div class="mid">
            <div class="title">
              <strong>{{ n.title }}</strong>
              <span v-if="n.priority === 'high'" class="pri high">High</span>
              <span v-else-if="n.priority === 'med'" class="pri med">Med</span>
            </div>
            <div class="meta">
              <span class="pill" :class="n.type">{{ prettyType(n.type) }}</span>
              <span v-if="n.source" class="src">• {{ n.source }}</span>
              <span class="ago">• {{ timeAgo(n.when) }}</span>
            </div>
            <p class="msg">{{ n.message }}</p>
          </div>
          <div class="right">
            <button class="link-btn" @click="open(n)" v-if="n.link">Open</button>
            <button class="link-btn" v-if="!n.read" @click="markRead(n)">Mark read</button>
            <button class="link-btn" v-else @click="markUnread(n)">Mark unread</button>
            <button class="link-btn danger" @click="remove(n)">Delete</button>
          </div>
        </li>

        <li v-if="!sortedRows.length" class="empty">
          <span>No notifications match your filters.</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const search = ref('')
const filterType = ref('all')    // all | task | message | file | alert | mention | system
const filterStatus = ref('all')  // all | unread | read
const sortDir = ref('desc')      // asc | desc

const notifications = ref([]) // populated onMounted
const page = ref(1)
const pageSize = 8

// KPI
const totalCount = computed(() => notifications.value.length)
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
const mentionsCount = computed(() => notifications.value.filter(n => n.type === 'mention').length)
const alertsCount = computed(() => notifications.value.filter(n => n.type === 'alert' || n.priority === 'high').length)
const tasksDue = computed(() =>
  notifications.value.filter(n => n.type === 'task' && n.dueAt && n.dueAt - Date.now() < 2 * 86400000 && n.dueAt > Date.now()).length
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const ft = filterType.value
  const fs = filterStatus.value
  return notifications.value.filter(n => {
    if (ft !== 'all' && n.type !== ft) return false
    if (fs === 'unread' && n.read) return false
    if (fs === 'read' && !n.read) return false
    if (!q) return true
    return [n.title, n.message, n.source].some(v => String(v || '').toLowerCase().includes(q))
  })
})

const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...filtered.value]
    .sort((a, b) => (new Date(a.when).getTime() - new Date(b.when).getTime()) * dir)
    .slice(0, page.value * pageSize)
})

const hasMore = computed(() => filtered.value.length > page.value * pageSize)

function toggleSort() { sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc' }
function loadMore() { if (hasMore.value) page.value++ }

function markRead(n) { n.read = true }
function markUnread(n) { n.read = false }
function markAllRead() { notifications.value.forEach(n => (n.read = true)) }
function clearRead() { notifications.value = notifications.value.filter(n => !n.read) }
function remove(n) { notifications.value = notifications.value.filter(x => x.id !== n.id) }
function open(n) { window.open(n.link, '_blank') }

function prettyType(t) {
  return ({ task: 'Task', message: 'Message', file: 'File', alert: 'Alert', mention: 'Mention', system: 'System' }[t] || 'Other')
}
function timeAgo(date) {
  const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  const m = Math.floor(s / 60), h = Math.floor(m / 60), dd = Math.floor(h / 24)
  if (s < 60) return `${s}s ago`
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${dd}d ago`
}

onMounted(() => {
  // Sample seed data
  const now = Date.now()
  notifications.value = [
    { id: 'n1', type: 'task', title: 'Task assigned', message: 'You were assigned: Submit Design', source: 'Project PR-0007', when: new Date(now - 60 * 60 * 1000), read: false, priority: 'med', link: '#' , dueAt: new Date(now + 36 * 60 * 60 * 1000) },
    { id: 'n2', type: 'file', title: 'New file uploaded', message: '3D_Render_Lobby.png uploaded by Reyes, Maria', source: 'PR-0005', when: new Date(now - 2 * 60 * 60 * 1000), read: false, priority: 'low', link: '#' },
    { id: 'n3', type: 'alert', title: 'Overdue task', message: 'Site survey documentation is overdue.', source: 'Tasks', when: new Date(now - 5 * 60 * 60 * 1000), read: false, priority: 'high', link: '#' },
    { id: 'n4', type: 'message', title: 'New message', message: 'Client replied on design options.', source: 'Client Portal', when: new Date(now - 26 * 60 * 60 * 1000), read: true, priority: 'low', link: '#' },
    { id: 'n5', type: 'mention', title: 'You were mentioned', message: '@you please review the structural notes.', source: 'Comments', when: new Date(now - 50 * 60 * 60 * 1000), read: false, priority: 'med', link: '#' },
    { id: 'n6', type: 'system', title: 'System maintenance', message: 'Planned maintenance Saturday 1–2 AM.', source: 'System', when: new Date(now - 3 * 24 * 60 * 60 * 1000), read: true, priority: 'low' },
    { id: 'n7', type: 'task', title: 'Task status changed', message: 'Schematic Layout moved to Review.', source: 'PR-0010', when: new Date(now - 4 * 24 * 60 * 60 * 1000), read: true, priority: 'low' },
    { id: 'n8', type: 'file', title: 'Document approved', message: 'Structural_Notes.pdf was approved.', source: 'PR-0003', when: new Date(now - 5 * 24 * 60 * 60 * 1000), read: false, priority: 'low' },
    { id: 'n9', type: 'message', title: 'Meeting scheduled', message: 'Coordination call set for Friday 3 PM.', source: 'Calendar', when: new Date(now - 6 * 24 * 60 * 60 * 1000), read: true, priority: 'low' },
    { id: 'n10', type: 'alert', title: 'Permission change', message: 'Project access updated for team.', source: 'Security', when: new Date(now - 7 * 24 * 60 * 60 * 1000), read: false, priority: 'med' },
  ]
})
</script>

<style scoped>
.nc-wrap {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
}
.nc-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px;
}
.nc-header h2 { margin: 0; color: #213547; }
.tools { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.nc-search, .nc-select {
  padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 10px; background:#fafafa; outline: none;
}
.nc-search:focus, .nc-select:focus { border-color: #e6b23a; }
.btn { padding: 8px 12px; border: none; border-radius: 10px; background:#1976d2; color:#fff; font-weight:700; cursor:pointer; }
.btn.ghost { background:#f5f7fb; color:#1a3a6a; border:1px solid #e1e6f0; }
.btn.danger { background:#c62828; }

.nc-cards {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;
}
.nc-card {
  display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 14px;
  background: #fff; box-shadow: 0 2px 12px #00000012; border: 1px solid #f0f0f0;
}
.nc-card .icon { width: 56px; height: 56px; border-radius: 12px; display: grid; place-items: center; background:#f8f8f8; }
.nc-card .info { display: flex; flex-direction: column; }
.nc-card .label { color: #5a6675; font-weight: 600; font-size: .95rem; }
.nc-card .value { color: #213547; font-size: 1.6rem; font-weight: 800; }
.nc-card.unread .icon   { background:#e3f0fc; }
.nc-card.mentions .icon { background:#f6eaff; }
.nc-card.alerts .icon   { background:#fff7e1; }
.nc-card.due .icon      { background:#eafaf0; }

.nc-list-card {
  background:#fff; border:1px solid #f0f0f0; border-radius:14px; box-shadow:0 2px 12px #00000010; padding: 6px 6px 10px;
}
.list-toolbar { display:flex; justify-content:space-between; align-items:center; padding: 8px 6px 6px; }
.hint { color:#777; }

.nc-list { list-style:none; padding:0; margin:0; display:grid; gap:8px; }
.item {
  display:grid; grid-template-columns: 26px 1fr auto; gap:12px; align-items:center;
  padding:12px; border-radius:12px; border:1px solid #f0f0f0; background:#fff;
}
.item.unread { background:#fbfdff; box-shadow: inset 0 0 0 1px #e8f0ff; }
.left { display:flex; align-items:center; justify-content:center; }
.badge { width:14px; height:14px; border-radius:50%; background:#cfd8dc; }
.badge.task { background:#43a047; }
.badge.message { background:#1976d2; }
.badge.file { background:#8e24aa; }
.badge.alert { background:#e6b23a; }
.badge.mention { background:#6a0596; }
.badge.system { background:#607d8b; }

.mid { display:flex; flex-direction:column; gap:4px; }
.title { display:flex; gap:8px; align-items:center; color:#213547; }
.pri { font-size:.72rem; padding:2px 8px; border-radius:999px; font-weight:800; border:1px solid transparent; }
.pri.high { color:#9c1f1f; background:#ffebee; border-color:#ffcdd2; }
.pri.med  { color:#9a4b00; background:#fff4e5; border-color:#ffe0b2; }

.meta { color:#5a6675; font-size:.9rem; display:flex; gap:8px; flex-wrap:wrap; }
.pill { padding:3px 8px; border-radius:999px; font-size:.72rem; font-weight:800; border:1px solid #eee; text-transform:uppercase; letter-spacing:.02em; }
.pill.task { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }
.pill.message { color:#114f8f; background:#e3f0fc; border-color:#d2e6fa; }
.pill.file { color:#6a0596; background:#f6eaff; border-color:#ead6ff; }
.pill.alert { color:#9a4b00; background:#fff7e1; border-color:#ffe0b2; }
.pill.mention { color:#6a0596; background:#f6eaff; border-color:#ead6ff; }
.pill.system { color:#37474f; background:#eceff1; border-color:#cfd8dc; }
.msg { margin:0; color:#344255; }

.right { display:flex; gap:10px; }
.link-btn { background:transparent; border:none; color:#1976d2; font-weight:700; cursor:pointer; }
.link-btn.danger { color:#c62828; }

.empty { text-align:center; color:#777; padding:16px; }

@media (max-width: 900px) {
  .nc-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .tools { justify-content: flex-start; }
  .nc-cards { grid-template-columns: 1fr; }
  .item { grid-template-columns: 18px 1fr; }
  .right { grid-column: 2; justify-content: flex-start; }
}
</style>