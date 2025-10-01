<template>
  <div class="ps-wrap">
    <header class="ps-header">
      <h2>My Projects</h2>
      <div class="tools">
        <input v-model="search" type="search" class="ps-search" placeholder="Search code, project, client..." />
        <select v-model="statusFilter" class="ps-select">
          <option value="all">All statuses</option>
          <option value="planning">Planning</option>
          <option value="design">Design</option>
          <option value="review">Review</option>
          <option value="construction">Construction</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>
    </header>

    <!-- KPI Cards -->
    <section class="ps-cards">
      <div class="ps-card total">
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" fill="#1976d2"/><path d="M3 7l9 6 9-6" stroke="#fff" stroke-width="2"/></svg>
        </div>
        <div class="info">
          <div class="label">Total Projects</div>
          <div class="value">{{ totalProjects }}</div>
        </div>
      </div>

      <div class="ps-card prog">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M4 18V6h4v12H4zm6 0V9h4v9h-4zm6 0v-6h4v6h-4z" fill="#43a047"/></svg>
        </div>
        <div class="info">
          <div class="label">In Progress</div>
          <div class="value">{{ inProgressCount }}</div>
        </div>
      </div>

      <div class="ps-card review">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M4 4h16v14H9l-5 4V4z" fill="#8e24aa"/></svg>
        </div>
        <div class="info">
          <div class="label">In Review</div>
          <div class="value">{{ reviewCount }}</div>
        </div>
      </div>

      <div class="ps-card due">
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="#e6b23a"/><path d="M7 2v4M17 2v4M3 10h18" stroke="#fff" stroke-width="2"/><circle cx="12" cy="16" r="3" fill="#fff"/></svg>
        </div>
        <div class="info">
          <div class="label">Due This Month</div>
          <div class="value">{{ dueThisMonth }}</div>
        </div>
      </div>
    </section>

    <!-- Charts -->
    <section class="ps-charts">
      <div class="chart-card">
        <h3>Projects by Status</h3>
        <apexchart type="donut" height="240" :options="statusOptions" :series="statusSeries" />
      </div>
      <div class="chart-card">
        <h3>Progress by Project</h3>
        <apexchart type="bar" height="240" :options="progressOptions" :series="progressSeries" />
      </div>
    </section>

    <!-- Projects Table -->
    <section class="ps-table-card">
      <div class="table-toolbar">
        <span class="hint">{{ sortedRows.length }} of {{ projects.length }} shown</span>
      </div>

      <div class="table-wrap">
        <table class="ps-table">
          <thead>
            <tr>
              <th @click="toggleSort('code')" :class="thClass('code')">Code</th>
              <th @click="toggleSort('title')" :class="thClass('title')">Project</th>
              <th @click="toggleSort('client')" :class="thClass('client')">Client</th>
              <th @click="toggleSort('status')" :class="thClass('status')">Status</th>
              <th @click="toggleSort('progress')" :class="thClass('progress')">Progress</th>
              <th @click="toggleSort('tasksOpen')" :class="thClass('tasksOpen')">Open Tasks</th>
              <th @click="toggleSort('dueDate')" :class="thClass('dueDate')">Deadline</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in sortedRows" :key="p.id">
              <td class="mono">{{ p.code }}</td>
              <td class="ellipsis" :title="p.title">{{ p.title }}</td>
              <td class="ellipsis" :title="p.client">{{ p.client }}</td>
              <td><span class="pill" :class="statusClass(p.status)">{{ prettyStatus(p.status) }}</span></td>
              <td>
                <div class="progress">
                  <div class="bar" :style="{ width: p.progress + '%' }"></div>
                </div>
                <span class="mono small">{{ p.progress }}%</span>
              </td>
              <td class="mono">{{ p.tasksOpen }}</td>
              <td class="mono">{{ formatDate(p.dueDate) }}</td>
              <td class="actions">
                <button class="link-btn" @click="openProject(p)">Open</button>
                <button class="link-btn" @click="viewTasks(p)">Tasks</button>
                <button class="link-btn" @click="viewFiles(p)">Files</button>
              </td>
            </tr>
            <tr v-if="!sortedRows.length">
              <td colspan="8" class="center muted">No projects found.</td>
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
const statusFilter = ref('all')
const sortKey = ref('dueDate')
const sortDir = ref('asc')

