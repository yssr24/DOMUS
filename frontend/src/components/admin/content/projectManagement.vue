<template>
  <div class="project-management-dashboard">
    <div class="cards-container">
      <div class="stat-card card-project">
        <div class="card-icon project">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#1976d2"/>
            <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" fill="#fff"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-title">Total Projects</div>
          <div class="card-number">{{ totalProjects }}</div>
        </div>
      </div>
      <div class="stat-card card-pending">
        <div class="card-icon pending">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#fbc02d"/>
            <path d="M12 7v5l4 2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-title">Pending Projects</div>
          <div class="card-number">{{ pendingProjects }}</div>
        </div>
      </div>
      <div class="stat-card card-completed">
        <div class="card-icon completed">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#43a047"/>
            <path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-title">Projects Done</div>
          <div class="card-number">{{ completedProjects }}</div>
        </div>
      </div>
    </div>
    <div class="datatable-card">
      <div class="datatable-header">
        <h2>Projects</h2>
        <input
          v-model="search"
          type="search"
          placeholder="Search ..."
          class="datatable-search"
        />
      </div>

      <div class="table-wrap">
        <table class="projects-table">
          <thead>
            <tr>
              <th @click="toggleSort('code')" :class="sortClass('code')">Code</th>
              <th @click="toggleSort('title')" :class="sortClass('title')">Project Title</th>
              <th @click="toggleSort('ownerName')" :class="sortClass('ownerName')">Owner</th>
              <th @click="toggleSort('status')" :class="sortClass('status')">Status</th>
              <th @click="toggleSort('progress')" :class="sortClass('progress')">Progress</th>

            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="center muted">Loading...</td>
            </tr>
            <tr v-else-if="error">
              <td colspan="6" class="center error">{{ error }}</td>
            </tr>
            <tr v-else-if="!sortedRows.length">
              <td colspan="6" class="center muted">No projects found.</td>
            </tr>
            <tr v-for="p in sortedRows" :key="p.id">
              <td class="mono">{{ p.code }}</td>
              <td>{{ p.title }}</td>
              <td>{{ p.ownerName }}</td>
              <td>
                <span class="status-pill" :class="statusClass(p.status)">{{ prettyStatus(p.status) }}</span>
              </td>
              <td class="progress-cell">
                <div class="progress">
                  <div class="progress-track">
                    <div class="progress-fill" :style="{ width: (p.progress ?? 0) + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ (p.progress ?? 0) }}%</span>
                </div>
              </td>
              <td class="actions-col">
                <button class="icon-btn" title="Assign" @click="onAssign(p)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1976d2" aria-hidden="true">
                    <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.7-9.8 5v1.9h19.6v-1.9c0-3.3-6.5-5-9.8-5z"/>
                  </svg>
                </button>
              </td>
              <td class="actions-col">
                <button class="icon-btn" title="Settings" @click="onSettings(p)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#555" aria-hidden="true">
                    <path d="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.55 7.55 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 12.93 1h-3.86a.5.5 0 0 0-.49.41l-.36 2.54a7.55 7.55 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L.78 7.97a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94L.9 13.65a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.37 1.04.68 1.63.94l.36 2.54c.05.24.25.41.49.41h3.86c.24 0 .44-.17.49-.41l.36-2.54c.59-.26 1.13-.57 1.63-.94l2.39.96c.24.1.51.01.64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM11 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <button class="add-project-btn" @click="onAddProject">
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#1976d2"/>
        <path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Add Project</span>
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { API_BASE_URL } from '../../../config'


const router = useRouter()
const totalProjects = ref(24)
const pendingProjects = ref(7)
const completedProjects = ref(13)

const rows = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const sortKey = ref('code')
const sortDir = ref('asc')


function onAddProject() {
  router.push('/admin/project-management/add-project')
}

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}
function sortClass(key) {
  return {
    sortable: true,
    'sort-asc': sortKey.value === key && sortDir.value === 'asc',
    'sort-desc': sortKey.value === key && sortDir.value === 'desc'
  }
}

