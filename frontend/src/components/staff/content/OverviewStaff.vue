<template>
  <div class="sv-wrap">
    <header class="sv-header">
      <h2>My Dashboard</h2>
      <input
        v-model="search"
        type="search"
        placeholder="Search tasks..."
        class="sv-search"
      />
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your dashboard...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchOverviewData">Retry</button>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <section class="sv-cards">
        <div class="sv-card tasks">
          <div class="icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#1976d2">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="info">
            <span class="label">Open Tasks</span>
            <span class="value">{{ stats.openTasks }}</span>
          </div>
        </div>
        <div class="sv-card due">
          <div class="icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#e6b23a">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </div>
          <div class="info">
            <span class="label">Due This Week</span>
            <span class="value">{{ stats.dueThisWeek }}</span>
          </div>
        </div>
        <div class="sv-card projects">
          <div class="icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#43a047">
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
            </svg>
          </div>
          <div class="info">
            <span class="label">Projects Assigned</span>
            <span class="value">{{ stats.projectsAssigned }}</span>
          </div>
        </div>
        <div class="sv-card alerts" :class="{ 'has-unread': stats.unreadNotices > 0 }">
          <div class="icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#8e24aa">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </div>
          <div class="info">
            <span class="label">Unread Notices</span>
            <span class="value">{{ stats.unreadNotices }}</span>
          </div>
        </div>
      </section>

      <!-- Overdue Warning -->
      <div v-if="stats.overdueTasks > 0" class="overdue-warning">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#c62828">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        <span>You have <strong>{{ stats.overdueTasks }}</strong> overdue task{{ stats.overdueTasks > 1 ? 's' : '' }}!</span>
      </div>

      <!-- Charts -->
      <section class="sv-charts">
        <div class="chart-card">
          <h3>Task Status</h3>
          <apexchart
            type="donut"
            :options="statusOptions"
            :series="statusSeries"
            height="260"
          />
        </div>
        <div class="chart-card">
          <h3>Activity This Week</h3>
          <apexchart
            type="bar"
            :options="activityOptions"
            :series="activitySeries"
            height="260"
          />
        </div>
      </section>

      <!-- My Tasks Table -->
      <section class="sv-table-card">
        <div class="table-toolbar">
          <h3>My Tasks</h3>
          <span class="hint">{{ filteredTasks.length }} task{{ filteredTasks.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="table-wrap">
          <table class="sv-table">
            <thead>
              <tr>
                <th @click="toggleSort('title')" :class="thClass('title')">Task</th>
                <th @click="toggleSort('project')" :class="thClass('project')">Project</th>
                <th @click="toggleSort('status')" :class="thClass('status')">Status</th>
                <th @click="toggleSort('priority')" :class="thClass('priority')">Priority</th>
                <th @click="toggleSort('deadline')" :class="thClass('deadline')">Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!sortedRows.length">
                <td colspan="6" class="center muted">No tasks assigned to you.</td>
              </tr>
              <tr v-for="t in sortedRows" :key="t.id" :class="{ overdue: isOverdue(t) }">
                <td>
                  <span class="task-title">{{ t.title }}</span>
                </td>
                <td>
                  <span class="mono ellipsis" :title="t.projectCode + ' | ' + t.projectTitle">
                    {{ t.projectCode }} | {{ t.projectTitle }}
                  </span>
                </td>
                <td>
                  <span class="pill" :class="t.status">{{ prettyStatus(t.status) }}</span>
                </td>
                <td>
                  <span class="pri" :class="t.priority || 'medium'">{{ (t.priority || 'medium').toUpperCase() }}</span>
                </td>
                <td :class="{ 'overdue-date': isOverdue(t) }">
                  {{ formatDate(t.deadline) }}
                  <span v-if="isOverdue(t)" class="overdue-badge">Overdue</span>
                </td>
                <td class="actions">
                  <button class="link-btn" @click="viewTask(t)">View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Recent Notifications -->
      <section class="sv-notifications" v-if="notifications.length > 0">
        <div class="notif-header">
          <h3>Recent Notifications</h3>
          <button 
            v-if="stats.unreadNotices > 0" 
            class="mark-all-btn"
            @click="markAllRead"
          >
            Mark all as read
          </button>
        </div>
        <ul class="notif-list">
          <li 
            v-for="n in notifications.slice(0, 5)" 
            :key="n.id"
            :class="{ unread: !n.read }"
            @click="markRead(n)"
          >
            <div class="notif-dot" :class="n.type"></div>
            <div class="notif-content">
              <p class="notif-message">{{ n.message }}</p>
              <span class="notif-time">{{ timeAgo(n.createdAt) }}</span>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { API_BASE_URL } from '../../../config'

// State
const loading = ref(true)
const error = ref('')
const search = ref('')
const sortKey = ref('deadline')
const sortDir = ref('asc')
const updatingTaskId = ref(null)

// Data from API
const tasks = ref([])
const projects = ref([])
const notifications = ref([])
const stats = ref({
  openTasks: 0,
  dueThisWeek: 0,
  overdueTasks: 0,
  projectsAssigned: 0,
  unreadNotices: 0
})

// Chart data
const statusSeries = ref([0, 0, 0, 0])
const statusOptions = ref({
  labels: ['To Do', 'In Progress', 'Review', 'Done'],
  colors: ['#bdbdbd', '#1976d2', '#e6b23a', '#43a047'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true }
})

const activitySeries = ref([{ name: 'Updates', data: [0, 0, 0, 0, 0, 0, 0] }])
const activityOptions = ref({
  chart: { toolbar: { show: false } },
  xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  colors: ['#8e24aa'],
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 6 } }
})