const projects = ref([
  { id: 'p1', code: 'PR-0007', title: 'Rivera Residence',    client: 'Rivera, Kim',  status: 'design',       progress: 62, tasksOpen: 5,  dueDate: new Date(Date.now() + 20*86400000), updatedAt: new Date() },
  { id: 'p2', code: 'PR-0005', title: 'Gomez Office Fit-out', client: 'Reyes, Maria', status: 'review',       progress: 78, tasksOpen: 2,  dueDate: new Date(Date.now() + 10*86400000), updatedAt: new Date(Date.now()-2*86400000) },
  { id: 'p3', code: 'PR-0010', title: 'Loyola Townhouse',     client: 'Dela Cruz, Ana', status: 'planning',    progress: 20, tasksOpen: 8,  dueDate: new Date(Date.now() + 35*86400000), updatedAt: new Date(Date.now()-4*86400000) },
  { id: 'p4', code: 'PR-0003', title: 'Dela Cruz House',      client: 'Santos, Juan', status: 'construction', progress: 45, tasksOpen: 12, dueDate: new Date(Date.now() + 55*86400000), updatedAt: new Date(Date.now()-6*86400000) },
  { id: 'p5', code: 'PR-0008', title: 'Coastal Cabin',        client: 'Rivera, Kim',  status: 'completed',    progress: 100, tasksOpen: 0, dueDate: new Date(Date.now() - 5*86400000),  updatedAt: new Date(Date.now()-8*86400000) },
  { id: 'p6', code: 'PR-0012', title: 'Community Center',     client: 'LGU Mindoro',  status: 'on-hold',      progress: 35, tasksOpen: 3,  dueDate: new Date(Date.now() + 90*86400000), updatedAt: new Date(Date.now()-3*86400000) },
])

// KPIs
const totalProjects = computed(() => projects.value.length)
const inProgressCount = computed(() => projects.value.filter(p => !['completed', 'on-hold'].includes(p.status)).length)
const reviewCount = computed(() => projects.value.filter(p => p.status === 'review').length)
const dueThisMonth = computed(() => {
  const now = new Date()
  return projects.value.filter(p => p.dueDate && p.dueDate.getMonth() === now.getMonth() && p.dueDate.getFullYear() === now.getFullYear()).length
})

// Charts
const statusSeries = computed(() => {
  const map = { planning:0, design:0, review:0, construction:0, completed:0, 'on-hold':0 }
  projects.value.forEach(p => map[p.status] = (map[p.status] || 0) + 1)
  return [map.planning, map.design, map.review, map.construction, map.completed, map['on-hold']]
})
const statusOptions = ref({
  labels: ['Planning', 'Design', 'Review', 'Construction', 'Completed', 'On Hold'],
  colors: ['#bdbdbd', '#1976d2', '#8e24aa', '#43a047', '#90a4ae', '#e6b23a'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
  chart: { toolbar: { show: false } }
})

const progressSeries = computed(() => [{
  name: 'Progress',
  data: projects.value.map(p => p.progress)
}])
const progressOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 6 } },
  xaxis: { categories: projects.value.map(p => p.code), max: 100, labels: { formatter: v => `${v}%` } },
  dataLabels: { enabled: false },
  colors: ['#1976d2']
}))

// Table helpers
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const sf = statusFilter.value
  return projects.value.filter(p => {
    if (sf !== 'all' && p.status !== sf) return false
    if (!q) return true
    return [p.code, p.title, p.client, p.status].some(v => String(v || '').toLowerCase().includes(q))
  })
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
    if (key === 'progress' || key === 'tasksOpen') return ((va || 0) - (vb || 0)) * dir
    if (key === 'dueDate') return ((+new Date(va)) - (+new Date(vb))) * dir
    va = String(va ?? '').toLowerCase(); vb = String(vb ?? '').toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

