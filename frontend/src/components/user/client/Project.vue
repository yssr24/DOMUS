<template>
  <section class="projects-wrap">
    <div class="projects-header">
      <h1>My Projects</h1>
      <span class="underline"></span>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading projects...</p>
    </div>

    <div v-else-if="projects.length === 0" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <p>No projects found</p>
    </div>

    <div v-else class="projects-list">
      <div 
        v-for="p in projects" 
        :key="p.id" 
        class="project-row"
        @click="openPanel(p)"
      >
        <div class="file-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e6b23a" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>

        <div class="project-main">
          <h3 class="project-title">{{ p.title || p.name }}</h3>
          <div class="project-meta">
            <span :class="['status-pill', statusClass(p.status)]">{{ p.status || 'pending' }}</span>
            <span class="project-id">{{ p.code }}</span>
          </div>
          
          <!-- Progress Bar -->
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Progress</span>
              <span class="progress-value">{{ p.progress || 0 }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: (p.progress || 0) + '%' }"
                :class="progressClass(p.progress)"
              ></div>
            </div>
          </div>

          <!-- Due Date -->
          <div class="due-section" v-if="p.dueDate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span :class="{ overdue: isOverdue(p.dueDate) }">
              Due: {{ formatDate(p.dueDate) }}
              <span v-if="isOverdue(p.dueDate)" class="overdue-badge">Overdue</span>
              <span v-else-if="isDueSoon(p.dueDate)" class="due-soon-badge">Due Soon</span>
            </span>
          </div>
        </div>

        <div class="project-actions">
          <button class="view-btn" @click.stop="openPanel(p)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View
          </button>
        </div>
      </div>
    </div>

    <!-- Side Panel -->
    <transition name="slide-panel">
      <div v-if="showPanel" class="panel-overlay" @click.self="closePanel">
        <div :class="['side-panel-inside', { mobile: isMobile }]">
          <div class="panel-content">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <h2 class="panel-title">{{ selectedProject.title || selectedProject.name }}</h2>
                <span class="panel-code">{{ selectedProject.code }}</span>
              </div>
              <button class="close-btn" @click="closePanel">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="panel-body">
              <!-- Status & Progress -->
              <div class="panel-section">
                <label>Status</label>
                <span :class="['status-pill large', statusClass(selectedProject.status)]">
                  {{ selectedProject.status || 'pending' }}
                </span>
              </div>

              <div class="panel-section">
                <label>Progress</label>
                <div class="panel-progress">
                  <div class="progress-bar large">
                    <div 
                      class="progress-fill" 
                      :style="{ width: (selectedProject.progress || 0) + '%' }"
                      :class="progressClass(selectedProject.progress)"
                    ></div>
                  </div>
                  <span class="progress-text">{{ selectedProject.progress || 0 }}%</span>
                </div>
              </div>

              <!-- Due Date -->
              <div class="panel-section" v-if="selectedProject.dueDate">
                <label>Due Date</label>
                <p :class="{ overdue: isOverdue(selectedProject.dueDate) }">
                  {{ formatDate(selectedProject.dueDate) }}
                  <span v-if="isOverdue(selectedProject.dueDate)" class="overdue-badge">Overdue</span>
                </p>
              </div>

              <!-- Description -->
              <div class="panel-section" v-if="selectedProject.description">
                <label>Description</label>
                <p class="panel-desc">{{ selectedProject.description }}</p>
              </div>

              <!-- Location -->
              <div class="panel-section location-section" v-if="selectedProject.location">
                <label>Location</label>
                <div class="location-fields">
                  <div v-if="selectedProject.location.province">
                    <span class="loc-label">Province:</span>
                    <span class="loc-value">{{ selectedProject.location.province }}</span>
                  </div>
                  <div v-if="selectedProject.location.city">
                    <span class="loc-label">City:</span>
                    <span class="loc-value">{{ selectedProject.location.city }}</span>
                  </div>
                  <div v-if="selectedProject.location.barangay">
                    <span class="loc-label">Barangay:</span>
                    <span class="loc-value">{{ selectedProject.location.barangay }}</span>
                  </div>
                </div>
              </div>

              <!-- Lead Architect -->
              <div class="panel-section" v-if="selectedProject.leadArchitect">
                <label>Lead Architect</label>
                <p>{{ selectedProject.leadArchitect }}</p>
              </div>

              <!-- Dates -->
              <div class="panel-section dates-grid">
                <div>
                  <label>Created</label>
                  <p>{{ formatDate(selectedProject.createdAt) }}</p>
                </div>
                <div>
                  <label>Updated</label>
                  <p>{{ formatDate(selectedProject.updatedAt) }}</p>
                </div>
              </div>
            </div>

            <div class="panel-actions">
              <button class="open-btn" @click="openProject(selectedProject)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Open Project Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../../../config'

