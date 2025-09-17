<template>
  <div class="tm-wrap">
    <header class="tm-header">
      <h2>Task Management</h2>
      <input v-model="search" type="search" class="tm-search" placeholder="Search task, assignee, project, status..." />
    </header>

    <section class="tm-cards">
      <div class="tm-card total">
        <div class="icon"><svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg></div>
        <div class="info"><div class="label">Total Tasks</div><div class="value">{{ totalCount }}</div></div>
      </div>
      <div class="tm-card pending">
        <div class="icon"><svg viewBox="0 0 24 24"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg></div>
        <div class="info"><div class="label">Pending</div><div class="value">{{ pendingCount }}</div></div>
      </div>
      <div class="tm-card review">
        <div class="icon"><svg viewBox="0 0 24 24"><path d="M21 21l-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/></svg></div>
        <div class="info"><div class="label">On Review</div><div class="value">{{ reviewCount }}</div></div>
      </div>
      <div class="tm-card done">
        <div class="icon"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>
        <div class="info"><div class="label">Completed</div><div class="value">{{ completedCount }}</div></div>
      </div>
    </section>

    <div class="tm-actions">
      <button class="create-task-btn" @click="onCreateTask">
        <span class="btn-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#fff" d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5V6a1 1 0 0 1 1-1z"/>
          </svg>
        </span>
        Create Task
      </button>
    </div>

    <section class="tm-table-card">
      <div class="table-wrap">
        <table class="tm-table">
          <thead>
            <tr>
              <th @click="toggleSort('title')" :class="thClass('title')">Task</th>
              <th @click="toggleSort('projectTitle')" :class="thClass('projectTitle')">Project</th>
              <th @click="toggleSort('assigneeName')" :class="thClass('assigneeName')">Assignee</th>
              <th @click="toggleSort('status')" :class="thClass('status')">Status</th>
              <th @click="toggleSort('dueDate')" :class="thClass('dueDate')">Due</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" class="center muted">Loading...</td></tr>
            <tr v-else-if="error"><td colspan="5" class="center error">{{ error }}</td></tr>
            <tr v-else-if="!sortedRows.length"><td colspan="5" class="center muted">No tasks found.</td></tr>
            <tr v-for="t in sortedRows" :key="t.id">
              <td>{{ t.title }}</td>
              <td>{{ t.projectTitle }}</td>
              <td>{{ t.assigneeName }}</td>
              <td><span class="pill" :class="statusClass(t.status)">{{ prettyStatus(t.status) }}</span></td>
              <td class="mono">{{ formatDate(t.dueDate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
// filepath: c:\Users\VIVOBOOK\OneDrive - Mindoro State University\Desktop\DOMUS Architecture\frontend\src\components\admin\content\taskManagement.vue
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../../../config'

const router = useRouter()
const tasks = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const sortKey = ref('dueDate')
const sortDir = ref('asc')

function onCreateTask() {
  router.push('/admin/create-task')
}

function thClass(key) { return { sortable: true, 'sort-asc': sortKey.value === key && sortDir.value === 'asc', 'sort-desc': sortKey.value === key && sortDir.value === 'desc' } }
function toggleSort(key) { if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'; else { sortKey.value = key; sortDir.value = 'asc' } }

const norm = s => (s || '').toLowerCase()
const totalCount = computed(() => tasks.value.length)
const pendingCount = computed(() => tasks.value.filter(t => ['todo','in-progress','pending'].includes(norm(t.status))).length)
const reviewCount = computed(() => tasks.value.filter(t => ['review','on review','in review'].includes(norm(t.status))).length)
const completedCount = computed(() => tasks.value.filter(t => ['done','completed'].includes(norm(t.status))).length)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tasks.value
  return tasks.value.filter(t =>
    String(t.title).toLowerCase().includes(q) ||
    String(t.projectTitle).toLowerCase().includes(q) ||
    String(t.assigneeName).toLowerCase().includes(q) ||
    String(t.status).toLowerCase().includes(q)
  )
})

const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filtered.value].sort((a, b) => {
    const va = a[key] ?? ''
    const vb = b[key] ?? ''
    // Date sort safety
    if (key === 'dueDate') {
      const ta = va ? new Date(va).getTime() : 0
      const tb = vb ? new Date(vb).getTime() : 0
      return (ta - tb) * dir
    }
    const sa = va.toString().toLowerCase()
    const sb = vb.toString().toLowerCase()
    if (sa < sb) return -1 * dir
    if (sa > sb) return 1 * dir
    return 0
  })
})

