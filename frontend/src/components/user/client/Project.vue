<template>
  <div class="projects-wrap">
    <header class="projects-header">
      <div>
        <p class="eyebrow">Client Projects</p>
        <h1>Active Engagements</h1>
        <p class="subtitle">
          Track timelines, deliverables, and updates for each architectural commission.
        </p>
      </div>
      <button class="refresh-btn" @click="fetchProjects" :disabled="loading">
        <span v-if="loading" class="spinner"></span>
        <span v-else>Refresh</span>
      </button>
    </header>

    <section v-if="loading" class="loading-state">
      <div class="pulse"></div>
      <p>Fetching current projects…</p>
    </section>

    <section v-else-if="!projects.length" class="empty-state">
      <p>No projects found.</p>
      <button class="refresh-btn" @click="fetchProjects">Try again</button>
    </section>

    <section v-else class="projects-list">
      <article
        v-for="project in projects"
        :key="project.id"
        class="project-row"
        @click="openPanel(project)"
      >
        <div class="project-main">
          <div
            class="project-badge"
            :style="{ background: project.theme?.chip || '#1a237e' }"
          >
            {{ project.code || '—' }}
          </div>
          <div>
            <h2 class="project-title">{{ project.name }}</h2>
            <p class="project-description">{{ project.description || 'No description available.' }}</p>
            <ul v-if="project.tags?.length" class="project-tags">
              <li v-for="tag in project.tags" :key="tag">{{ tag }}</li>
            </ul>
          </div>
        </div>

        <div class="project-meta">
          <div>
            <span class="meta-label">Phase</span>
            <span class="meta-value">
              <span :class="statusClass(project.status)">
                {{ prettyStatus(project.status) }}
              </span>
            </span>
          </div>
          <div>
            <span class="meta-label">Schedule</span>
            <span class="meta-value">
              {{ formatDate(project.startDate) }} → {{ formatDate(project.dueDate) }}
            </span>
          </div>
          <div>
            <span class="meta-label">Client</span>
            <span class="meta-value">{{ project.client || '—' }}</span>
          </div>
        </div>

        <div class="project-progress">
          <div class="progress-label">Progress</div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: (project.progress ?? 0) + '%' }"></div>
          </div>
          <div class="progress-value">{{ project.progress ?? 0 }}%</div>
        </div>
      </article>
    </section>

    <transition name="slide-in">
      <aside
        v-if="showPanel && selectedProject"
        class="project-panel"
        :class="{ mobile: isMobile }"
      >
        <header class="panel-head">
          <div>
            <p class="panel-eyebrow">{{ selectedProject.code || 'PROJECT' }}</p>
            <h2>{{ selectedProject.name }}</h2>
            <p>{{ selectedProject.location || 'Location TBD' }}</p>
          </div>
          <button class="close-btn" @click="closePanel">✕</button>
        </header>

        <section class="panel-progress">
          <div class="panel-progress-circle">
            <svg viewBox="0 0 120 120">
              <circle class="trail" cx="60" cy="60" r="54" />
              <circle
                class="stroke"
                cx="60"
                cy="60"
                r="54"
                :style="{ strokeDashoffset: progressOffset }"
              />
            </svg>
            <div class="panel-progress-value">
              <span>{{ selectedProject.progress ?? 0 }}%</span>
              <small>{{ prettyStatus(selectedProject.status) }}</small>
            </div>
          </div>
          <ul class="panel-stats">
            <li>
              <span class="label">Start</span>
              <span class="value">{{ formatDate(selectedProject.startDate) }}</span>
            </li>
            <li>
              <span class="label">Turnover</span>
              <span class="value">{{ formatDate(selectedProject.dueDate) }}</span>
            </li>
            <li>
              <span class="label">Budget</span>
              <span class="value">{{ selectedProject.budget || '—' }}</span>
            </li>
            <li>
              <span class="label">Floor Area</span>
              <span class="value">{{ selectedProject.area || '—' }}</span>
            </li>
          </ul>
        </section>

        <section class="panel-section">
          <h3>Key Team</h3>
          <ul class="panel-team">
            <li v-if="selectedProject.architect">
              <span class="label">Lead Architect</span>
              <span class="value">{{ selectedProject.architect }}</span>
            </li>
            <li v-if="selectedProject.manager">
              <span class="label">Project Manager</span>
              <span class="value">{{ selectedProject.manager }}</span>
            </li>
            <li v-if="selectedProject.client">
              <span class="label">Client</span>
              <span class="value">
                {{ selectedProject.client }}
                <template v-if="selectedProject.clientContact">
                  · {{ selectedProject.clientContact }}
                </template>
              </span>
            </li>
          </ul>
        </section>

        <section v-if="panelFiles.length" class="panel-section">
          <h3>Latest Files</h3>
          <ul class="panel-list">
            <li v-for="file in panelFiles" :key="file.name + file.uploadedAt">
              <div>
                <p class="item-title">{{ file.name }}</p>
                <p class="item-meta">
                  Uploaded by {{ file.uploadedBy || 'Unknown' }}
                  <template v-if="file.role">
                    ({{ file.role }})
                  </template>
                  · {{ formatDate(file.uploadedAt) }}
                  <template v-if="file.size">
                    · {{ formatSize(file.size) }}
                  </template>
                </p>
              </div>
            </li>
          </ul>
        </section>

        <section v-if="panelTasks.length" class="panel-section">
          <h3>Open Tasks</h3>
          <ul class="panel-list">
            <li v-for="task in panelTasks" :key="task.title + task.due">
              <div>
                <p class="item-title">{{ task.title }}</p>
                <p class="item-meta">
                  Assigned to {{ task.assignedTo || 'Unassigned' }}
                  · Due {{ formatDate(task.due) }}
                  · {{ taskStatusLabel(task.status) }}
                </p>
              </div>
            </li>
          </ul>
        </section>

        <button class="open-project-btn" @click="openProject(selectedProject)">
          Open in Project Workspace
        </button>
      </aside>
    </transition>

    <div v-if="showPanel && isMobile" class="panel-backdrop" @click="closePanel"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../../../config'


