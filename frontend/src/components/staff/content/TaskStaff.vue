<template>
  <div class="ts-wrap">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your tasks...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-retry" @click="fetchTasks">Retry</button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <header class="ts-header">
        <h2>My Tasks</h2>
        <div class="tools">
          <input v-model="search" type="search" class="ts-search" placeholder="Search task, project, status..." />
          <select v-model="statusFilter" class="ts-select">
            <option value="all">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select v-model="priorityFilter" class="ts-select">
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div class="view-toggle">
            <button :class="['btn', viewMode==='board'?'active':'']" @click="viewMode='board'">Board</button>
            <button :class="['btn', viewMode==='list'?'active':'']" @click="viewMode='list'">List</button>
          </div>
          <button class="btn-refresh" @click="fetchTasks" title="Refresh">
            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
        </div>
      </header>

      <!-- KPI Cards -->
      <section class="ts-cards">
        <div class="ts-card open">
          <div class="icon">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="#1976d2"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <div class="info">
            <div class="label">Open Tasks</div>
            <div class="value">{{ openTasks }}</div>
          </div>
        </div>
        <div class="ts-card today">
          <div class="icon">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="#e6b23a"/><path d="M7 2v4M17 2v4M3 10h18" stroke="#fff" stroke-width="2"/></svg>
          </div>
          <div class="info">
            <div class="label">Due Today</div>
            <div class="value">{{ dueToday }}</div>
          </div>
        </div>
        <div class="ts-card overdue">
          <div class="icon">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 20h20L12 2z" fill="#c62828"/><rect x="11" y="8" width="2" height="6" rx="1" fill="#fff"/><circle cx="12" cy="17" r="1.6" fill="#fff"/></svg>
          </div>
          <div class="info">
            <div class="label">Overdue</div>
            <div class="value">{{ overdueCount }}</div>
          </div>
        </div>
        <div class="ts-card done">
          <div class="icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#43a047"/><path d="M8 12l2.5 2.5L16 9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="info">
            <div class="label">Completed (This Month)</div>
            <div class="value">{{ completedThisMonth }}</div>
          </div>
        </div>
      </section>

      <!-- Charts -->
      <section class="ts-charts">
        <div class="chart-card">
          <h3>Tasks by Priority</h3>
          <apexchart type="donut" height="240" :options="prioOptions" :series="prioSeries" />
        </div>
        <div class="chart-card">
          <h3>Completed — Last 7 Days</h3>
          <apexchart type="bar" height="240" :options="doneOptions" :series="doneSeries" />
        </div>
      </section>

      <!-- Board View -->
      <section v-if="viewMode==='board'" class="ts-board">
        <div v-for="col in boardColumns" :key="col.key" class="col">
          <div class="col-head">
            <span class="title">{{ col.title }}</span>
            <span class="count">{{ col.items.length }}</span>
          </div>
          <ul class="col-list">
            <li v-for="t in col.items" :key="t.id" class="card">
              <div class="row">
                <strong class="t-title" :title="t.title">{{ t.title }}</strong>
                <span class="pri" :class="t.priority">{{ t.priority }}</span>
              </div>
              <div class="meta">
                <span class="proj" :title="t.project">{{ t.project }}</span>
                <span class="due mono" :class="{ late: isLate(t) }">{{ formatDate(t.dueDate) }}</span>
              </div>
              <div class="actions">
                <button v-if="canBack(t)" class="link-btn" @click="moveBack(t)" :disabled="updating">Back</button>
                <button v-if="canNext(t)" class="link-btn ok" @click="moveNext(t)" :disabled="updating">Next</button>
                <button v-if="t.status!=='done'" class="link-btn done" @click="markDone(t)" :disabled="updating">Mark Done</button>
              </div>
            </li>
            <li v-if="!col.items.length" class="empty">No tasks</li>
          </ul>
        </div>
      </section>

      <!-- List View -->
      <section v-else class="ts-table-card">
        <div class="table-toolbar">
          <span class="hint">{{ sortedRows.length }} of {{ tasks.length }} shown</span>
        </div>
        <div class="table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th @click="toggleSort('title')" :class="thClass('title')">Task</th>
                <th @click="toggleSort('project')" :class="thClass('project')">Project</th>
                <th @click="toggleSort('status')" :class="thClass('status')">Status</th>
                <th @click="toggleSort('priority')" :class="thClass('priority')">Priority</th>
                <th @click="toggleSort('dueDate')" :class="thClass('dueDate')">Due</th>
                <th @click="toggleSort('updatedAt')" :class="thClass('updatedAt')">Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in sortedRows" :key="t.id">
                <td class="ellipsis" :title="t.title">{{ t.title }}</td>
                <td class="ellipsis" :title="t.project">{{ t.project }}</td>
                <td><span class="pill" :class="t.status">{{ prettyStatus(t.status) }}</span></td>
                <td><span class="pri" :class="t.priority">{{ t.priority }}</span></td>
                <td class="mono" :class="{ late: isLate(t) }">{{ formatDate(t.dueDate) }}</td>
                <td class="mono">{{ timeAgo(t.updatedAt) }}</td>
                <td class="actions">
                  <button class="link-btn" @click="viewTask(t)">View</button>
                  <button v-if="t.status!=='done'" class="link-btn done" @click="markDone(t)" :disabled="updating">Done</button>
                </td>
              </tr>
              <tr v-if="!sortedRows.length">
                <td colspan="7" class="center muted">No tasks found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const viewMode = ref('board')