// UI helpers
function prettyStatus(s) {
  return ({ planning:'Planning', design:'Design', review:'Review', construction:'Construction', completed:'Completed', 'on-hold':'On Hold' }[s] || s)
}
function statusClass(s) {
  return {
    planning: s === 'planning',
    design: s === 'design',
    review: s === 'review',
    construction: s === 'construction',
    completed: s === 'completed',
    onhold: s === 'on-hold'
  }
}
function formatDate(v) {
  if (!v) return '—'
  const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v
  return d.toLocaleDateString()
}
function openProject(p) { alert(`Open project ${p.code} — ${p.title}`) }
function viewTasks(p) { alert(`View tasks for ${p.code}`) }
function viewFiles(p) { alert(`View files for ${p.code}`) }
</script>

<script>
export default {
  components: {
    apexchart: VueApexCharts
  }
}
</script>

<style scoped>
.ps-wrap {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
}
.ps-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
.ps-header h2 { margin:0; color:#213547; }
.tools { display:flex; gap:8px; flex-wrap:wrap; }
.ps-search, .ps-select {
  padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 10px; background:#fafafa; outline: none;
}
.ps-search:focus, .ps-select:focus { border-color:#e6b23a; }

.ps-cards {
  display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:16px;
}
.ps-card {
  display:flex; align-items:center; gap:14px; padding:16px; border-radius:14px; background:#fff;
  box-shadow:0 2px 12px #00000012; border:1px solid #f0f0f0;
}
.ps-card .icon { width:56px; height:56px; border-radius:12px; display:grid; place-items:center; background:#f8f8f8; }
.ps-card .info { display:flex; flex-direction:column; }
.ps-card .label { color:#5a6675; font-weight:600; font-size:.95rem; }
.ps-card .value { color:#213547; font-size:1.6rem; font-weight:800; }
.ps-card.total .icon { background:#e3f0fc; }
.ps-card.prog .icon  { background:#eafaf0; }
.ps-card.review .icon{ background:#f6eaff; }
.ps-card.due .icon   { background:#fff7e1; }

.ps-charts { display:grid; grid-template-columns: 1fr 1fr; gap:18px; margin-bottom:18px; }
.chart-card { background:#fff; border:1px solid #f0f0f0; border-radius:14px; box-shadow:0 2px 12px #00000010; padding:16px; }
.chart-card h3 { margin:0 0 10px; color:#213547; font-size:1.1rem; }

.ps-table-card { background:#fff; border-radius:14px; box-shadow:0 2px 12px #0000000f; border:1px solid #f0f0f0; padding:8px; }
.table-toolbar { display:flex; justify-content:space-between; align-items:center; padding:8px 6px 6px; }
.hint { color:#777; }
.table-wrap { overflow-x:auto; }

.ps-table { width:100%; border-collapse:collapse; }
.ps-table thead th {
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

.ps-table tbody td { padding:12px 10px; border-bottom:1px solid #f5f5f5; color:#213547; vertical-align:middle; }
.ps-table tbody tr:hover { background:#fafafa; }

.pill {
  padding:6px 10px; border-radius:999px; font-weight:700; font-size:.78rem; text-transform:uppercase; border:1px solid transparent; white-space:nowrap;
}
.pill.planning     { color:#555; background:#f5f5f5; border-color:#e0e0e0; }
.pill.design       { color:#114f8f; background:#e3f0fc; border-color:#d2e6fa; }
.pill.review       { color:#6a0596; background:#f6eaff; border-color:#ead6ff; }
.pill.construction { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }
.pill.completed    { color:#37474f; background:#eceff1; border-color:#cfd8dc; }
.pill.onhold       { color:#9a4b00; background:#fff4e5; border-color:#ffe0b2; }

.progress { width:140px; background:#f1f3f5; height:10px; border-radius:999px; overflow:hidden; display:inline-block; vertical-align:middle; margin-right:8px; }
.progress .bar { height:100%; background:#1976d2; }

.actions { display:flex; gap:10px; }
.link-btn { background:transparent; border:none; color:#1976d2; font-weight:700; cursor:pointer; }

.center { text-align:center; }
.muted { color:#777; }
.mono { font-family: ui-monospace, Menlo, Consolas, Monaco, monospace; }
.small { font-size:.85rem; }
.ellipsis { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }

@media (max-width: 900px) {
  .ps-cards { grid-template-columns: repeat(2, 1fr); }
  .ps-charts { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .ps-cards { grid-template-columns: 1fr; }
  .ellipsis { max-width: 160px; }
  .progress { width: 100px; }
}
</style>