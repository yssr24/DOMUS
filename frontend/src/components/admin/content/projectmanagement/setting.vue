<!-- filepath: c:\Users\VIVOBOOK\OneDrive - Mindoro State University\Desktop\github\DOMUS\frontend\src\components\admin\content\projectmanagement\setting.vue -->
<template>
  <div class="project-settings">
    <!-- Header -->
    <header class="settings-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      <div class="header-info">
        <h1>{{ project.title || 'Project Settings' }}</h1>
        <span class="project-code">{{ project.code }}</span>
      </div>
      <span :class="['status-badge', project.status]">{{ formatStatus(project.status) }}</span>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading project details...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchProjectData">Retry</button>
    </div>

    <div v-else class="settings-content">
      <!-- Main Content Area -->
      <div class="main-area">
        <!-- Project Details Card -->
        <section class="card project-details-card">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Project Details
          </h2>
          <div class="details-grid">
            <div class="detail-item">
              <label>Project Title</label>
              <p>{{ project.title || 'N/A' }}</p>
            </div>
            <div class="detail-item">
              <label>Project Code</label>
              <p class="mono">{{ project.code || 'N/A' }}</p>
            </div>
            <div class="detail-item">
              <label>Status</label>
              <p><span :class="['status-pill', project.status]">{{ formatStatus(project.status) }}</span></p>
            </div>
            <div class="detail-item">
              <label>Lead Architect</label>
              <p>{{ project.leadArchitect || 'Not assigned' }}</p>
            </div>
            <div class="detail-item full-width">
              <label>Description</label>
              <p>{{ project.description || 'No description provided' }}</p>
            </div>
            <div class="detail-item">
              <label>Location</label>
              <p>{{ formatLocation(project.location) }}</p>
            </div>
            <div class="detail-item">
              <label>Created At</label>
              <p>{{ formatDate(project.createdAt) }}</p>
            </div>
            <div class="detail-item">
              <label>Last Updated</label>
              <p>{{ formatDate(project.updatedAt) }}</p>
            </div>
          </div>
        </section>

        <!-- Client Info Card -->
        <section class="card client-card">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Client Information
          </h2>
          <div class="client-info">
            <div class="client-avatar">
              <img v-if="client.profilePic" :src="client.profilePic" :alt="client.name" />
              <div v-else class="avatar-placeholder">{{ getInitials(client.name) }}</div>
            </div>
            <div class="client-details">
              <h3>{{ client.name || 'Unknown Client' }}</h3>
              <p class="client-email">{{ client.email || 'No email' }}</p>
            </div>
          </div>
        </section>

        <!-- Staff Assigned Card -->
        <section class="card staff-card">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Assigned Staff
          </h2>
          <div v-if="staffMembers.length === 0" class="empty-state">
            <p>No staff assigned to this project</p>
          </div>
          <div v-else class="staff-list">
            <div v-for="staff in staffMembers" :key="staff.id" class="staff-item">
              <div class="staff-avatar">
                <img v-if="staff.profilePic" :src="staff.profilePic" :alt="staff.name" />
                <div v-else class="avatar-placeholder small">{{ getInitials(staff.name) }}</div>
              </div>
              <div class="staff-info">
                <span class="staff-name">{{ staff.name }}</span>
                <span class="staff-email">{{ staff.email }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Files Table -->
        <section class="card files-card">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
            Project Files
            <span class="count-badge">{{ files.length }}</span>
          </h2>
          <div v-if="files.length === 0" class="empty-state">
            <p>No files uploaded yet</p>
          </div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="file in files" :key="file.id">
                  <td class="file-name">
                    <span class="file-icon">{{ getFileIcon(file.type) }}</span>
                    {{ file.fileName }}
                  </td>
                  <td><span class="type-badge">{{ file.type }}</span></td>
                  <td>{{ file.uploaderName || 'Unknown' }}</td>
                  <td>{{ formatDate(file.createdAt) }}</td>
                  <td>
                    <a :href="file.fileUrl" target="_blank" class="action-btn view">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Client Submissions Table -->
        <section class="card submissions-card">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Client Submissions
            <span class="count-badge">{{ submissions.length }}</span>
          </h2>
          <div v-if="submissions.length === 0" class="empty-state">
            <p>No submissions from client yet</p>
          </div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Files</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sub in submissions" :key="sub.id">
                  <td class="message-cell">{{ sub.message || 'No message' }}</td>
                  <td>
                    <div v-if="sub.files && sub.files.length" class="files-list">
                      <a v-for="(f, idx) in sub.files" :key="idx" :href="f.url || f" target="_blank" class="file-link">
                        {{ f.name || `File ${idx + 1}` }}
                      </a>
                    </div>
                    <span v-else class="no-files">No files</span>
                  </td>
                  <td>{{ formatDate(sub.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Tasks Table -->
        <section class="card tasks-card">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Tasks
            <span class="count-badge">{{ tasks.length }}</span>
          </h2>
          <div v-if="tasks.length === 0" class="empty-state">
            <p>No tasks created for this project</p>
          </div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in tasks" :key="task.id">
                  <td>{{ task.title }}</td>
                  <td><span :class="['task-status', task.status]">{{ task.status }}</span></td>
                  <td>{{ task.assigneeName || 'Unassigned' }}</td>
                  <td>{{ formatDate(task.deadline) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- Activity Sidebar -->
      <aside class="activity-sidebar">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Activity Log
        </h2>
        <div v-if="activities.length === 0" class="empty-state">
          <p>No activity yet</p>
        </div>
        <div v-else class="activity-list">
          <div v-for="(group, date) in groupedActivities" :key="date" class="activity-group">
            <div class="activity-date">{{ date }}</div>
            <div v-for="activity in group" :key="activity.id" class="activity-item">
              <div class="activity-icon" :class="activity.type">
                <svg v-if="activity.type === 'created_project'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <svg v-else-if="activity.type === 'file_upload'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <svg v-else-if="activity.type === 'task_created' || activity.type === 'task_updated'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4"/>
                </svg>
                <svg v-else-if="activity.type === 'submission'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <svg v-else-if="activity.type === 'message'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div class="activity-content">
                <p class="activity-message">{{ activity.message }}</p>
                <span class="activity-time">{{ formatTime(activity.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '../../../../config'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id

const loading = ref(true)
const error = ref('')

const project = ref({})
const client = ref({})
const staffMembers = ref([])
const files = ref([])
const submissions = ref([])
const tasks = ref([])
const activities = ref([])

function goBack() {
  router.push('/admin/project-management')
}

function formatStatus(status) {
  if (!status) return 'Pending'
  return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatLocation(loc) {
  if (!loc) return 'Not specified'
  const parts = [loc.barangay, loc.city, loc.province, loc.zip].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Not specified'
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getFileIcon(type) {
  const icons = {
    pdf: '📄',
    dwg: '📐',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    report: '📊'
  }
  return icons[type?.toLowerCase()] || '📁'
}

const groupedActivities = computed(() => {
  const groups = {}
  const sorted = [...activities.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  sorted.forEach(activity => {
    const date = formatDate(activity.createdAt)
    if (!groups[date]) groups[date] = []
    groups[date].push(activity)
  })
  
  return groups
})

async function fetchProjectData() {
  loading.value = true
  error.value = ''
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/project-details/${projectId}`)
    const result = await res.json()
    
    if (result.success) {
      project.value = result.data.project || {}
      client.value = result.data.client || {}
      staffMembers.value = result.data.staffMembers || []
      files.value = result.data.files || []
      submissions.value = result.data.submissions || []
      tasks.value = result.data.tasks || []
      activities.value = result.data.activities || []
    } else {
      error.value = result.message || 'Failed to load project'
    }
  } catch (e) {
    console.error('Error fetching project:', e)
    error.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjectData()
})
</script>

<style scoped>
.project-settings {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #213547;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e8e8e8;
}

.header-info {
  flex: 1;
}

.header-info h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #213547;
}

.project-code {
  font-family: ui-monospace, monospace;
  color: #666;
  font-size: 0.9rem;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.status-badge.pending { background: #fff7e1; color: #b36b00; }
.status-badge.design, .status-badge.in-progress { background: #e3f0fc; color: #1976d2; }
.status-badge.review { background: #f6eaff; color: #8e24aa; }
.status-badge.construction { background: #e8ffee; color: #0b7a3b; }
.status-badge.completed { background: #ecfaec; color: #1f7a1f; }

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.settings-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.main-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
}

.card h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: #213547;
}

.count-badge {
  background: #e3f0fc;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
}

.detail-item p {
  margin: 0;
  color: #213547;
}

.mono {
  font-family: ui-monospace, monospace;
}

.status-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-pill.pending { background: #fff7e1; color: #b36b00; }
.status-pill.design, .status-pill.in-progress { background: #e3f0fc; color: #1976d2; }
.status-pill.review { background: #f6eaff; color: #8e24aa; }
.status-pill.construction { background: #e8ffee; color: #0b7a3b; }
.status-pill.completed { background: #ecfaec; color: #1f7a1f; }

.client-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.client-avatar img, .avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
}

.avatar-placeholder.small {
  width: 36px;
  height: 36px;
  font-size: 0.9rem;
}

.client-details h3 {
  margin: 0;
  color: #213547;
}

.client-email {
  color: #666;
  font-size: 0.9rem;
  margin: 4px 0 0;
}

.staff-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.staff-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 8px;
}

.staff-info {
  display: flex;
  flex-direction: column;
}

.staff-name {
  font-weight: 600;
  color: #213547;
}

.staff-email {
  font-size: 0.85rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #888;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 12px 10px;
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  border-bottom: 2px solid #f0f0f0;
}

.data-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #f5f5f5;
  color: #213547;
}

.data-table tr:hover {
  background: #fafafa;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 1.2rem;
}

.type-badge {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: #666;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e3f0fc;
  color: #1976d2;
}

.message-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-link {
  color: #1976d2;
  font-size: 0.85rem;
  text-decoration: none;
}

.file-link:hover {
  text-decoration: underline;
}

.no-files {
  color: #999;
  font-size: 0.85rem;
}

.task-status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.task-status.todo { background: #f0f0f0; color: #666; }
.task-status.in-progress { background: #e3f0fc; color: #1976d2; }
.task-status.review { background: #f6eaff; color: #8e24aa; }
.task-status.done { background: #ecfaec; color: #1f7a1f; }

/* Activity Sidebar */
.activity-sidebar {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
  height: fit-content;
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

.activity-sidebar h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: #213547;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-date {
  font-size: 0.75rem;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  padding: 4px 0;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 8px;
}

.activity-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon.created_project { background: #e3f0fc; color: #1976d2; }
.activity-icon.file_upload { background: #fff7e1; color: #b36b00; }
.activity-icon.task_created, .activity-icon.task_updated { background: #f6eaff; color: #8e24aa; }
.activity-icon.submission { background: #e8ffee; color: #0b7a3b; }
.activity-icon.message { background: #fce4ec; color: #c62828; }

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-message {
  margin: 0;
  font-size: 0.85rem;
  color: #213547;
  word-break: break-word;
}

.activity-time {
  font-size: 0.75rem;
  color: #999;
}

@media (max-width: 1100px) {
  .settings-content {
    grid-template-columns: 1fr;
  }
  
  .activity-sidebar {
    position: static;
    max-height: none;
  }
}

@media (max-width: 768px) {
  .settings-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .details-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 500px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>