// Get staff ID from localStorage
function getStaffId() {
  const userData = localStorage.getItem('domus_user')
  if (!userData) return null
  const user = JSON.parse(userData)
  return user.id || user.docId || user.userId
}

// Fetch overview data
async function fetchOverviewData() {
  loading.value = true
  error.value = ''
  
  const staffId = getStaffId()
  if (!staffId) {
    error.value = 'Staff ID not found. Please log in again.'
    loading.value = false
    return
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/staff/overview?staffId=${staffId}`)
    const json = await res.json()

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load dashboard')
    }

    tasks.value = json.data.tasks || []
    projects.value = json.data.projects || []
    notifications.value = json.data.notifications || []
    stats.value = json.data.stats || stats.value

    // Update charts
    statusSeries.value = json.data.charts?.statusCounts || [0, 0, 0, 0]
    activityOptions.value.xaxis.categories = json.data.charts?.activityDays || []
    activitySeries.value = [{ name: 'Updates', data: json.data.charts?.activityData || [] }]

  } catch (e) {
    error.value = e.message || 'Network error'
  } finally {
    loading.value = false
  }
}

// Computed
const filteredTasks = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tasks.value
  return tasks.value.filter(t =>
    t.title?.toLowerCase().includes(q) ||
    t.projectCode?.toLowerCase().includes(q) ||
    t.projectTitle?.toLowerCase().includes(q) ||
    t.status?.toLowerCase().includes(q)
  )
})

const sortedRows = computed(() => {
  const arr = [...filteredTasks.value]
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1

  arr.sort((a, b) => {
    let va = a[key]
    let vb = b[key]

    // Handle project field
    if (key === 'project') {
      va = `${a.projectCode} ${a.projectTitle}`
      vb = `${b.projectCode} ${b.projectTitle}`
    }

    // Handle priority sorting
    if (key === 'priority') {
      const prioWeight = { high: 3, medium: 2, low: 1 }
      va = prioWeight[va] || 2
      vb = prioWeight[vb] || 2
      return (va - vb) * dir
    }

    // Handle date sorting
    if (key === 'deadline') {
      va = va ? new Date(va).getTime() : Infinity
      vb = vb ? new Date(vb).getTime() : Infinity
      return (va - vb) * dir
    }

    // String comparison
    const sa = String(va || '').toLowerCase()
    const sb = String(vb || '').toLowerCase()
    if (sa < sb) return -1 * dir
    if (sa > sb) return 1 * dir
    return 0
  })

  return arr
})

// Helpers
function thClass(key) {
  return {
    sortable: true,
    'sort-asc': sortKey.value === key && sortDir.value === 'asc',
    'sort-desc': sortKey.value === key && sortDir.value === 'desc'
  }
}

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function prettyStatus(s) {
  const map = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'done': 'Done'
  }
  return map[s] || s
}

function formatDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(t) {
  if (t.status === 'done' || !t.deadline) return false
  return new Date(t.deadline) < new Date()
}

function timeAgo(date) {
  if (!date) return ''
  const d = new Date(date)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const dd = Math.floor(h / 24)
  if (dd < 7) return `${dd}d ago`
  return d.toLocaleDateString()
}

function viewTask(t) {
  // Navigate to task details or open modal
  alert(`View task: ${t.title}\nProject: ${t.projectCode} - ${t.projectTitle}`)
}

async function updateStatus(task, newStatus) {
  const staffId = getStaffId()
  if (!staffId) return

  updatingTaskId.value = task.id

  try {
    const res = await fetch(`${API_BASE_URL}/api/staff/update-task-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: task.id,
        status: newStatus,
        staffId
      })
    })
    const json = await res.json()

    if (json.success) {
      task.status = newStatus
      task.updatedAt = new Date().toISOString()
      
      // Recalculate stats
      const openTasks = tasks.value.filter(t => t.status !== 'done').length
      stats.value.openTasks = openTasks

      // Update chart
      const statusCounts = { todo: 0, 'in-progress': 0, review: 0, done: 0 }
      tasks.value.forEach(t => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1
      })
      statusSeries.value = [statusCounts.todo, statusCounts['in-progress'], statusCounts.review, statusCounts.done]
    }
  } catch (e) {
    console.error('Failed to update task status:', e)
  } finally {
    updatingTaskId.value = null
  }
}