const router = useRouter()
const projects = ref([])
const loading = ref(true)
const showPanel = ref(false)
const selectedProject = ref({})
const isMobile = ref(false)

function statusClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'pending': return 'pending'
    case 'planning': return 'planning'
    case 'design': return 'design'
    case 'review': return 'review'
    case 'in-progress': return 'inprogress'
    case 'construction': return 'construction'
    case 'completed': return 'completed'
    case 'on-hold': return 'onhold'
    case 'archived': return 'archived'
    default: return 'pending'
  }
}

function progressClass(progress) {
  if (progress >= 100) return 'complete'
  if (progress >= 75) return 'high'
  if (progress >= 50) return 'medium'
  if (progress >= 25) return 'low'
  return 'start'
}

function isOverdue(date) {
  if (!date) return false
  const d = new Date(date)
  return d < new Date() && d.toDateString() !== new Date().toDateString()
}

function isDueSoon(date) {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 7
}

function openPanel(p) {
  selectedProject.value = p
  showPanel.value = true
  checkMobile()
  document.body.style.overflow = 'hidden'
}

function closePanel() {
  showPanel.value = false
  document.body.style.overflow = ''
}

function openProject(p) {
  router.push(`/project/${encodeURIComponent(p.id)}`)
  closePanel()
}