const search = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')
const sortKey = ref('dueDate')
const sortDir = ref('asc')

const tasks = ref([])
const loading = ref(true)
const error = ref(null)
const updating = ref(false)

// Get logged-in staff ID from localStorage
function getStaffId() {
  const user = JSON.parse(localStorage.getItem('domus_user') || '{}')
  return user.id || user.uid || null
}

// Fetch tasks from backend
async function fetchTasks() {
  const staffId = getStaffId()
  if (!staffId) {
    error.value = 'Please log in to view your tasks.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await axios.get(`${API_BASE}/api/staff/tasks`, {
      params: { staffId }
    })

    if (response.data.success) {
      // Transform backend data to component format
      tasks.value = response.data.data.map(t => ({
        id: t.id,
        title: t.title || t.name || 'Untitled Task',
        project: `${t.projectCode || ''} | ${t.projectTitle || 'Unknown Project'}`.trim(),
        projectId: t.projectId,
        status: t.status || 'todo',
        priority: t.priority || 'medium',
        dueDate: t.deadline ? new Date(t.deadline) : null,
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        description: t.description || ''
      }))
    } else {
      error.value = response.data.message || 'Failed to fetch tasks.'
    }
  } catch (err) {
    console.error('Error fetching tasks:', err)
    error.value = 'Failed to connect to server. Please try again.'
  } finally {
    loading.value = false
  }
}

// Update task status on backend
async function updateTaskStatus(taskId, newStatus) {
  const staffId = getStaffId()
  if (!staffId) return false

  updating.value = true

  try {
    const response = await axios.post(`${API_BASE}/api/staff/update-task-status`, {
      taskId,
      status: newStatus,
      staffId
    })

    if (response.data.success) {
      return true
    } else {
      alert(response.data.message || 'Failed to update task status.')
      return false
    }
  } catch (err) {
    console.error('Error updating task status:', err)
    alert('Failed to update task. Please try again.')
    return false
  } finally {
    updating.value = false
  }
}

// Initialize on mount
onMounted(() => {
  fetchTasks()
})

