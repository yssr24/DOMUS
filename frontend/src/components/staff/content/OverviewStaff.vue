<template>
  <div class="sv-wrap">
    <header class="sv-header">
      <h2>My Overview</h2>
      <input v-model="search" type="search" class="sv-search" placeholder="Search task, project, status..." />
    </header>

    <!-- KPI Cards -->
    <section class="sv-cards">
      <div class="sv-card tasks">
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="#1976d2"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div class="info">
          <div class="label">Open Tasks</div>
          <div class="value">{{ myOpenTasks }}</div>
        </div>
      </div>
      <div class="sv-card due">
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="#e6b23a"/><path d="M7 2v4M17 2v4M3 10h18" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="3" fill="#fff"/></svg>
        </div>
        <div class="info">
          <div class="label">Due This Week</div>
          <div class="value">{{ dueThisWeek }}</div>
        </div>
      </div>
      <div class="sv-card projects">
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" fill="#43a047"/><path d="M3 7l9 6 9-6" stroke="#fff" stroke-width="2"/></svg>
        </div>
        <div class="info">
          <div class="label">Projects Assigned</div>
          <div class="value">{{ projectsAssigned }}</div>
        </div>
      </div>
      <div class="sv-card alerts">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2z" fill="#8e24aa"/><rect x="11" y="8" width="2" height="6" rx="1" fill="#fff"/><circle cx="12" cy="17" r="1.6" fill="#fff"/></svg>
        </div>
        <div class="info">
          <div class="label">Unread Notices</div>
          <div class="value">{{ unreadNotices }}</div>
        </div>
      </div>
    </section>

    <!-- Charts -->
    <section class="sv-charts">
      <div class="chart-card">
        <h3>Tasks by Status</h3>
        <apexchart type="donut" height="240" :options="statusOptions" :series="statusSeries" />
      </div>
      <div class="chart-card">
        <h3>Activity (Last 7 Days)</h3>
        <apexchart type="bar" height="240" :options="activityOptions" :series="activitySeries" />
      </div>
    </section>

    <!-- My Tasks Table -->
    <section class="sv-table-card">
      <div class="table-toolbar">
        <span class="hint">{{ sortedRows.length }} of {{ tasks.length }} shown</span>
      </div>
      <div class="table-wrap">
        <table class="sv-table">
          <thead>
            <tr>
              <th @click="toggleSort('title')" :class="thClass('title')">Task</th>
              <th @click="toggleSort('project')" :class="thClass('project')">Project</th>
              <th @click="toggleSort('status')" :class="thClass('status')">Status</th>
              <th @click="toggleSort('priority')" :class="thClass('priority')">Priority</th>
              <th @click="toggleSort('dueDate')" :class="thClass('dueDate')">Due</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in sortedRows" :key="t.id">
              <td class="ellipsis" :title="t.title">{{ t.title }}</td>
              <td class="ellipsis" :title="t.project">{{ t.project }}</td>
              <td><span class="pill" :class="t.status">{{ prettyStatus(t.status) }}</span></td>
              <td><span class="pri" :class="t.priority">{{ t.priority }}</span></td>
              <td class="mono">{{ formatDate(t.dueDate) }}</td>
              <td class="actions">
                <button class="link-btn" @click="viewTask(t)">View</button>
              </td>
            </tr>
            <tr v-if="!sortedRows.length">
              <td colspan="6" class="center muted">No tasks found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const search = ref('')
const sortKey = ref('dueDate')
const sortDir = ref('asc')

// Sample tasks (assigned to current staff)
const tasks = ref([
  { id: 't1', title: 'Submit Design',      project: 'PR-0007 | Rivera Residence', status: 'in-progress', priority: 'high',   dueDate: new Date(Date.now() + 2*86400000) },
  { id: 't2', title: 'Structural Notes',   project: 'PR-0010 | Loyola Townhouse', status: 'review',       priority: 'medium', dueDate: new Date(Date.now() + 5*86400000) },
  { id: 't3', title: 'Site Survey Upload', project: 'PR-0003 | Dela Cruz House',  status: 'todo',         priority: 'low',    dueDate: new Date(Date.now() + 7*86400000) },
  { id: 't4', title: 'Coordination Call',  project: 'PR-0005 | Gomez Office',     status: 'done',         priority: 'low',    dueDate: new Date(Date.now() - 1*86400000) },
  { id: 't5', title: 'Schematic Layout',   project: 'PR-0010 | Loyola Townhouse', status: 'in-progress',  priority: 'high',   dueDate: new Date(Date.now() + 1*86400000) },
])

// KPI
const myOpenTasks = computed(() => tasks.value.filter(t => t.status !== 'done').length)
const dueThisWeek = computed(() => {
  const now = Date.now(), week = 7 * 86400000
  return tasks.value.filter(t => t.status !== 'done' && t.dueDate && (t.dueDate - now) <= week && (t.dueDate - now) >= 0).length
})
const projectsAssigned = computed(() => new Set(tasks.value.map(t => t.project.split('|')[0].trim())).size)
const unreadNotices = ref(3)