function prettyStatus(s) { return (s || '').replace(/\b\w/g, c => c.toUpperCase()) }
function statusClass(s) {
  const v = norm(s)
  return { pending: ['todo','in-progress','pending'].includes(v), review: ['review','on review','in review'].includes(v), done: ['done','completed'].includes(v) }
}
function formatDate(v) { if (!v) return '—'; const d = typeof v === 'string' ? new Date(v) : v; return d.toLocaleDateString() }

async function fetchTasks() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/tasks`)
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load tasks')
    tasks.value = json.data || []
  } catch (e) {
    error.value = e.message || 'Network error'
  } finally {
    loading.value = false
  }
}

onMounted(fetchTasks)
</script>

<style scoped>
.tm-wrap {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
}
.tm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.tm-header h2 { margin: 0; color: #213547; }
.tm-search {
  flex: 0 0 320px;
  max-width: 60vw;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fafafa;
  outline: none;
}
.tm-search:focus { border-color: #e6b23a; }

.tm-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.tm-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 12px #00000012;
  border: 1px solid #f0f0f0;
}
.tm-card .icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}
.tm-card .icon svg {
  width: 28px;
  height: 28px;
  fill: #fff;
  stroke: #fff;
  stroke-width: 2;
}
.tm-card .info { display: flex; flex-direction: column; }
.tm-card .label { color: #5a6675; font-weight: 600; font-size: .95rem; }
.tm-card .value { color: #213547; font-size: 1.7rem; font-weight: 800; }

.tm-card.total .icon   { background: #1976d2; }
.tm-card.pending .icon { background: #fbc02d; }
.tm-card.review .icon  { background: #8e24aa; }
.tm-card.done .icon    { background: #43a047; }

.tm-table-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px #0000000f;
  border: 1px solid #f0f0f0;
  padding: 8px;
}
.table-wrap { overflow-x: auto; }
.tm-table { width: 100%; border-collapse: collapse; }
.tm-table thead th {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 2px solid #f0f0f0;
  font-weight: 700;
  color: #213547;
  position: relative;
  user-select: none;
  cursor: pointer;
  white-space: nowrap;
}
.tm-table tbody td {
  padding: 12px 10px;
  border-bottom: 1px solid #f5f5f5;
  color: #213547;
}
.tm-table tbody tr:hover { background: #fafafa; }

.sortable::after {
  content: ' ';
  position: absolute;
  right: 8px;
  top: 50%;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid #c0c0c0;
  transform: translateY(-8px);
}
.sort-asc::after  { border-top: 6px solid #1976d2; transform: translateY(-2px) rotate(180deg); }
.sort-desc::after { border-top: 6px solid #1976d2; transform: translateY(-8px); }

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: .78rem;
  text-transform: uppercase;
  border: 1px solid transparent;
  white-space: nowrap;
}
.pill.pending { color:#b36b00; background:#fff7e1; border-color:#ffe6a6; }
.pill.review  { color:#6a0596; background:#f6eaff; border-color:#ead6ff; }
.pill.done    { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }

.center { text-align: center; }
.muted { color: #777; }
.error { color: #c62828; }
.mono { font-family: ui-monospace, Menlo, Consolas, Monaco, monospace; }

.tm-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 6px 0 16px;
}
.create-task-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px #1976d244;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.create-task-btn:hover { background: #1565c0; box-shadow: 0 10px 28px #1976d266; transform: translateY(-1px); }
.create-task-btn:active { transform: translateY(0); }
.create-task-btn .btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.18);
}
@media (max-width: 900px) {
  .tm-cards { grid-template-columns: repeat(2, 1fr); }
  .tm-search { flex: 1; min-width: 0; }
}
@media (max-width: 600px) {
  .tm-actions { justify-content: stretch; }
  .create-task-btn { width: 100%; justify-content: center; }
}
@media (max-width: 560px) {
  .tm-cards { grid-template-columns: 1fr; }
}
</style>