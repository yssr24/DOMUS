<template>
  <div class="project-details-page">
    <!-- Back Button -->
    <button class="back-btn" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to Projects
    </button>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading project details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c62828" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{{ error }}</p>
      <button @click="fetchProjectDetails" class="retry-btn">Try Again</button>
    </div>

    <!-- Project Content -->
    <div v-else class="project-content">
      <!-- Header Section -->
      <header class="project-header">
        <div class="header-main">
          <div class="header-info">
            <span class="project-code">{{ project.code }}</span>
            <h1 class="project-title">{{ project.title || project.name }}</h1>
            <p class="project-desc" v-if="project.description">{{ project.description }}</p>
          </div>
          <div class="header-status">
            <span :class="['status-badge', statusClass(project.status)]">
              {{ project.status || 'pending' }}
            </span>
          </div>
        </div>

        <!-- Progress Card -->
        <div class="progress-card">
          <div class="progress-info">
            <div class="progress-circle">
              <svg viewBox="0 0 36 36">
                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                <path class="circle-fill" :stroke-dasharray="`${project.progress || 0}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              </svg>
              <span class="progress-percent">{{ project.progress || 0 }}%</span>
            </div>
            <div class="progress-details">
              <h3>Project Progress</h3>
              <p>{{ getProgressMessage(project.progress) }}</p>
            </div>
          </div>
          <div class="progress-dates">
            <div class="date-item">
              <span class="date-label">Start Date</span>
              <span class="date-value">{{ formatDate(project.createdAt) }}</span>
            </div>
            <div class="date-item" :class="{ overdue: isOverdue(project.dueDate) }">
              <span class="date-label">Due Date</span>
              <span class="date-value">
                {{ formatDate(project.dueDate) }}
                <span v-if="isOverdue(project.dueDate)" class="overdue-tag">Overdue</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- Tab Navigation -->
      <nav class="tabs-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" />
          {{ tab.label }}
          <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
        </button>
      </nav>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Overview Tab -->
        <section v-if="activeTab === 'overview'" class="tab-panel">
          <div class="overview-grid">
            <!-- Project Info Card -->
            <div class="info-card">
              <h3>Project Information</h3>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Project Code</span>
                  <span class="info-value">{{ project.code }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <span :class="['status-pill', statusClass(project.status)]">{{ project.status }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Lead Architect</span>
                  <span class="info-value">{{ project.leadArchitect || 'Not assigned' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Created</span>
                  <span class="info-value">{{ formatDate(project.createdAt) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Last Updated</span>
                  <span class="info-value">{{ formatDate(project.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Location Card -->
            <div class="info-card" v-if="project.location">
              <h3>Location</h3>
              <div class="info-list">
                <div class="info-item" v-if="project.location.province">
                  <span class="info-label">Province</span>
                  <span class="info-value">{{ project.location.province }}</span>
                </div>
                <div class="info-item" v-if="project.location.city">
                  <span class="info-label">City/Municipality</span>
                  <span class="info-value">{{ project.location.city }}</span>
                </div>
                <div class="info-item" v-if="project.location.barangay">
                  <span class="info-label">Barangay</span>
                  <span class="info-value">{{ project.location.barangay }}</span>
                </div>
                <div class="info-item" v-if="project.location.street">
                  <span class="info-label">Street Address</span>
                  <span class="info-value">{{ project.location.street }}</span>
                </div>
              </div>
            </div>

            <!-- Team Card -->
            <div class="info-card team-card">
              <h3>Assigned Team</h3>
              <div v-if="staffMembers.length > 0" class="team-list">
                <div v-for="member in staffMembers" :key="member.id" class="team-member">
                  <div class="member-avatar">
                    <img v-if="member.profilePic" :src="member.profilePic" :alt="member.name" />
                    <span v-else>{{ getInitials(member.name || member.email) }}</span>
                  </div>
                  <div class="member-info">
                    <span class="member-name">{{ member.name || member.email }}</span>
                    <span class="member-role">{{ member.role || 'Staff' }}</span>
                  </div>
                </div>
              </div>
              <p v-else class="no-data">No team members assigned yet.</p>
            </div>

            <!-- Tasks Summary -->
            <div class="info-card tasks-summary">
              <h3>Tasks Overview</h3>
              <div class="tasks-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ taskStats.total }}</span>
                  <span class="stat-label">Total</span>
                </div>
                <div class="stat-item todo">
                  <span class="stat-value">{{ taskStats.todo }}</span>
                  <span class="stat-label">To Do</span>
                </div>
                <div class="stat-item progress">
                  <span class="stat-value">{{ taskStats.inProgress }}</span>
                  <span class="stat-label">In Progress</span>
                </div>
                <div class="stat-item done">
                  <span class="stat-value">{{ taskStats.done }}</span>
                  <span class="stat-label">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Files Tab -->
        <section v-if="activeTab === 'files'" class="tab-panel">
          <div class="section-header">
            <h3>Project Files</h3>
            <span class="file-count">{{ files.length }} file(s)</span>
          </div>

          <div v-if="filesLoading" class="loading-inline">
            <div class="spinner small"></div>
            <span>Loading files...</span>
          </div>

          <div v-else-if="files.length === 0" class="empty-section">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No files uploaded yet</p>
          </div>

          <div v-else class="files-grid">
            <div v-for="file in files" :key="file.id" class="file-card">
              <div :class="['file-icon', fileIconClass(file.type)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="file-info">
                <span class="file-name" :title="file.fileName">{{ file.fileName }}</span>
                <div class="file-meta">
                  <span :class="['file-type', file.type]">{{ file.type?.toUpperCase() }}</span>
                  <span class="file-size">{{ formatSize(file.size) }}</span>
                </div>
                <span class="file-date">{{ formatDate(file.createdAt) }}</span>
              </div>
              <div class="file-actions">
                <button class="icon-btn" @click="viewFile(file)" title="View">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button class="icon-btn" @click="downloadFile(file)" title="Download">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Submissions Tab -->
        <section v-if="activeTab === 'submissions'" class="tab-panel">
          <div class="section-header">
            <h3>My Submissions</h3>
            <button class="add-btn" @click="openSubmissionModal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Submission
            </button>
          </div>

          <div v-if="submissionsLoading" class="loading-inline">
            <div class="spinner small"></div>
            <span>Loading submissions...</span>
          </div>

          <div v-else-if="submissions.length === 0" class="empty-section">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>No submissions yet</p>
            <button class="primary-btn" @click="openSubmissionModal">Create your first submission</button>
          </div>

          <div v-else class="submissions-list">
            <div v-for="sub in submissions" :key="sub.id" class="submission-card">
              <div class="submission-header">
                <span class="submission-date">{{ formatDateTime(sub.createdAt) }}</span>
              </div>
              <p class="submission-message">{{ sub.message }}</p>
              <div v-if="sub.files && sub.files.length > 0" class="submission-files">
                <span class="files-label">Attached Files:</span>
                <div class="attached-files">
                  <a 
                    v-for="(file, idx) in sub.files" 
                    :key="idx" 
                    :href="file.url || file" 
                    target="_blank"
                    class="attached-file"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    {{ file.name || `File ${idx + 1}` }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Activity Tab -->
        <section v-if="activeTab === 'activity'" class="tab-panel">
          <div class="section-header">
            <h3>Activity Log</h3>
          </div>

          <div v-if="activityLoading" class="loading-inline">
            <div class="spinner small"></div>
            <span>Loading activity...</span>
          </div>

          <div v-else-if="activities.length === 0" class="empty-section">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <p>No activity recorded yet</p>
          </div>

          <div v-else class="activity-timeline">
            <div v-for="activity in activities" :key="activity.id" class="activity-item">
              <div :class="['activity-icon', activity.type]">
                <svg v-if="activity.type === 'file_upload'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <svg v-else-if="activity.type === 'status_change'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20V10"/>
                  <path d="M18 20V4"/>
                  <path d="M6 20v-4"/>
                </svg>
                <svg v-else-if="activity.type === 'submission'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <svg v-else-if="activity.type === 'comment'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="activity-content">
                <p class="activity-message">{{ activity.message }}</p>
                <span class="activity-time">{{ formatDateTime(activity.createdAt) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Submission Modal -->
    <div v-if="showSubmissionModal" class="modal-overlay" @click.self="closeSubmissionModal">
      <div class="submission-modal">
        <div class="modal-header">
          <h3>New Submission</h3>
          <button class="close-btn" @click="closeSubmissionModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="submitSubmission" class="submission-form">
          <div class="form-group">
            <label for="message">Message <span class="required">*</span></label>
            <textarea
              id="message"
              v-model="submissionForm.message"
              rows="4"
              placeholder="Describe your submission or any updates..."
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Attach Files (Optional)</label>
            <div 
              class="dropzone"
              :class="{ 'drag-over': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.dwg"
                @change="handleFileSelect"
                hidden
              />
              <div v-if="submissionForm.files.length === 0" class="dropzone-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p><strong>Click to upload</strong> or drag and drop</p>
                <span class="file-types">PDF, JPG, PNG, DOC, XLS, DWG</span>
              </div>
              <div v-else class="selected-files">
                <div v-for="(file, idx) in submissionForm.files" :key="idx" class="selected-file">
                  <span class="file-name">{{ file.name }}</span>
                  <button type="button" class="remove-file" @click.stop="removeFile(idx)">×</button>
                </div>
                <button type="button" class="add-more" @click.stop="triggerFileInput">+ Add more</button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeSubmissionModal">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              <span v-if="submitting" class="spinner small"></span>
              <span v-else>Submit</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Alert -->
    <div v-if="alertMsg" :class="['alert', alertType]">{{ alertMsg }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '../../../config'

const route = useRoute()
const router = useRouter()

// State
const loading = ref(true)
const error = ref('')
const project = ref({})
const files = ref([])
const submissions = ref([])
const activities = ref([])
const staffMembers = ref([])

const filesLoading = ref(false)
const submissionsLoading = ref(false)
const activityLoading = ref(false)

const activeTab = ref('overview')
const showSubmissionModal = ref(false)
const submitting = ref(false)
const isDragging = ref(false)
const fileInput = ref(null)

const alertMsg = ref('')
const alertType = ref('success')

const submissionForm = ref({
  message: '',
  files: []
})

// Tab icons as render functions
const OverviewIcon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('rect', { x: 3, y: 3, width: 7, height: 7 }),
  h('rect', { x: 14, y: 3, width: 7, height: 7 }),
  h('rect', { x: 14, y: 14, width: 7, height: 7 }),
  h('rect', { x: 3, y: 14, width: 7, height: 7 })
])

const FilesIcon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
  h('polyline', { points: '14 2 14 8 20 8' })
])

const SubmissionsIcon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
  h('polyline', { points: '17 8 12 3 7 8' }),
  h('line', { x1: 12, y1: 3, x2: 12, y2: 15 })
])

const ActivityIcon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' })
])

// Tabs configuration
const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0 },
  { id: 'files', label: 'Files', icon: FilesIcon, count: files.value.length },
  { id: 'submissions', label: 'Submissions', icon: SubmissionsIcon, count: submissions.value.length },
  { id: 'activity', label: 'Activity', icon: ActivityIcon, count: activities.value.length }
])

// Task stats
const taskStats = computed(() => {
  const tasks = project.value.tasks || []
  return {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length
  }
})

// Functions
function showAlert(msg, type = 'success') {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 4000)
}

function goBack() {
  router.push('/home')
}

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

function isOverdue(date) {
  if (!date) return false
  const d = new Date(date)
  return d < new Date() && d.toDateString() !== new Date().toDateString()
}

function getProgressMessage(progress) {
  if (progress >= 100) return 'Project completed!'
  if (progress >= 75) return 'Almost there! Final stages.'
  if (progress >= 50) return 'Halfway through the project.'
  if (progress >= 25) return 'Good progress being made.'
  return 'Project just started.'
}

function formatDate(date) {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(date) {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function fileIconClass(type) {
  const t = (type || '').toLowerCase()
  if (/(jpg|jpeg|png|gif|image|webp)/.test(t)) return 'image'
  if (/pdf/.test(t)) return 'pdf'
  if (/(doc|docx)/.test(t)) return 'doc'
  if (/(xls|xlsx|csv)/.test(t)) return 'sheet'
  if (/(dwg|cad|dxf)/.test(t)) return 'cad'
  return 'other'
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function viewFile(file) {
  window.open(file.fileUrl || file.url, '_blank')
}

function downloadFile(file) {
  const a = document.createElement('a')
  a.href = file.fileUrl || file.url
  a.download = file.fileName || 'file'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// Submission modal functions
function openSubmissionModal() {
  submissionForm.value = { message: '', files: [] }
  showSubmissionModal.value = true
}

function closeSubmissionModal() {
  showSubmissionModal.value = false
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  const newFiles = Array.from(e.target.files)
  submissionForm.value.files.push(...newFiles)
}

function handleDrop(e) {
  isDragging.value = false
  const newFiles = Array.from(e.dataTransfer.files)
  submissionForm.value.files.push(...newFiles)
}

function removeFile(idx) {
  submissionForm.value.files.splice(idx, 1)
}

async function submitSubmission() {
  if (!submissionForm.value.message.trim()) return

  submitting.value = true

  try {
    const userData = localStorage.getItem('domus_user')
    const user = userData ? JSON.parse(userData) : {}

    const formData = new FormData()
    formData.append('clientId', user.id || '')
    formData.append('projectId', project.value.id)
    formData.append('message', submissionForm.value.message.trim())

    for (const file of submissionForm.value.files) {
      formData.append('files', file)
    }

    const res = await fetch(`${API_BASE_URL}/api/user/submit-project`, {
      method: 'POST',
      body: formData
    })

    const result = await res.json()

    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Failed to submit')
    }

    showAlert('Submission sent successfully!', 'success')
    closeSubmissionModal()
    await fetchSubmissions()
    await fetchActivities()

  } catch (err) {
    showAlert(err.message || 'Failed to submit', 'error')
  } finally {
    submitting.value = false
  }
}

// Fetch functions
async function fetchProjectDetails() {
  loading.value = true
  error.value = ''

  const projectId = route.params.id

  try {
    const res = await fetch(`${API_BASE_URL}/api/user/project/${projectId}`)
    const result = await res.json()

    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Failed to load project')
    }

    project.value = result.data
    staffMembers.value = result.data.staff || []

    // Fetch related data
    await Promise.all([
      fetchFiles(),
      fetchSubmissions(),
      fetchActivities()
    ])

  } catch (err) {
    error.value = err.message || 'Failed to load project details'
  } finally {
    loading.value = false
  }
}

async function fetchFiles() {
  filesLoading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/project/${project.value.id}/files`)
    const result = await res.json()
    if (result.success) {
      files.value = result.data || []
    }
  } catch (err) {
    console.error('Failed to fetch files:', err)
  } finally {
    filesLoading.value = false
  }
}

async function fetchSubmissions() {
  submissionsLoading.value = true
  const userData = localStorage.getItem('domus_user')
  const user = userData ? JSON.parse(userData) : {}

  try {
    const res = await fetch(`${API_BASE_URL}/api/user/project/${project.value.id}/submissions?clientId=${user.id}`)
    const result = await res.json()
    if (result.success) {
      submissions.value = result.data || []
    }
  } catch (err) {
    console.error('Failed to fetch submissions:', err)
  } finally {
    submissionsLoading.value = false
  }
}

async function fetchActivities() {
  activityLoading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/project/${project.value.id}/activities`)
    const result = await res.json()
    if (result.success) {
      activities.value = result.data || []
    }
  } catch (err) {
    console.error('Failed to fetch activities:', err)
  } finally {
    activityLoading.value = false
  }
}

onMounted(() => {
  fetchProjectDetails()
})
</script>

<style scoped>
.project-details-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: 100vh;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 16px;
  transition: color 0.2s;
}
.back-btn:hover { color: #e6b23a; }

/* Loading & Error States */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #e6b23a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner.small { width: 20px; height: 20px; border-width: 2px; }

@keyframes spin { to { transform: rotate(360deg); } }

.retry-btn {
  margin-top: 16px;
  background: #e6b23a;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
}

/* Header */
.project-header {
  margin-bottom: 24px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.project-code {
  display: inline-block;
  font-size: .85rem;
  color: #888;
  font-family: ui-monospace, monospace;
  margin-bottom: 4px;
}

.project-title {
  margin: 0;
  font-size: 1.8rem;
  color: #213547;
  font-weight: 700;
}

.project-desc {
  margin: 8px 0 0;
  color: #555;
  line-height: 1.6;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: .85rem;
  text-transform: uppercase;
}

.status-badge.pending { color:#b36b00; background:#fff7e1; }
.status-badge.planning { color:#8a6b00; background:#fff7e1; }
.status-badge.design { color:#0b5da3; background:#e9f3ff; }
.status-badge.review { color:#6a0596; background:#f6eaff; }
.status-badge.inprogress { color:#0d47a1; background:#bbdefb; }
.status-badge.construction { color:#0b7a3b; background:#e8ffee; }
.status-badge.completed { color:#1f7a1f; background:#ecfaec; }
.status-badge.onhold { color:#9a4b00; background:#fff4e5; }
.status-badge.archived { color:#888; background:#f3f3f3; }

/* Progress Card */
.progress-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,.04);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.progress-circle {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.circle-bg {
  fill: none;
  stroke: #f0f0f0;
  stroke-width: 3;
}

.circle-fill {
  fill: none;
  stroke: #e6b23a;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.progress-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.1rem;
  font-weight: 700;
  color: #213547;
}

.progress-details h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #213547;
}

.progress-details p {
  margin: 4px 0 0;
  color: #666;
  font-size: .9rem;
}

.progress-dates {
  display: flex;
  gap: 32px;
}

.date-item {
  text-align: right;
}

.date-label {
  display: block;
  font-size: .8rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-value {
  display: block;
  margin-top: 4px;
  font-weight: 600;
  color: #213547;
}

.date-item.overdue .date-value { color: #c62828; }

.overdue-tag {
  display: inline-block;
  font-size: .7rem;
  padding: 2px 6px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-left: 6px;
}

/* Tabs */
.tabs-nav {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 24px;
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 12px 16px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover { color: #213547; }

.tab-btn.active {
  color: #e6b23a;
  border-bottom-color: #e6b23a;
}

.tab-count {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: .8rem;
}

.tab-btn.active .tab-count {
  background: #fff7e1;
  color: #b36b00;
}

/* Tab Content */
.tab-panel { animation: fadeIn 0.3s ease; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #213547;
}

.file-count {
  color: #888;
  font-size: .9rem;
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #888;
  padding: 20px 0;
}

.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #888;
}

.empty-section p { margin: 16px 0; }

/* Overview Grid */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,.04);
}

.info-card h3 {
  margin: 0 0 16px;
  font-size: 1rem;
  color: #213547;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #888;
  font-size: .9rem;
}

.info-value {
  font-weight: 600;
  color: #213547;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: .75rem;
  text-transform: uppercase;
}

.status-pill.pending { color:#b36b00; background:#fff7e1; }
.status-pill.inprogress { color:#0d47a1; background:#bbdefb; }
.status-pill.completed { color:#1f7a1f; background:#ecfaec; }

/* Team Card */
.team-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e6b23a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: .85rem;
  overflow: hidden;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 600;
  color: #213547;
}

.member-role {
  font-size: .85rem;
  color: #888;
}

.no-data {
  color: #888;
  text-align: center;
  padding: 20px;
}

/* Tasks Summary */
.tasks-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #213547;
}

.stat-label {
  font-size: .8rem;
  color: #888;
}

.stat-item.todo { background: #fff7e1; }
.stat-item.todo .stat-value { color: #b36b00; }

.stat-item.progress { background: #e3f2fd; }
.stat-item.progress .stat-value { color: #1565c0; }

.stat-item.done { background: #e8f5e9; }
.stat-item.done .stat-value { color: #2e7d32; }

/* Files Grid */
.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.file-card:hover {
  border-color: #e6b23a55;
  box-shadow: 0 4px 16px rgba(0,0,0,.06);
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #f5f5f5;
}

.file-icon.image { background: #fce4ec; color: #c2185b; }
.file-icon.pdf { background: #ffebee; color: #c62828; }
.file-icon.doc { background: #e3f2fd; color: #1565c0; }
.file-icon.sheet { background: #e8f5e9; color: #2e7d32; }
.file-icon.cad { background: #f3e5f5; color: #7b1fa2; }

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-weight: 600;
  color: #213547;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.file-type {
  font-size: .75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #666;
}

.file-size {
  font-size: .85rem;
  color: #888;
}

.file-date {
  display: block;
  font-size: .8rem;
  color: #aaa;
  margin-top: 4px;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #e6b23a;
  color: #fff;
}

/* Submissions */
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e6b23a;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover { background: #d4a02c; }

.primary-btn {
  background: #e6b23a;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.submission-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
}

.submission-header {
  margin-bottom: 12px;
}

.submission-date {
  font-size: .85rem;
  color: #888;
}

.submission-message {
  margin: 0;
  color: #213547;
  line-height: 1.6;
}

.submission-files {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.files-label {
  display: block;
  font-size: .85rem;
  color: #888;
  margin-bottom: 8px;
}

.attached-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attached-file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: .85rem;
  color: #1976d2;
  text-decoration: none;
  transition: all 0.2s;
}

.attached-file:hover {
  background: #e3f2fd;
}

/* Activity Timeline */
.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.activity-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-left: 2px solid #f0f0f0;
  margin-left: 12px;
  padding-left: 24px;
  position: relative;
}

.activity-icon {
  position: absolute;
  left: -13px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f5f5f5;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
}

.activity-icon.file_upload { background: #e3f2fd; color: #1565c0; }
.activity-icon.status_change { background: #fff7e1; color: #b36b00; }
.activity-icon.submission { background: #e8f5e9; color: #2e7d32; }
.activity-icon.comment { background: #f3e5f5; color: #7b1fa2; }

.activity-content {
  flex: 1;
}

.activity-message {
  margin: 0;
  color: #213547;
}

.activity-time {
  font-size: .8rem;
  color: #888;
  margin-top: 4px;
  display: block;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.submission-modal {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #213547;
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

.close-btn:hover { background: #f5f5f5; color: #c62828; }

.submission-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #213547;
  margin-bottom: 8px;
}

.required { color: #c62828; }

.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group textarea:focus {
  border-color: #e6b23a;
}

.dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafbff;
}

.dropzone:hover, .dropzone.drag-over {
  border-color: #e6b23a;
  background: #fffdf5;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dropzone-content p { margin: 0; color: #213547; }
.dropzone-content strong { color: #e6b23a; }
.file-types { font-size: .85rem; color: #888; }

.selected-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.selected-file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: .85rem;
}

.remove-file {
  background: none;
  border: none;
  color: #c62828;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
}

.add-more {
  background: #e6b23a;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: .85rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  padding: 12px 24px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  color: #666;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  background: #e6b23a;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* Alert */
.alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0,0,0,.15);
  animation: slideDown 0.3s ease;
}

.alert.success { background: #e6f7e6; color: #2e7d32; border: 1px solid #a5d6a7; }
.alert.error { background: #ffeaea; color: #c62828; border: 1px solid #ef9a9a; }

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .header-main { flex-direction: column; }
  .progress-card { flex-direction: column; text-align: center; }
  .progress-info { flex-direction: column; }
  .progress-dates { justify-content: center; }
  .date-item { text-align: center; }
  .overview-grid { grid-template-columns: 1fr; }
  .tasks-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>