// Charts
const statusSeries = computed(() => {
  const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0 }
  tasks.value.forEach(t => counts[t.status] = (counts[t.status] || 0) + 1)
  return [counts.todo, counts['in-progress'], counts.review, counts.done]
})
const statusOptions = ref({
  labels: ['To Do', 'In Progress', 'Review', 'Done'],
  colors: ['#bdbdbd','#1976d2','#e6b23a','#43a047'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true }
})

const days = ['Thu','Fri','Sat','Sun','Mon','Tue','Wed']
const activitySeries = ref([{ name: 'Updates', data: [1,2,1,3,2,4,3] }])
const activityOptions = ref({
  chart: { toolbar: { show: false } },
  xaxis: { categories: days },
  colors: ['#8e24aa'],
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 6 } }
})

// Table helpers
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tasks.value
  return tasks.value.filter(t =>
    [t.title, t.project, t.status, t.priority].some(v => String(v).toLowerCase().includes(q))
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
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filtered.value].sort((a, b) => {
    let va = a[key], vb = b[key]
    if (key === 'dueDate') return ((+new Date(va)) - (+new Date(vb))) * dir
    va = String(va ?? '').toLowerCase(); vb = String(vb ?? '').toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

function prettyStatus(s) {
  return ({ 'in-progress': 'In Progress', review: 'Review', todo: 'To Do', done: 'Done' }[s] || s)
}
function formatDate(v) {
  if (!v) return '—'
  const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v
  return d.toLocaleDateString()
}
function viewTask(t) {
  alert(`Open task: ${t.title}`)
}
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
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px;
}
.sv-header h2 { margin: 0; color: #213547; }
.sv-search {
  flex: 0 0 320px; max-width: 60vw;
  padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 10px; background:#fafafa; outline: none;
}
.sv-search:focus { border-color: #e6b23a; }

.sv-cards {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;
}
.sv-card {
  display: flex; align-items: center; gap: 14px; padding: 16px;
  border-radius: 14px; background:#fff; box-shadow:0 2px 12px #00000012; border:1px solid #f0f0f0;
}
.sv-card .icon { width:56px; height:56px; border-radius:12px; display:grid; place-items:center; background:#f8f8f8; }
.sv-card .info { display:flex; flex-direction:column; }
.sv-card .label { color:#5a6675; font-weight:600; font-size:.95rem; }
.sv-card .value { color:#213547; font-size:1.6rem; font-weight:800; }
.sv-card.tasks .icon   { background:#e3f0fc; }
.sv-card.due .icon     { background:#fff7e1; }
.sv-card.projects .icon{ background:#eafaf0; }
.sv-card.alerts .icon  { background:#f6eaff; }

.sv-charts { display:grid; grid-template-columns: 1fr 1fr; gap:18px; margin-bottom:18px; }
.chart-card { background:#fff; border:1px solid #f0f0f0; border-radius:14px; box-shadow:0 2px 12px #00000010; padding:16px; }
.chart-card h3 { margin:0 0 10px; color:#213547; font-size:1.1rem; }

.sv-table-card { background:#fff; border-radius:14px; box-shadow:0 2px 12px #0000000f; border:1px solid #f0f0f0; padding:8px; }
.table-toolbar { display:flex; justify-content:space-between; align-items:center; padding:8px 6px 6px; }
.hint { color:#777; }

.table-wrap { overflow-x:auto; }
.sv-table { width:100%; border-collapse:collapse; }
.sv-table thead th {
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

.sv-table tbody td { padding:12px 10px; border-bottom:1px solid #f5f5f5; color:#213547; }
.sv-table tbody tr:hover { background:#fafafa; }
.pill {
  padding:6px 10px; border-radius:999px; font-weight:700; font-size:.78rem; text-transform:uppercase; border:1px solid transparent; white-space:nowrap;
}
.pill.todo        { color:#555; background:#f5f5f5; border-color:#e0e0e0; }
.pill.in-progress { color:#114f8f; background:#e3f0fc; border-color:#d2e6fa; }
.pill.review      { color:#9a4b00; background:#fff4e5; border-color:#ffe0b2; }
.pill.done        { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }

.pri { padding:4px 10px; border-radius:999px; font-weight:800; font-size:.75rem; border:1px solid transparent; text-transform:uppercase; letter-spacing:.02em; }
.pri.high   { color:#9c1f1f; background:#ffebee; border-color:#ffcdd2; }
.pri.medium { color:#9a4b00; background:#fff7e1; border-color:#ffe0b2; }
.pri.low    { color:#114f8f; background:#e3f0fc; border-color:#d2e6fa; }

.actions { display:flex; gap:10px; }
.link-btn { background:transparent; border:none; color:#1976d2; font-weight:700; cursor:pointer; }

.center { text-align:center; }
.muted { color:#777; }
.mono { font-family: ui-monospace, Menlo, Consolas, Monaco, monospace; }
.ellipsis { max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }

@media (max-width: 900px) {
  .sv-cards { grid-template-columns: repeat(2, 1fr); }
  .sv-charts { grid-template-columns: 1fr; }
  .sv-search { flex: 1; min-width: 0; }
}
@media (max-width: 560px) {
  .sv-cards { grid-template-columns: 1fr; }
  .ellipsis { max-width: 160px; }
}
</style>