async function markRead(n) {
  if (n.read) return

  try {
    await fetch(`${API_BASE_URL}/api/staff/mark-notification-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: n.id })
    })
    n.read = true
    stats.value.unreadNotices = Math.max(0, stats.value.unreadNotices - 1)
  } catch (e) {
    console.error('Failed to mark notification as read:', e)
  }
}

async function markAllRead() {
  const staffId = getStaffId()
  if (!staffId) return

  try {
    await fetch(`${API_BASE_URL}/api/staff/mark-all-notifications-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId })
    })
    notifications.value.forEach(n => (n.read = true))
    stats.value.unreadNotices = 0
  } catch (e) {
    console.error('Failed to mark all notifications as read:', e)
  }
}

onMounted(fetchOverviewData)
</script>

<script>
export default {
  components: {
    apexchart: VueApexCharts
  }
}
</script>

<style scoped>
.sv-wrap {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
}

.sv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.sv-header h2 { margin: 0; color: #213547; }
.sv-search {
  flex: 0 0 280px;
  max-width: 50vw;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fafafa;
  outline: none;
}
.sv-search:focus { border-color: #e6b23a; }

/* Loading & Error */
.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.retry-btn {
  background: #1976d2;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.retry-btn:hover { background: #1565c0; }

/* KPI Cards */
.sv-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}
.sv-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 12px #00000012;
  border: 1px solid #f0f0f0;
  transition: transform 0.2s, box-shadow 0.2s;
}
.sv-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px #00000018;
}
.sv-card .icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #f8f8f8;
}
.sv-card .info { display: flex; flex-direction: column; }
.sv-card .label { color: #5a6675; font-weight: 600; font-size: .95rem; }
.sv-card .value { color: #213547; font-size: 1.6rem; font-weight: 800; }
.sv-card.tasks .icon { background: #e3f0fc; }
.sv-card.due .icon { background: #fff7e1; }
.sv-card.projects .icon { background: #eafaf0; }
.sv-card.alerts .icon { background: #f6eaff; }
.sv-card.alerts.has-unread .icon { background: #ffebee; }
.sv-card.alerts.has-unread .value { color: #c62828; }

/* Overdue Warning */
.overdue-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 18px;
  color: #c62828;
  font-weight: 500;
}

/* Charts */
.sv-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}
.chart-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 2px 12px #00000010;
  padding: 16px;
}
.chart-card h3 { margin: 0 0 10px; color: #213547; font-size: 1.1rem; }

/* Table */
.sv-table-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px #0000000f;
  border: 1px solid #f0f0f0;
  padding: 8px;
  margin-bottom: 18px;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 6px 6px;
}
.table-toolbar h3 { margin: 0; color: #213547; font-size: 1.1rem; }
.hint { color: #777; }

.table-wrap { overflow-x: auto; }
.sv-table { width: 100%; border-collapse: collapse; }
.sv-table thead th {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 2px solid #f0f0f0;
  font-weight: 700;
  color: #213547;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  position: relative;
}
.sortable::after {
  content: ' ';
  position: absolute;
  right: 8px;
  top: 50%;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid #c0c0c0;
  transform: translateY(-50%);
}
.sort-asc::after {
  border-top: 6px solid #1976d2;
  transform: translateY(-2px) rotate(180deg);
}
.sort-desc::after {
  border-top: 6px solid #1976d2;
  transform: translateY(-8px);
}

.sv-table tbody td {
  padding: 12px 10px;
  border-bottom: 1px solid #f5f5f5;
  color: #213547;
}
.sv-table tbody tr:hover { background: #fafafa; }
.sv-table tbody tr.overdue { background: #fff8f8; }

.task-title { font-weight: 500; }

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: .78rem;
  text-transform: uppercase;
  border: 1px solid transparent;
  white-space: nowrap;
}
.pill.todo { color: #555; background: #f5f5f5; border-color: #e0e0e0; }
.pill.in-progress { color: #114f8f; background: #e3f0fc; border-color: #d2e6fa; }
.pill.review { color: #9a4b00; background: #fff4e5; border-color: #ffe0b2; }
.pill.done { color: #1f7a1f; background: #ecfaec; border-color: #cfeccc; }

.pri {
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: .75rem;
  border: 1px solid transparent;
  text-transform: uppercase;
  letter-spacing: .02em;
}
.pri.high { color: #9c1f1f; background: #ffebee; border-color: #ffcdd2; }
.pri.medium { color: #9a4b00; background: #fff7e1; border-color: #ffe0b2; }
.pri.low { color: #114f8f; background: #e3f0fc; border-color: #d2e6fa; }

.overdue-date { color: #c62828; }
.overdue-badge {
  display: inline-block;
  background: #c62828;
  color: #fff;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
  font-weight: 700;
}

.actions { display: flex; gap: 8px; align-items: center; }
.link-btn {
  background: transparent;
  border: none;
  color: #1976d2;
  font-weight: 700;
  cursor: pointer;
}
.status-select {
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  background: #fff;
}
.status-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Notifications */
.sv-notifications {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px #0000000f;
  border: 1px solid #f0f0f0;
  padding: 16px;
}
.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.notif-header h3 { margin: 0; color: #213547; font-size: 1.1rem; }
.mark-all-btn {
  background: none;
  border: none;
  color: #1976d2;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}
.mark-all-btn:hover { text-decoration: underline; }

.notif-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.notif-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.notif-list li:hover { background: #f8f8f8; }
.notif-list li.unread { background: #f0f7ff; }

.notif-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  background: #ccc;
}
.notif-dot.staff_assigned { background: #1976d2; }
.notif-dot.task_created { background: #43a047; }
.notif-dot.staff_removed { background: #c62828; }
.notif-dot.created_project { background: #e6b23a; }

.notif-content { flex: 1; }
.notif-message { margin: 0 0 4px; color: #213547; font-size: 0.95rem; }
.notif-time { color: #888; font-size: 0.8rem; }

.center { text-align: center; }
.muted { color: #777; }
.mono { font-family: ui-monospace, Menlo, Consolas, Monaco, monospace; }
.ellipsis {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

@media (max-width: 900px) {
  .sv-cards { grid-template-columns: repeat(2, 1fr); }
  .sv-charts { grid-template-columns: 1fr; }
  .sv-search { flex: 1; }
}

@media (max-width: 560px) {
  .sv-cards { grid-template-columns: 1fr; }
  .sv-header { flex-direction: column; align-items: stretch; }
  .sv-search { max-width: 100%; }
}
</style>