function formatDate(date) {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function checkMobile() {
  isMobile.value = window.innerWidth <= 600
}

async function fetchProjects() {
  loading.value = true
  const userData = localStorage.getItem('domus_user')
  if (!userData) {
    loading.value = false
    return
  }
  
  const user = JSON.parse(userData)
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/projects-for-client?clientId=${user.id}`)
    const result = await res.json()
    if (result.success) {
      projects.value = result.data || []
    }
  } catch (err) {
    console.error('Failed to fetch projects:', err)
  }
  loading.value = false
}

onMounted(() => {
  fetchProjects()
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.projects-wrap {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 60vh;
}

.projects-header {
  width: 100%;
  max-width: 900px;
  box-sizing: border-box;
  padding-left: 16px;
  padding-right: 16px;
}

.projects-header h1 {
  margin: 0;
  color: #213547;
  font-size: 1.8rem;
  letter-spacing: .5px;
}

.projects-header .underline {
  display: block;
  width: 120px;
  height: 3px;
  background: linear-gradient(90deg, #e6b23a, #f1cf6a);
  border-radius: 4px;
  margin-top: 8px;
  box-shadow: 0 2px 8px #e6b23a55;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #e6b23a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state svg {
  margin-bottom: 16px;
}

.projects-list {
  margin-top: 18px;
  width: 100%;
  max-width: 900px;
  box-sizing: border-box;
  padding-left: 16px;
  padding-right: 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.project-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 4px 18px rgba(0,0,0,.04);
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
  cursor: pointer;
}

.project-row:hover {
  transform: translateY(-2px);
  border-color: #e6b23a55;
  box-shadow: 0 8px 28px rgba(0,0,0,.08);
}

.file-icon {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  background: #fff7e1;
  border: 1px solid #ffe6a6;
  border-radius: 12px;
}

.project-main {
  min-width: 0;
  flex: 1 1 auto;
}

.project-title {
  margin: 0;
  color: #213547;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.25;
}

.project-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-pill {
  padding: 5px 10px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: .2px;
  font-size: .75rem;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.status-pill.large {
  padding: 8px 16px;
  font-size: .85rem;
}

.status-pill.pending { color:#b36b00; background:#fff7e1; border-color:#ffe6a6; }
.status-pill.planning { color:#8a6b00; background:#fff7e1; border-color:#ffe6a6; }
.status-pill.design { color:#0b5da3; background:#e9f3ff; border-color:#cfe6ff; }
.status-pill.review { color:#6a0596; background:#f6eaff; border-color:#ead6ff; }
.status-pill.inprogress { color:#0d47a1; background:#bbdefb; border-color:#90caf9; }
.status-pill.construction { color:#0b7a3b; background:#e8ffee; border-color:#caf5d9; }
.status-pill.completed { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }
.status-pill.onhold { color:#9a4b00; background:#fff4e5; border-color:#ffe0b2; }
.status-pill.archived { color:#888; background:#f3f3f3; border-color:#ddd; }

.project-id {
  font-weight: 600;
  color: #8592a3;
  font-size: .82rem;
  font-family: ui-monospace, monospace;
}

/* Progress Section */
.progress-section {
  margin-top: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-label {
  font-size: .8rem;
  color: #666;
  font-weight: 600;
}

.progress-value {
  font-size: .85rem;
  color: #213547;
  font-weight: 700;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar.large {
  height: 10px;
  flex: 1;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.start { background: #e0e0e0; }
.progress-fill.low { background: #ffc107; }
.progress-fill.medium { background: #ff9800; }
.progress-fill.high { background: #4caf50; }
.progress-fill.complete { background: #2e7d32; }

/* Due Section */
.due-section {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .85rem;
  color: #666;
}

.due-section.overdue {
  color: #c62828;
}

.overdue-badge, .due-soon-badge {
  font-size: .7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  margin-left: 6px;
}

.overdue-badge {
  background: #ffebee;
  color: #c62828;
}

.due-soon-badge {
  background: #fff3e0;
  color: #e65100;
}

.project-actions {
  flex: 0 0 auto;
  display: flex;
  align-self: center;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8f9fa;
  color: #213547;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background: #e6b23a;
  color: #fff;
  border-color: #e6b23a;
}

/* Panel Overlay */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  backdrop-filter: blur(2px);
}

.side-panel-inside {
  width: 420px;
  max-width: 100%;
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.side-panel-inside.mobile {
  width: 100%;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.panel-title-wrap {
  flex: 1;
  min-width: 0;
}

.panel-title {
  margin: 0;
  font-size: 1.2rem;
  color: #213547;
  font-weight: 700;
}

.panel-code {
  display: inline-block;
  margin-top: 4px;
  font-size: .85rem;
  color: #666;
  font-family: ui-monospace, monospace;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #c62828;
  background: #ffebee;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.panel-section {
  margin-bottom: 20px;
}

.panel-section label {
  display: block;
  font-size: .8rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.panel-section p {
  margin: 0;
  color: #213547;
}

.panel-desc {
  color: #555;
  line-height: 1.6;
}

.panel-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  font-weight: 700;
  color: #213547;
  min-width: 45px;
}

.location-section .location-fields {
  display: grid;
  gap: 8px;
}

.loc-label {
  color: #888;
  font-size: .85rem;
}

.loc-value {
  color: #213547;
  font-weight: 500;
  margin-left: 6px;
}

.dates-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel-actions {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.open-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: #e6b23a;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 14px 20px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(230, 178, 58, 0.3);
}

.open-btn:hover {
  background: #d4a02c;
  transform: translateY(-1px);
}

/* Transitions */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.3s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 600px) {
  .project-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .file-icon {
    align-self: flex-start;
  }
  
  .project-actions {
    margin-top: 12px;
    align-self: stretch;
  }
  
  .view-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>