const router = useRouter()
const projects = ref([])
const loading = ref(false)
const showPanel = ref(false)
const selectedProject = ref(null)
const isClient = typeof window !== 'undefined'
const isMobile = ref(isClient ? window.innerWidth < 1024 : false)

const panelFiles = computed(() => (selectedProject.value?.files || []).slice(0, 4))
const panelTasks = computed(() => (selectedProject.value?.tasks || []).slice(0, 3))
const progressOffset = computed(() => {
  const progress = Math.min(Math.max(selectedProject.value?.progress ?? 0, 0), 100)
  const circumference = 2 * Math.PI * 54
  return circumference - (progress / 100) * circumference
})

function statusClass(status) {
  const map = {
    pending: 'status-pill pending',
    planning: 'status-pill planning',
    design: 'status-pill design',
    review: 'status-pill review',
    construction: 'status-pill construction',
    completed: 'status-pill completed'
  }
  return map[(status || '').toLowerCase()] || 'status-pill pending'
}

function prettyStatus(status) {
  return (status || 'pending').replace(/\b\w/g, c => c.toUpperCase())
}

function taskStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    review: 'In Review',
    completed: 'Completed'
  }
  return labels[(status || '').toLowerCase()] || 'Pending'
}

function formatDate(value) {
  if (!value) return 'TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBD'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatSize(bytes) {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** idx).toFixed(idx ? 1 : 0)} ${units[idx]}`
}

function openPanel(project) {
  selectedProject.value = project
  showPanel.value = true
  if (isClient) document.body.style.overflow = 'hidden'
}

function closePanel() {
  showPanel.value = false
  if (isClient) document.body.style.overflow = ''
}

function openProject(project) {
  if (!project) return
  router.push(`/projects/${encodeURIComponent(project.id || project.code || 'project')}`)
  closePanel()
}

function checkMobile() {
  if (!isClient) return
  isMobile.value = window.innerWidth < 1024
}

async function fetchProjects() {
  const userData = isClient ? localStorage.getItem('domus_user') : null
  if (!userData) {
    projects.value = []
    return
  }

  loading.value = true
  try {
    const user = JSON.parse(userData)
    const response = await fetch(
      `${API_BASE_URL}/api/admin/projects-for-client?email=${encodeURIComponent(user.email)}`,
      { credentials: 'include' }
    )
    const payload = await response.json().catch(() => ({}))
    if (response.ok && payload.success && Array.isArray(payload.projects)) {
      projects.value = payload.projects.map(normalizeProject)
    } else {
      projects.value = []
    }
  } catch (error) {
    console.error('Project fetch failed:', error)
    projects.value = []
  } finally {
    loading.value = false
  }
}

function normalizeProject(raw = {}) {
  const safeProgress = Number.isFinite(raw.progress) ? Math.round(raw.progress) : 0
  const files = Array.isArray(raw.files)
    ? raw.files.map(file => ({
        name: file.name || file.title || 'Untitled File',
        uploadedBy: file.uploadedBy || file.uploader || '',
        role: file.role || file.uploaderRole || '',
        uploadedAt: file.uploadedAt || file.createdAt || null,
        type: file.type || '',
        size: typeof file.size === 'number' ? file.size : null
      }))
    : []
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks.map(task => ({
        title: task.title || 'Untitled Task',
        createdBy: task.createdBy || '',
        assignedTo: task.assignedTo || '',
        status: task.status || 'pending',
        due: task.due || task.dueDate || null,
        priority: task.priority || ''
      }))
    : []

  return {
    id: raw.id || raw._id || `project-${Math.random().toString(36).slice(2)}`,
    code: raw.code || raw.projectCode || '',
    name: raw.name || raw.title || 'Untitled Project',
    status: raw.status || 'pending',
    phase: raw.phase || '',
    progress: Math.min(Math.max(safeProgress, 0), 100),
    startDate: raw.startDate || raw.projectStart || raw.createdAt || null,
    dueDate: raw.dueDate || raw.projectEnd || raw.updatedAt || null,
    client: raw.client?.name || raw.clientName || raw.client || '',
    clientContact: raw.client?.contact || raw.clientContact || '',
    location: raw.location || raw.site || '',
    description: raw.description || '',
    budget: raw.budget || '',
    area: raw.area || '',
    architect: raw.architect || raw.leadArchitect || '',
    manager: raw.manager || raw.projectManager || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    files,
    tasks,
    milestones: Array.isArray(raw.milestones) ? raw.milestones : [],
    theme: raw.theme || { chip: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 70%)' }
  }
}

onMounted(() => {
  checkMobile()
  fetchProjects()
  if (isClient) window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  if (isClient) window.removeEventListener('resize', checkMobile)
})
</script>

<style>
.projects-wrap {
  position: relative;
  padding: 32px 32px 48px;
  background: #f7f9fb;
  min-height: 100vh;
}
.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;
}
.eyebrow {
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
  margin: 0;
}
.projects-header h1 {
  font-size: 2.4rem;
  margin: 8px 0;
  color: #0f172a;
}
.subtitle {
  margin: 0;
  color: #475569;
}
.refresh-btn {
  align-self: flex-start;
  padding: 10px 18px;
  border-radius: 12px;
  border: none;
  background: #2563eb;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 26px rgba(37, 99, 235, 0.25);
}
.refresh-btn:disabled {
  background: #94a3b8;
  cursor: progress;
  box-shadow: none;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading-state,
.empty-state {
  background: white;
  border-radius: 24px;
  padding: 80px 24px;
  text-align: center;
  color: #475569;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}
.loading-state .pulse {
  width: 42px;
  height: 42px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #2563eb;
  animation: pulse 1.4s ease-in-out infinite;
}
.projects-list {
  display: grid;
  gap: 18px;
}
.project-row {
  background: white;
  border-radius: 28px;
  padding: 24px;
  display: grid;
  grid-template-columns: 1.2fr 1fr auto;
  gap: 24px;
  align-items: center;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border 0.25s ease;
}
.project-row:hover {
  transform: translateY(-4px);
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
  border-color: rgba(37, 99, 235, 0.18);
}
.project-main {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}
.project-badge {
  padding: 12px 16px;
  border-radius: 16px;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.project-title {
  margin: 0;
  font-size: 1.4rem;
  color: #0f172a;
}
.project-description {
  margin: 6px 0 10px;
  color: #475569;
}
.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.project-tags li {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
}
.project-meta {
  display: grid;
  gap: 12px;
}
.meta-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  display: block;
}
.meta-value {
  color: #1e293b;
  font-weight: 600;
  display: block;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.76rem;
  border: 1px solid transparent;
  text-transform: uppercase;
}
.status-pill.pending {
  background: #fff7e1;
  border-color: #ffd98f;
  color: #b36b00;
}
.status-pill.planning {
  background: #f7fee7;
  border-color: #d9f99d;
  color: #4d7c0f;
}
.status-pill.design {
  background: #e0f2fe;
  border-color: #93c5fd;
  color: #1d4ed8;
}
.status-pill.review {
  background: #fdf4ff;
  border-color: #f5d0fe;
  color: #86198f;
}
.status-pill.construction {
  background: #ecfdf5;
  border-color: #6ee7b7;
  color: #047857;
}
.status-pill.completed {
  background: #edf7ed;
  border-color: #c8e6c9;
  color: #1f7a1f;
}
.project-progress {
  text-align: right;
}
.progress-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #94a3b8;
  margin-bottom: 6px;
}
.progress-track {
  width: 160px;
  height: 10px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin-left: auto;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb 0%, #38bdf8 100%);
  border-radius: inherit;
  transition: width 0.4s ease;
}
.progress-value {
  margin-top: 6px;
  font-weight: 700;
  color: #0f172a;
}
.project-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  height: 100%;
  background: #0f172a;
  color: white;
  padding: 36px 32px;
  overflow-y: auto;
  box-shadow: -28px 0 60px rgba(15, 23, 42, 0.45);
  z-index: 30;
}
.project-panel.mobile {
  width: 100%;
}
.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 25;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 28px;
}
.panel-eyebrow {
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}
.panel-head h2 {
  margin: 6px 0 4px;
  font-size: 1.6rem;
}
.panel-head p {
  margin: 0;
  color: rgba(255, 255, 255, 0.75);
}
.close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  color: white;
  cursor: pointer;
}
.panel-progress {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  margin-bottom: 26px;
}
.panel-progress-circle {
  position: relative;
  width: 132px;
  height: 132px;
  margin: 0 auto 18px;
}
.panel-progress-circle svg {
  width: 132px;
  height: 132px;
  transform: rotate(-90deg);
}
.panel-progress-circle .trail {
  fill: none;
  stroke: rgba(255, 255, 255, 0.06);
  stroke-width: 12;
}
.panel-progress-circle .stroke {
  fill: none;
  stroke: #38bdf8;
  stroke-width: 12;
  stroke-linecap: round;
  stroke-dasharray: 339.292;
  transition: stroke-dashoffset 0.5s ease;
}
.panel-progress-value {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
}
.panel-progress-value span {
  font-size: 1.8rem;
  font-weight: 800;
}
.panel-progress-value small {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.7);
}
.panel-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 18px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.panel-stats .label {
  display: block;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}
.panel-stats .value {
  font-weight: 700;
}
.panel-section {
  margin-bottom: 26px;
}
.panel-section h3 {
  margin: 0 0 14px;
  font-size: 1rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.panel-team {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}
.panel-team .label {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.panel-team .value {
  font-weight: 600;
  color: white;
}
.panel-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 18px;
}
.panel-list .item-title {
  margin: 0;
  font-weight: 600;
}
.panel-list .item-meta {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.65);
}
.open-project-btn {
  width: 100%;
  padding: 14px 18px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(120deg, #2563eb 0%, #38bdf8 100%);
  font-weight: 700;
  color: white;
  cursor: pointer;
  margin-top: 6px;
  box-shadow: 0 14px 40px rgba(56, 189, 248, 0.35);
}
.slide-in-enter-active,
.slide-in-leave-active {
  transition: transform 0.3s ease;
}
.slide-in-enter-from,
.slide-in-leave-to {
  transform: translateX(100%);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  0%, 100% { transform: scale(0.85); opacity: 0.4; }
  50% { transform: scale(1); opacity: 1; }
}

@media (max-width: 1280px) {
  .project-row {
    grid-template-columns: 1fr;
  }
  .project-progress {
    text-align: left;
  }
  .progress-track {
    margin-left: 0;
  }
}
@media (max-width: 960px) {
  .projects-wrap {
    padding: 24px 18px 36px;
  }
  .projects-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .refresh-btn {
    width: 100%;
    justify-content: center;
  }
  .project-row {
    padding: 20px;
  }
}
</style>