function prettyStatus(s) {
  return (s || 'pending').replace(/\b\w/g, c => c.toUpperCase())
}
function statusClass(s) {
  const v = (s || 'pending').toLowerCase()
  return {
    pending: v === 'pending' || v === 'planning',
    design: v === 'design',
    review: v === 'review',
    construction: v === 'construction',
    completed: v === 'completed',
    archived: v === 'archived',
  }
}

const searchedRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(p =>
    String(p.code || '').toLowerCase().includes(q) ||
    String(p.title || '').toLowerCase().includes(q) ||
    String(p.ownerName || '').toLowerCase().includes(q) ||
    String(p.status || '').toLowerCase().includes(q)
  )
})

const sortedRows = computed(() => {
  const arr = [...searchedRows.value]
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  arr.sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    // numeric sort when both are numbers (e.g., progress)
    if (typeof va === 'number' && typeof vb === 'number' && !Number.isNaN(va) && !Number.isNaN(vb)) {
      return (va - vb) * dir
    }
    const sa = (va ?? '').toString().toLowerCase()
    const sb = (vb ?? '').toString().toLowerCase()
    if (sa < sb) return -1 * dir
    if (sa > sb) return 1 * dir
    return 0
  })
  return arr
})

async function fetchProjects() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/projects`)
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load projects')
    rows.value = (json.data || []).map(p => ({
      id: p.id,
      code: p.code,
      title: p.title,
      ownerName: p.ownerName,
      status: p.status,
      ownerEmail: p.ownerEmail,
      ownerId: p.ownerId,
      // NEW: progress (fallback to 0 if API doesn’t provide it)
      progress: Number(p.progress ?? 0)
    }))
    // update quick stats
    totalProjects.value = rows.value.length
    pendingProjects.value = rows.value.filter(r => (r.status || '').toLowerCase() === 'pending').length
    completedProjects.value = rows.value.filter(r => (r.status || '').toLowerCase() === 'completed').length
  } catch (e) {
    error.value = e.message || 'Network error'
  } finally {
    loading.value = false
  }
}

function onAssign(p) {
  // TODO: open assign modal/sidebar
  alert(`Assign clicked for ${p.code}`)
}
function onSettings(p) {
  // TODO: open settings modal/sidebar
  alert(`Settings clicked for ${p.code}`)
}

onMounted(fetchProjects)
</script>

<style scoped>
.project-management-dashboard {
  width: 100%;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.cards-container {
  display: flex;
  flex-direction: row;
  gap: 24px;
  width: 100%;
  max-width: 900px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
.stat-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
  display: flex;
  align-items: center;
  padding: 24px 32px;
  min-width: 220px;
  max-width: 300px;
  margin: 8px 0;
  transition: box-shadow 0.2s, transform 0.2s;
  height: 110px;
  background: #fff;
  flex: 1 1 220px;
}
.stat-card:hover {
  box-shadow: 0 4px 24px #e6b23a44;
  transform: translateY(-4px) scale(1.03);
}
.card-icon {
  margin-right: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 56px;
  height: 56px;
}
.card-project .card-icon {
  background: #1976d2;
}
.card-pending .card-icon {
  background: #fbc02d;
}
.card-completed .card-icon {
  background: #43a047;
}
.card-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #213547;
  margin-bottom: 8px;
}
.card-number {
  font-size: 2rem;
  font-weight: 700;
  color: #213547;
}
.project-management-content {
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
  padding: 32px 24px;
  margin-top: 18px;
}
.project-management-content h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 12px;
}
.project-management-content p {
  font-size: 1.08rem;
  color: #213547;
  margin-bottom: 18px;
}

.add-project-btn {
  position: fixed;
  right: 38px;
  bottom: 38px;
  z-index: 2000;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 50px;
  box-shadow: 0 4px 24px #1976d244;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px 14px 18px;
  font-size: 1.08rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s, transform 0.18s;
}
.add-project-btn:hover {
  background: #1565c0;
  box-shadow: 0 8px 32px #1976d266;
  transform: scale(1.05);
}
.add-project-btn svg {
  display: block;
}
@media (max-width: 900px) {
  .cards-container {
    gap: 16px;
    max-width: 100%;
  }
  .stat-card {
    padding: 18px 16px;
    min-width: 160px;
    max-width: 100%;
    height: 110px;
    flex: 1 1 160px;
  }
  .project-management-content {
    padding: 18px 8px;
  }
    .add-project-btn {
    right: 18px;
    bottom: 18px;
    padding: 12px 18px 12px 14px;
    font-size: 1rem;
  }
    .datatable-search { flex: 1; }

}
@media (max-width: 600px) {
  .cards-container {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  .stat-card {
    width: 90vw;
    min-width: 0;
    padding: 14px 10px;
    margin: 0;
    height: 110px;
    flex: 1 1 100%;
  }
  .project-management-content {
    width: 95vw;
    min-width: 0;
    padding: 10px 4px;
    margin: 0;
  }
  .project-management-content h2 {
    font-size: 1.08rem;
  }
  .project-management-content p {
    font-size: 1rem;
  }
    .add-project-btn {
    right: 8px;
    bottom: 8px;
    padding: 10px 14px 10px 10px;
    font-size: 0.95rem;
  }
    .datatable-card { padding: 10px; border-radius: 12px; }
  .projects-table thead th, .projects-table tbody td { padding: 10px 8px; }
}

/* Datatable */
.datatable-card {
  width: 100%;
  max-width: 1100px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
  padding: 16px;
}
.datatable-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.datatable-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #1976d2;
}
.datatable-search {
  flex: 0 0 280px;
  max-width: 50vw;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  font-size: 0.98rem;
}
.datatable-search:focus { border-color: #e6b23a; }

.table-wrap { width: 100%; overflow-x: auto; }
.projects-table {
  width: 100%;
  border-collapse: collapse;
}
.projects-table thead th {
  text-align: left;
  padding: 12px 10px;
  font-weight: 700;
  color: #213547;
  border-bottom: 2px solid #f0f0f0;
  cursor: pointer;
  user-select: none;
  position: relative;
  white-space: nowrap;
}
.projects-table thead th.actions-col { cursor: default; }
.projects-table tbody td {
  padding: 12px 10px;
  border-bottom: 1px solid #f5f5f5;
  color: #213547;
  vertical-align: middle;
}
.projects-table tbody tr:hover { background: #fafafa; }

.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
}
.icon-btn:hover { background: rgba(0,0,0,.06); }

.actions-col { text-align: center; width: 60px; }

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

/* Status pills */
.status-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: .2px;
  font-size: .78rem;
  text-transform: uppercase;
  border: 1px solid transparent;
  white-space: nowrap;
}
.status-pill.pending      { color:#b36b00; background:#fff7e1; border-color:#ffe6a6; }
.status-pill.design       { color:#0b5da3; background:#e9f3ff; border-color:#cfe6ff; }
.status-pill.review       { color:#6a0596; background:#f6eaff; border-color:#ead6ff; }
.status-pill.construction { color:#0b7a3b; background:#e8ffee; border-color:#caf5d9; }
.status-pill.completed    { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }
.status-pill.archived     { color:#888; background:#f3f3f3; border-color:#ddd; }

.center { text-align: center; }
.muted { color: #777; }
.error { color: #c62828; }
.projects-table thead th:nth-child(5) {
  min-width: 140px;
}

.progress-cell {
  min-width: 160px;
}

.progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-track {
  position: relative;
  flex: 1 1 auto;
  height: 10px;
  background: #eef2f7;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.06);
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #1976d2, #1565c0);
  border-radius: 999px;
  transition: width .25s ease;
}

.progress-text {
  font-weight: 700;
  font-size: .86rem;
  color: #213547;
  min-width: 36px;
  text-align: right;
}
</style>