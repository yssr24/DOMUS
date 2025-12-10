<template>
  <div class="psc-wrap">
    <!-- Header -->
    <header class="psc-header">
      <button class="back-btn" @click="$router.push('/staff/projects')">← Back</button>
      <div class="project-info" v-if="project">
        <h2>{{ project.code }} — {{ project.title }}</h2>
        <span class="pill" :class="project.status">{{ prettyStatus(project.status) }}</span>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading project...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchProjectData">Retry</button>
    </div>

    <template v-else>
      <!-- Project Summary -->
      <section class="psc-summary">
        <div class="sum-item"><strong>Client:</strong> {{ project.clientName || '—' }}</div>
        <div class="sum-item"><strong>Deadline:</strong> {{ formatDate(project.dueDate) }}</div>
        <div class="sum-item"><strong>Description:</strong> {{ project.description || 'No description' }}</div>
      </section>

      <!-- Tasks Section -->
      <section class="psc-tasks">
        <h3>Tasks ({{ tasks.length }})</h3>
        <div class="task-board">
          <div v-for="col in taskColumns" :key="col.key" class="task-col">
            <div class="col-header">
              <span>{{ col.title }}</span>
              <span class="count">{{ col.items.length }}</span>
            </div>
            <ul class="task-list">
              <li v-for="t in col.items" :key="t.id" class="task-card" @click="openTaskModal(t)">
                <div class="task-title">{{ t.title }}</div>
                <div class="task-meta">
                  <span class="pri" :class="t.priority || 'medium'">{{ t.priority || 'medium' }}</span>
                  <span class="due" :class="{ late: isLate(t) }">{{ formatDate(t.deadline) }}</span>
                </div>
                <div class="task-files" v-if="t.files?.length">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#1976d2"/></svg>
                  {{ t.files.length }} file(s)
                </div>
              </li>
              <li v-if="!col.items.length" class="empty">No tasks</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- My Submissions -->
      <section class="psc-submissions">
        <h3>My Submissions ({{ submissions.length }})</h3>
        <div class="sub-list" v-if="submissions.length">
          <div v-for="s in submissions" :key="s.id" class="sub-card">
            <div class="sub-info">
              <strong>{{ s.taskTitle || 'General' }}</strong>
              <span class="sub-date">{{ formatDate(s.createdAt) }}</span>
            </div>
            <div class="sub-files">
              <a v-for="f in s.files" :key="f.fileUrl" :href="f.fileUrl" target="_blank" class="file-link">
                {{ f.fileName }}
              </a>
            </div>
            <p class="sub-message" v-if="s.message">{{ s.message }}</p>
          </div>
        </div>
        <p v-else class="muted">No submissions yet.</p>
      </section>
    </template>

    <!-- Task Detail Modal -->
    <div v-if="showTaskModal" class="modal-overlay" @click.self="closeTaskModal">
      <div class="modal-content">
        <button class="modal-close" @click="closeTaskModal">×</button>
        <h3>{{ selectedTask?.title }}</h3>
        <div class="modal-body">
          <p><strong>Status:</strong> <span class="pill sm" :class="selectedTask?.status">{{ prettyTaskStatus(selectedTask?.status) }}</span></p>
          <p><strong>Priority:</strong> <span class="pri sm" :class="selectedTask?.priority || 'medium'">{{ selectedTask?.priority || 'medium' }}</span></p>
          <p><strong>Deadline:</strong> {{ formatDate(selectedTask?.deadline) }}</p>
          <p><strong>Description:</strong> {{ selectedTask?.description || 'No description' }}</p>
          
          <!-- Existing Files -->
          <div v-if="selectedTask?.files?.length" class="existing-files">
            <strong>Attached Files:</strong>
            <ul>
              <li v-for="f in selectedTask.files" :key="f.fileUrl">
                <a :href="f.fileUrl" target="_blank">{{ f.fileName }}</a>
              </li>
            </ul>
          </div>

          <!-- Update Status -->
          <div class="status-update">
            <label>Update Status:</label>
            <select v-model="newStatus" :disabled="updatingStatus">
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <button class="btn-update" @click="updateStatus" :disabled="updatingStatus || newStatus === selectedTask?.status">
              {{ updatingStatus ? 'Updating...' : 'Update' }}
            </button>
          </div>

          <!-- File Submission -->
          <div class="submit-section">
            <h4>Submit File</h4>
            <textarea v-model="submitMessage" placeholder="Add a message (optional)" rows="2"></textarea>
            <input type="file" ref="fileInput" @change="handleFileSelect" multiple />
            <div v-if="selectedFiles.length" class="selected-files">
              <span v-for="(f, i) in selectedFiles" :key="i" class="file-chip">
                {{ f.name }} <button @click="removeFile(i)">×</button>
              </span>
            </div>
            <button class="btn-submit" @click="submitFiles" :disabled="submitting || !selectedFiles.length">
              {{ submitting ? 'Submitting...' : 'Submit Files' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { API_BASE_URL } from '../../../config'

const route = useRoute()
const projectId = route.params.projectId

// State
const loading = ref(true)
const error = ref('')
const project = ref(null)
const tasks = ref([])
const submissions = ref([])

// Modal state
const showTaskModal = ref(false)
const selectedTask = ref(null)
const newStatus = ref('')
const updatingStatus = ref(false)
const submitMessage = ref('')
const selectedFiles = ref([])
const submitting = ref(false)
const fileInput = ref(null)

function getStaffId() {
  const userData = localStorage.getItem('domus_user')
  if (!userData) return null
  const user = JSON.parse(userData)
  return user.id || user.docId || user.userId
}

async function fetchProjectData() {
  loading.value = true
  error.value = ''
  const staffId = getStaffId()

  try {
    const res = await fetch(`${API_BASE_URL}/api/staff/project-detail?projectId=${projectId}&staffId=${staffId}`)
    const json = await res.json()
    if (!json.success) throw new Error(json.message)

    project.value = json.data.project
    tasks.value = json.data.tasks || []
    submissions.value = json.data.submissions || []
  } catch (e) {
    error.value = e.message || 'Failed to load project'
  } finally {
    loading.value = false
  }
}

// Task columns
const taskColumns = computed(() => {
  const cols = ['todo', 'in-progress', 'review', 'done']
  const titles = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }
  return cols.map(k => ({
    key: k,
    title: titles[k],
    items: tasks.value.filter(t => t.status === k)
  }))
})

// Modal functions
function openTaskModal(t) {
  selectedTask.value = t
  newStatus.value = t.status
  showTaskModal.value = true
  submitMessage.value = ''
  selectedFiles.value = []
}

function closeTaskModal() {
  showTaskModal.value = false
  selectedTask.value = null
}

async function updateStatus() {
  if (!selectedTask.value || newStatus.value === selectedTask.value.status) return
  updatingStatus.value = true

  try {
    const res = await fetch(`${API_BASE_URL}/api/staff/update-task-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: selectedTask.value.id, status: newStatus.value, staffId: getStaffId() })
    })
    const json = await res.json()
    if (json.success) {
      selectedTask.value.status = newStatus.value
      const task = tasks.value.find(t => t.id === selectedTask.value.id)
      if (task) task.status = newStatus.value
    }
  } catch (e) {
    alert('Failed to update status')
  } finally {
    updatingStatus.value = false
  }
}

function handleFileSelect(e) {
  selectedFiles.value = [...e.target.files]
}

function removeFile(i) {
  selectedFiles.value.splice(i, 1)
}

async function submitFiles() {
  if (!selectedFiles.value.length) return
  submitting.value = true

  try {
    const formData = new FormData()
    formData.append('staffId', getStaffId())
    formData.append('projectId', projectId)
    formData.append('taskId', selectedTask.value?.id || '')
    formData.append('message', submitMessage.value)
    selectedFiles.value.forEach(f => formData.append('files', f))

    const res = await fetch(`${API_BASE_URL}/api/staff/submit-files`, {
      method: 'POST',
      body: formData
    })
    const json = await res.json()

    if (json.success) {
      submissions.value.unshift(json.data)
      submitMessage.value = ''
      selectedFiles.value = []
      if (fileInput.value) fileInput.value.value = ''
      alert('Files submitted successfully!')
    } else {
      throw new Error(json.message)
    }
  } catch (e) {
    alert('Failed to submit files: ' + e.message)
  } finally {
    submitting.value = false
  }
}

// Helpers
const prettyStatus = s => ({ pending: 'Pending', planning: 'Planning', design: 'Design', review: 'Review', 'in-progress': 'In Progress', construction: 'Construction', completed: 'Completed', 'on-hold': 'On Hold' }[s] || s)
const prettyTaskStatus = s => ({ todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }[s] || s)
const formatDate = v => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const isLate = t => t.deadline && t.status !== 'done' && new Date(t.deadline) < new Date()

onMounted(fetchProjectData)
</script>

<style scoped>
.psc-wrap { max-width: 1100px; margin: 0 auto; padding: 16px; background: #fff; border-radius: 16px; box-shadow: 0 2px 12px #e6b23a22; }
.psc-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.back-btn { background: #f5f5f5; border: 1px solid #e0e0e0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.back-btn:hover { background: #e8e8e8; }
.project-info { display: flex; align-items: center; gap: 12px; flex: 1; }
.project-info h2 { margin: 0; color: #213547; }

.loading-state, .error-state { text-align: center; padding: 60px 20px; }
.spinner { width: 40px; height: 40px; border: 4px solid #f0f0f0; border-top-color: #1976d2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
.retry-btn { background: #1976d2; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }

.psc-summary { background: #f8f9fa; padding: 16px; border-radius: 12px; margin-bottom: 20px; display: grid; gap: 8px; }
.sum-item { color: #555; }
.sum-item strong { color: #213547; }

.psc-tasks h3, .psc-submissions h3 { color: #213547; margin: 0 0 12px; }
.task-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.task-col { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 12px; padding: 10px; min-height: 150px; }
.col-header { display: flex; justify-content: space-between; font-weight: 700; color: #213547; margin-bottom: 8px; }
.col-header .count { background: #e3f0fc; color: #1976d2; padding: 2px 8px; border-radius: 999px; font-size: .8rem; }
.task-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.task-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 10px; padding: 10px; cursor: pointer; transition: box-shadow .2s; }
.task-card:hover { box-shadow: 0 2px 8px #00000015; }
.task-title { font-weight: 600; color: #213547; margin-bottom: 6px; font-size: .95rem; }
.task-meta { display: flex; justify-content: space-between; align-items: center; font-size: .8rem; }
.task-files { margin-top: 6px; color: #1976d2; font-size: .8rem; display: flex; align-items: center; gap: 4px; }
.empty { color: #999; text-align: center; padding: 16px; font-style: italic; }

.psc-submissions { margin-top: 20px; }
.sub-list { display: flex; flex-direction: column; gap: 12px; }
.sub-card { background: #f8f9fa; border: 1px solid #e8e8e8; border-radius: 10px; padding: 12px; }
.sub-info { display: flex; justify-content: space-between; margin-bottom: 6px; }
.sub-date { color: #888; font-size: .85rem; }
.sub-files { display: flex; gap: 8px; flex-wrap: wrap; }
.file-link { color: #1976d2; font-size: .9rem; text-decoration: none; }
.file-link:hover { text-decoration: underline; }
.sub-message { margin: 8px 0 0; color: #555; font-size: .9rem; }

/* Pills */
.pill { padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: .75rem; text-transform: uppercase; }
.pill.sm { padding: 2px 8px; font-size: .7rem; }
.pill.pending, .pill.planning, .pill.todo { color: #555; background: #f5f5f5; }
.pill.design, .pill.in-progress { color: #114f8f; background: #e3f0fc; }
.pill.review { color: #6a0596; background: #f6eaff; }
.pill.construction, .pill.done { color: #1f7a1f; background: #ecfaec; }
.pill.completed { color: #37474f; background: #eceff1; }
.pill.on-hold { color: #9a4b00; background: #fff4e5; }

.pri { padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: .7rem; text-transform: uppercase; }
.pri.sm { padding: 2px 6px; font-size: .65rem; }
.pri.high { color: #9c1f1f; background: #ffebee; }
.pri.medium { color: #9a4b00; background: #fff7e1; }
.pri.low { color: #114f8f; background: #e3f0fc; }
.due.late { color: #c62828; font-weight: 700; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #fff; border-radius: 16px; width: 90%; max-width: 500px; max-height: 85vh; overflow-y: auto; padding: 24px; position: relative; }
.modal-close { position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 24px; cursor: pointer; color: #888; }
.modal-content h3 { margin: 0 0 16px; color: #213547; padding-right: 30px; }
.modal-body p { margin: 8px 0; color: #555; }
.modal-body strong { color: #213547; }

.existing-files { margin: 12px 0; }
.existing-files ul { margin: 4px 0 0 16px; padding: 0; }
.existing-files a { color: #1976d2; }

.status-update { display: flex; gap: 8px; align-items: center; margin: 16px 0; padding: 12px; background: #f8f9fa; border-radius: 8px; }
.status-update label { font-weight: 600; color: #213547; }
.status-update select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; }
.btn-update { background: #1976d2; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-update:disabled { opacity: .6; cursor: not-allowed; }

.submit-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
.submit-section h4 { margin: 0 0 12px; color: #213547; }
.submit-section textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; resize: vertical; margin-bottom: 10px; }
.submit-section input[type="file"] { margin-bottom: 10px; }
.selected-files { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.file-chip { background: #e3f0fc; color: #1976d2; padding: 4px 10px; border-radius: 999px; font-size: .85rem; display: flex; align-items: center; gap: 6px; }
.file-chip button { background: none; border: none; color: #1976d2; cursor: pointer; font-size: 14px; }
.btn-submit { background: #43a047; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%; }
.btn-submit:disabled { opacity: .6; cursor: not-allowed; }

.muted { color: #888; }

@media (max-width: 800px) { .task-board { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .task-board { grid-template-columns: 1fr; } }
</style>