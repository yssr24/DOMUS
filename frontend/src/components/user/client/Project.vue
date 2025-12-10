<template>
  <section class="projects-wrap">
    <div class="projects-header">
      <h1>Projects</h1>
      <span class="underline"></span>
    </div>

    <div class="projects-list">
      <article
        v-for="p in projects"
        :key="p.id"
        class="project-row"
      >
        <div class="file-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z" fill="#e6b23a22"/>
            <path d="M14 2v4a1 1 0 0 0 1 1h4" stroke="#e6b23a" stroke-width="1.5"/>
            <rect x="7.5" y="12" width="9" height="1.6" rx="0.8" fill="#21354733"/>
            <rect x="7.5" y="15" width="7" height="1.6" rx="0.8" fill="#21354722"/>
          </svg>
        </div>
        <div class="project-main">
          <h3 class="project-title">{{ p.title }}</h3>
          <div class="project-meta">
            <span class="status-pill" :class="statusClass(p.status)">{{ p.status }}</span>
            <span class="project-id" v-if="p.code">ID: {{ p.code }}</span>
          </div>
        </div>
        <div class="project-actions">
          <button class="view-btn" type="button" @click="openPanel(p)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="margin-right:8px">
              <path d="M12 5c-7 0-10 7-10 7s3 7 10 7s10-7 10-7s-3-7-10-7Zm0 11a4 4 0 1 1 0-8a4 4 0 0 1 0 8Z" fill="currentColor"/>
            </svg>
            View
          </button>
        </div>
      </article>
      <div v-if="!loading && projects.length === 0" style="text-align:center;color:#aaa;padding:32px 0;">
        No projects found.
      </div>
      <div v-if="loading" style="text-align:center;color:#e6b23a;padding:32px 0;">
        Loading projects...
      </div>
    </div>

    <!-- Side Panel (inside domus-main) -->
    <transition name="slide-panel">
      <div
        v-if="showPanel"
        class="side-panel-inside"
        :class="{ mobile: isMobile }"
        @click.self="closePanel"
      >
        <div class="panel-content">
          <div class="panel-header">
            <div class="panel-title-wrap">
              <span class="panel-title">{{ selectedProject.title }}</span>
              <span class="panel-code" v-if="selectedProject.code">({{ selectedProject.code }})</span>
            </div>
            <button class="close-btn" @click="closePanel" aria-label="Close">&times;</button>
          </div>
          <div class="panel-section">
            <label>Status/Phase:</label>
            <span class="status-pill" :class="statusClass(selectedProject.status)">{{ selectedProject.status }}</span>
          </div>
          <div class="panel-section">
            <label>Timeline:</label>
            <span>{{ formatDate(selectedProject.createdAt) }}</span>
          </div>
          <div class="panel-section" v-if="selectedProject.description">
            <label>Description:</label>
            <div class="panel-desc">{{ selectedProject.description }}</div>
          </div>
          <div class="panel-section location-section">
            <label>Location:</label>
            <div class="location-fields">
              <div>
                <span class="loc-label">Province:</span>
                <span class="loc-value">{{ selectedProject.location?.province || 'N/A' }}</span>
              </div>
              <div>
                <span class="loc-label">City:</span>
                <span class="loc-value">{{ selectedProject.location?.city || 'N/A' }}</span>
              </div>
              <div>
                <span class="loc-label">Barangay:</span>
                <span class="loc-value">{{ selectedProject.location?.barangay || 'N/A' }}</span>
              </div>
              <div>
                <span class="loc-label">Zip Code:</span>
                <span class="loc-value">{{ selectedProject.location?.zip || 'N/A' }}</span>
              </div>
            </div>
          </div>
          <div class="panel-section" v-if="selectedProject.staffId || selectedProject.leadArchitect">
            <label>Staff Assigned:</label>
            <div class="staff-list">
              <div v-if="selectedProject.leadArchitect">
                <span class="staff-label">Lead Architect:</span>
                <span class="staff-value">{{ selectedProject.leadArchitect }}</span>
              </div>
              <div v-if="selectedProject.staffId">
                <span class="staff-label">Staff ID:</span>
                <span class="staff-value">{{ selectedProject.staffId }}</span>
              </div>
            </div>
          </div>
          <div class="panel-actions-inline">
            <button class="open-btn" @click="openProject(selectedProject)">Open</button>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
    case 'construction': return 'construction'
    case 'completed': return 'completed'
    case 'archived': return 'archived'
    default: return ''
  }
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
  router.push(`/projects/${encodeURIComponent(p.id || p.code)}`)
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
onMounted(async () => {
  loading.value = true
  const userData = localStorage.getItem('domus_user')
  if (!userData) {
    projects.value = []
    loading.value = false
    return
  }
  const user = JSON.parse(userData)
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/projects-for-client?email=${encodeURIComponent(user.email)}`)
    const data = await res.json()
    if (data.success && Array.isArray(data.projects)) {
      projects.value = data.projects
    } else {
      projects.value = []
    }
  } catch (err) {
    projects.value = []
  }
  loading.value = false
  window.addEventListener('resize', checkMobile)
})
</script>

<style scoped>
.projects-wrap {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.projects-list {
  margin-top: 18px;
  width: 100%;
  max-width: 900px;
  box-sizing: border-box;
  padding-left: 16px;
  padding-right: 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.project-row {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 4px 18px rgba(0,0,0,.04);
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}
.project-row:hover {
  transform: translateY(-1px);
  border-color: #e6b23a55;
  box-shadow: 0 8px 28px rgba(0,0,0,.06);
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
  font-size: 1.06rem;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.project-meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #667085;
  font-size: .92rem;
}

.status-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: .2px;
  font-size: .78rem;
  text-transform: uppercase;
  border: 1px solid transparent;
}
.status-pill.pending      { color:#b36b00; background:#fff7e1; border-color:#ffe6a6; }
.status-pill.planning     { color:#8a6b00; background:#fff7e1; border-color:#ffe6a6; }
.status-pill.design       { color:#0b5da3; background:#e9f3ff; border-color:#cfe6ff; }
.status-pill.review       { color:#6a0596; background:#f6eaff; border-color:#ead6ff; }
.status-pill.construction { color:#0b7a3b; background:#e8ffee; border-color:#caf5d9; }
.status-pill.completed    { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }
.status-pill.archived     { color:#888; background:#f3f3f3; border-color:#ddd; }

.project-id {
  font-weight: 600;
  color: #8592a3;
  font-size: .82rem;
}

.project-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}
.view-btn {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid #e6b23a;
  color: #e6b23a;
  background: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, box-shadow .15s ease, transform .05s ease;
}
.view-btn:hover {
  background: #e6b23a;
  color: #fff;
  box-shadow: 0 6px 16px #e6b23a4d;
}
.view-btn:active { transform: translateY(1px); }

/* Responsive */
@media (max-width: 1100px) {
  .projects-header,
  .projects-list {
    max-width: 98vw;
  }
}
@media (max-width: 600px) {
  .projects-header,
  .projects-list {
    max-width: 100vw;
    padding-left: 8px;
    padding-right: 8px;
  }
  .project-row {
    padding: 10px 6px;
    gap: 10px;
    border-radius: 9px;
  }
  .file-icon {
    width: 40px; height: 40px; flex-basis: 40px;
  }
  .project-title { font-size: .98rem; }
  .project-meta { flex-wrap: wrap; gap: 6px; }
}
@media (max-width: 400px) {
  .projects-header,
  .projects-list {
    max-width: 380px;
    min-width: 0;
    padding-left: 2px;
    padding-right: 2px;
  }
  .project-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 2px;
  }
  .project-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
.slide-panel-enter-active, .slide-panel-leave-active {
  transition: right 0.3s cubic-bezier(.4,0,.2,1), width 0.3s cubic-bezier(.4,0,.2,1);
}
.slide-panel-enter-from, .slide-panel-leave-to {
  right: -100vw;
}
.slide-panel-enter-to, .slide-panel-leave-from {
  right: 0;
}

/* Side panel inside domus-main */
.side-panel-inside {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 420px;
  max-width: 100vw;
  background: #fff;
  box-shadow: -4px 0 32px #0002;
  z-index: 20;
  display: flex;
  flex-direction: column;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
  animation: slideIn .3s;
}
@keyframes slideIn {
  from { right: -100vw; }
  to { right: 0; }
}
.side-panel-inside.mobile {
  width: 100vw !important;
  max-width: 100vw !important;
  left: 0;
  right: 0;
  border-radius: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.panel-content {
  padding: 28px 24px 18px 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.panel-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.panel-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #213547;
  line-height: 1.2;
}
.panel-code {
  font-size: 1rem;
  color: #e6b23a;
  font-weight: 600;
  margin-top: 2px;
}
.close-btn {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 2rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  padding: 0 8px;
  transition: color .15s;
}
.close-btn:hover { color: #b71c1c; }
.panel-section {
  margin-bottom: 18px;
}
.panel-section label {
  display: block;
  font-size: .98rem;
  color: #888;
  margin-bottom: 2px;
  font-weight: 600;
}
.panel-desc {
  color: #213547;
  font-size: 1rem;
  background: #f7f7f7;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 2px;
}
.location-section .location-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 18px;
  margin-top: 4px;
}
.loc-label {
  color: #888;
  font-size: .95rem;
  font-weight: 600;
  margin-right: 4px;
}
.loc-value {
  color: #213547;
  font-size: .98rem;
  font-weight: 500;
}
.staff-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.staff-label {
  color: #888;
  font-size: .95rem;
  font-weight: 600;
  margin-right: 4px;
}
.staff-value {
  color: #213547;
  font-size: .98rem;
  font-weight: 500;
}
.panel-actions-vertical {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: stretch;
}
.panel-actions-inline {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 0;
  margin-bottom: 0;
  gap: 0;
}
.open-btn {
  background: #e6b23a;
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 10px 28px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background .15s;
  margin-top: 0;
  margin-bottom: 0;
  width: auto;
}
.open-btn:hover { background: #c4901a; }

@media (max-width: 900px) {
  .side-panel-inside {
    width: 340px;
  }
}
@media (max-width: 600px) {
  .side-panel-inside,
  .side-panel-inside.mobile {
    width: 100vw !important;
    max-width: 100vw !important;
    left: 0;
    right: 0;
    border-radius: 0;
  }
  .panel-content {
    padding: 18px 8px 12px 8px;
  }
  .panel-title { font-size: 1.1rem; }
  .location-section .location-fields {
    grid-template-columns: 1fr;
    gap: 6px 0;
  }
}
</style>