// KPIs
const openTasks = computed(() => tasks.value.filter(t => t.status !== 'done').length)
const dueToday = computed(() => tasks.value.filter(t => sameDay(t.dueDate, new Date()) && t.status !== 'done').length)
const overdueCount = computed(() => tasks.value.filter(t => isLate(t) && t.status !== 'done').length)
const completedThisMonth = computed(() => tasks.value.filter(t => t.status === 'done' && sameMonth(t.updatedAt, new Date())).length)

function sameDay(a, b) { 
  if (!a || !b) return false
  const d = new Date(a), e = new Date(b)
  return d.getFullYear() === e.getFullYear() && d.getMonth() === e.getMonth() && d.getDate() === e.getDate() 
}
function sameMonth(a, b) { 
  if (!a || !b) return false
  const d = new Date(a), e = new Date(b)
  return d.getFullYear() === e.getFullYear() && d.getMonth() === e.getMonth() 
}
function isLate(t) { return t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== 'done' }

// Charts
const prioSeries = computed(() => {
  const cnt = { high: 0, medium: 0, low: 0 }
  tasks.value.forEach(t => cnt[t.priority] = (cnt[t.priority] || 0) + 1)
  return [cnt.high, cnt.medium, cnt.low]
})
const prioOptions = ref({
  labels: ['High', 'Medium', 'Low'],
  colors: ['#c62828', '#e6b23a', '#1976d2'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
  chart: { toolbar: { show: false } }
})

const last7 = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date(Date.now() - (6 - i) * 86400000)
  return { key: d.toDateString(), label: d.toLocaleDateString(undefined, { weekday: 'short' }) }
})
const doneSeries = computed(() => {
  const map = Object.fromEntries(last7.map(d => [d.key, 0]))
  tasks.value.filter(t => t.status === 'done').forEach(t => {
    const k = new Date(t.updatedAt).toDateString()
    if (k in map) map[k]++
  })
  return [{ name: 'Done', data: last7.map(d => map[d.key]) }]
})
const doneOptions = ref({
  chart: { toolbar: { show: false } },
  xaxis: { categories: last7.map(d => d.label) },
  dataLabels: { enabled: false },
  colors: ['#43a047'],
  plotOptions: { bar: { borderRadius: 6 } }
})

// Filters
const filteredTasks = computed(() => {
  const q = search.value.trim().toLowerCase()
  const sf = statusFilter.value
  const pf = priorityFilter.value
  return tasks.value.filter(t => {
    if (sf !== 'all' && t.status !== sf) return false
    if (pf !== 'all' && t.priority !== pf) return false
    if (!q) return true
    return [t.title, t.project, t.status, t.priority].some(v => String(v || '').toLowerCase().includes(q))
  })
})

// Board columns
const boardColumns = computed(() => {
  const order = ['todo', 'in-progress', 'review', 'done']
  const titles = { 'todo': 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }
  return order.map(k => ({
    key: k,
    title: titles[k],
    items: [...filteredTasks.value.filter(t => t.status === k)]
      .sort((a, b) => prioWeight(b.priority) - prioWeight(a.priority) || (+new Date(a.dueDate)) - (+new Date(b.dueDate)))
  }))
})
function prioWeight(p) { return p === 'high' ? 3 : p === 'medium' ? 2 : 1 }
function canNext(t) { return t.status !== 'done' }
function canBack(t) { return t.status !== 'todo' }

async function moveNext(t) {
  const flow = { 'todo': 'in-progress', 'in-progress': 'review', 'review': 'done', 'done': 'done' }
  const newStatus = flow[t.status] || t.status
  const success = await updateTaskStatus(t.id, newStatus)
  if (success) {
    t.status = newStatus
    t.updatedAt = new Date()
  }
}

async function moveBack(t) {
  const flow = { 'in-progress': 'todo', 'review': 'in-progress', 'done': 'review', 'todo': 'todo' }
  const newStatus = flow[t.status] || t.status
  const success = await updateTaskStatus(t.id, newStatus)
  if (success) {
    t.status = newStatus
    t.updatedAt = new Date()
  }
}

async function markDone(t) {
  const success = await updateTaskStatus(t.id, 'done')
  if (success) {
    t.status = 'done'
    t.updatedAt = new Date()
  }
}

// List helpers
function thClass(key) { return { sortable: true, 'sort-asc': sortKey.value === key && sortDir.value === 'asc', 'sort-desc': sortKey.value === key && sortDir.value === 'desc' } }
function toggleSort(key) { if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'; else { sortKey.value = key; sortDir.value = 'asc' } }
const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filteredTasks.value].sort((a, b) => {
    let va = a[key], vb = b[key]
    if (key === 'dueDate' || key === 'updatedAt') return ((+new Date(va || 0)) - (+new Date(vb || 0))) * dir
    if (key === 'priority') return (prioWeight(va) - prioWeight(vb)) * dir
    va = String(va ?? '').toLowerCase(); vb = String(vb ?? '').toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

// UI helpers
function prettyStatus(s) { return ({ 'todo': 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }[s] || s) }
function formatDate(v) { if (!v) return '—'; const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v; return d.toLocaleDateString() }
function timeAgo(v) {
  if (!v) return '—'
  const d = new Date(v).getTime(), s = Math.floor((Date.now() - d) / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d2 = Math.floor(h / 24)
  if (s < 60) return `${s}s ago`; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; return `${d2}d ago`
}
function viewTask(t) { alert(`Task: ${t.title}\n\nProject: ${t.project}\nStatus: ${prettyStatus(t.status)}\nPriority: ${t.priority}\nDue: ${formatDate(t.dueDate)}`) }
</script>

<script>
export default {
  components: {
    apexchart: VueApexCharts
  }
}
</script>

<style scoped>
/* ...existing code... */
.ts-wrap {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #5a6675;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-retry {
  margin-top: 16px;
  padding: 10px 24px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.btn-retry:hover {
  background: #1565c0;
}

.btn-refresh {
  padding: 8px;
  background: #f5f7fb;
  border: 1px solid #e1e6f0;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
}

.btn-refresh:hover {
  background: #e3f0fc;
}

.ts-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
.ts-header h2 { margin:0; color:#213547; }
.tools { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; align-items: center; }
.ts-search, .ts-select {
  padding: 8px 12px; border:1px solid #e0e0e0; border-radius:10px; background:#fafafa; outline:none;
}
.ts-search:focus, .ts-select:focus { border-color:#e6b23a; }
.view-toggle .btn { padding:8px 12px; border-radius:10px; border:1px solid #e1e6f0; background:#f5f7fb; color:#1a3a6a; font-weight:700; cursor:pointer; }
.view-toggle .btn.active { background:#1976d2; color:#fff; border-color:#1976d2; }

.ts-cards {
  display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:16px;
}
.ts-card { display:flex; align-items:center; gap:14px; padding:16px; border-radius:14px; background:#fff; box-shadow:0 2px 12px #00000012; border:1px solid #f0f0f0; }
.ts-card .icon { width:56px; height:56px; border-radius:12px; display:grid; place-items:center; background:#f8f8f8; }
.ts-card .info { display:flex; flex-direction:column; }
.ts-card .label { color:#5a6675; font-weight:600; font-size:.95rem; }
.ts-card .value { color:#213547; font-size:1.6rem; font-weight:800; }
.ts-card.open .icon    { background:#e3f0fc; }
.ts-card.today .icon   { background:#fff7e1; }
.ts-card.overdue .icon { background:#ffebee; }
.ts-card.done .icon    { background:#eafaf0; }

.ts-charts { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px; }
.chart-card { background:#fff; border:1px solid #f0f0f0; border-radius:14px; box-shadow:0 2px 12px #00000010; padding:16px; }
.chart-card h3 { margin:0 0 10px; color:#213547; font-size:1.1rem; }

.ts-board { display:grid; grid-template-columns: repeat(4, 1fr); gap:14px; }
.col { background:#fff; border:1px solid #f0f0f0; border-radius:14px; padding:10px; }
.col-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.col-head .title { font-weight:800; color:#213547; }
.col-head .count { background:#f5f7fb; color:#1a3a6a; border:1px solid #e1e6f0; font-weight:800; font-size:.8rem; padding:2px 8px; border-radius:999px; }
.col-list { list-style:none; padding:0; margin:0; display:grid; gap:8px; min-height:48px; }
.card { border:1px solid #f0f0f0; border-radius:12px; padding:10px; background:#fff; box-shadow:0 1px 6px #0000000e; }
.card .row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.t-title { color:#213547; }
.meta { display:flex; align-items:center; gap:8px; color:#5a6675; margin-top:4px; }
.proj { max-width: 320px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.due { font-weight:700; }
.due.late { color:#c62828; }
.actions { display:flex; gap:10px; margin-top:6px; }
.link-btn { background:transparent; border:none; color:#1976d2; font-weight:700; cursor:pointer; }
.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.link-btn.ok { color:#2e7d32; }
.link-btn.done { color:#2e7d32; }

.ts-table-card { background:#fff; border-radius:14px; box-shadow:0 2px 12px #0000000f; border:1px solid #f0f0f0; padding:8px; }
.table-toolbar { display:flex; justify-content:space-between; align-items:center; padding:8px 6px 6px; }
.hint { color:#777; }
.table-wrap { overflow-x:auto; }
.ts-table { width:100%; border-collapse:collapse; }
.ts-table thead th {
  text-align:left; padding:12px 10px; border-bottom:2px solid #f0f0f0;
  font-weight:700; color:#213547; user-select:none; cursor:pointer; white-space:nowrap; position:relative;
}
.sortable::after {
  content:''; position:absolute; right:8px; top:50%;
  border-left:4px solid transparent; border-right:4px solid transparent; border-top:6px solid #c0c0c0;
  transform: translateY(-8px);
}
.sort-asc::after  { border-top:6px solid #1976d2; transform: translateY(-2px) rotate(180deg); }
.sort-desc::after { border-top:6px solid #1976d2; transform: translateY(-8px); }
.ts-table tbody td { padding:12px 10px; border-bottom:1px solid #f5f5f5; color:#213547; vertical-align:middle; }
.ts-table tbody tr:hover { background:#fafafa; }

.pill { padding:6px 10px; border-radius:999px; font-weight:700; font-size:.78rem; text-transform:uppercase; border:1px solid transparent; white-space:nowrap; }
.pill.todo        { color:#555; background:#f5f5f5; border-color:#e0e0e0; }
.pill.in-progress { color:#114f8f; background:#e3f0fc; border-color:#d2e6fa; }
.pill.review      { color:#9a4b00; background:#fff7e1; border-color:#ffe0b2; }
.pill.done        { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }

.pri { padding:3px 8px; border-radius:999px; font-weight:800; font-size:.72rem; border:1px solid transparent; text-transform:uppercase; letter-spacing:.02em; }
.pri.high   { color:#9c1f1f; background:#ffebee; border-color:#ffcdd2; }
.pri.medium { color:#9a4b00; background:#fff7e1; border-color:#ffe0b2; }
.pri.low    { color:#114f8f; background:#e3f0fc; border-color:#d2e6fa; }

.center { text-align:center; }
.muted { color:#777; }
.mono { font-family: ui-monospace, Menlo, Consolas, Monaco, monospace; }
.ellipsis { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }
.empty { color: #999; text-align: center; padding: 16px; font-style: italic; }

@media (max-width: 1100px) {
  .ts-board { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 900px) {
  .ts-cards { grid-template-columns: repeat(2, 1fr); }
  .ts-charts { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .ts-cards { grid-template-columns: 1fr; }
  .ts-board { grid-template-columns: 1fr; }
  .ellipsis { max-width: 160px; }
}
</style>