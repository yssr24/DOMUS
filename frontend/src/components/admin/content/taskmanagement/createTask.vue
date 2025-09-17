<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../../../../config'

const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const alertMsg = ref('')
const alertType = ref('success')

const projects = ref([])
const staff = ref([])

const selectedProject = ref('')
const title = ref('')
const description = ref('')
const selectedAssignees = ref([]) // multiple
const deadline = ref('')          // yyyy-mm-dd

function showAlert(msg, type='success') {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => (alertMsg.value = ''), 3000)
}

const canSave = computed(() =>
  !!selectedProject.value && !!title.value && selectedAssignees.value.length > 0
)

async function loadProjects() {
  const res = await fetch(`${API_BASE_URL}/api/admin/projects`)
  const json = await res.json()
  projects.value = json.success ? (json.data || []) : []
}

async function loadStaff() {
  const res = await fetch(`${API_BASE_URL}/api/admin/users-with-status?role=staff`)
  const json = await res.json()
  staff.value = json.success ? (json.data || []).map(u => ({
    id: u.id || u.userId || u.docId, // be tolerant
    name: [u.lastname, u.firstname].filter(Boolean).join(', ') || u.email
  })) : []
}

async function save() {
  if (!canSave.value) return
  saving.value = true
  const userRaw = localStorage.getItem('domus_user')
  const creatorEmail = userRaw ? JSON.parse(userRaw).email : ''
  try {
    const payload = {
      projectId: selectedProject.value,
      title: title.value,
      description: description.value,
      status: 'todo',
      assignedTo: selectedAssignees.value,
      createdByEmail: creatorEmail,
      deadline: deadline.value ? new Date(deadline.value).toISOString() : null
    }
    const res = await fetch(`${API_BASE_URL}/api/admin/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create task')
    showAlert('Task created successfully.', 'success')
    setTimeout(() => router.push('/admin/task-management'), 900)
  } catch (e) {
    showAlert(e.message || 'Network error', 'error')
  } finally {
    saving.value = false
  }
}

function cancel() {
  router.back()
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadProjects(), loadStaff()])
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="ct-wrap">
    <div v-if="alertMsg" :class="['alert', alertType]">{{ alertMsg }}</div>

    <header class="ct-header">
      <h2>Create Task</h2>
    </header>

    <section class="ct-card">
      <div class="row">
        <div class="field">
          <label>Project</label>
          <select v-model="selectedProject">
            <option value="" disabled>Select a project</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">
              {{ (p.code || p.projectCode) + ' | ' + (p.title || p.projectTitle) }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Deadline</label>
          <input v-model="deadline" type="date" />
        </div>
      </div>

      <div class="field">
        <label>Task Title</label>
        <input v-model="title" type="text" placeholder="e.g., Create Floor Plan" />
      </div>

      <div class="field">
        <label>Description (optional)</label>
        <textarea v-model="description" rows="4" placeholder="Add details..."></textarea>
      </div>

      <div class="field">
        <label>Assign to (staff)</label>
        <select v-model="selectedAssignees" multiple size="6">
          <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <small class="hint">Hold Ctrl (Windows) to select multiple.</small>
      </div>

      <div class="btn-row">
        <button class="save" :disabled="!canSave || saving" @click="save">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M20 6L9 17l-5-5"/></svg>
          <span>{{ saving ? 'Creating...' : 'Create' }}</span>
        </button>
        <button class="cancel" @click="cancel">Cancel</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ct-wrap { max-width: 860px; margin: 24px auto; background:#fff; border-radius:16px; box-shadow:0 2px 12px #e6b23a22; padding: 20px; }
.ct-header h2 { margin: 0 0 10px 0; color:#213547; }
.ct-card { padding: 8px; }
.field { display:flex; flex-direction:column; margin-bottom:14px; }
.field label { font-weight:600; color:#213547; margin-bottom:6px; }
.field input, .field select, .field textarea {
  padding:10px 12px; border:1px solid #e0e0e0; border-radius:10px; font-size:1rem; outline:none; background:#fff;
}
.field input:focus, .field select:focus, .field textarea:focus { border-color:#e6b23a; }
.row { display:grid; grid-template-columns: 2fr 1fr; gap:14px; }
.btn-row { display:flex; gap:12px; margin-top: 8px; }
.save { display:inline-flex; align-items:center; gap:8px; background:#1976d2; color:#fff; border:none; border-radius:10px; padding:10px 16px; font-weight:700; cursor:pointer; }
.save:disabled { opacity:.6; cursor:not-allowed; }
.cancel { background:#eee; color:#213547; border:none; border-radius:10px; padding:10px 16px; font-weight:700; cursor:pointer; }
.hint { color:#777; font-size:.85rem; margin-top:6px; }
.alert { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 1000; padding: 10px 16px; border-radius: 8px; box-shadow: 0 2px 8px #0002; }
.alert.success { background: #e6f7e6; color: #2e7d32; border-bottom: 2px solid #2e7d32; }
.alert.error { background: #ffeaea; color: #c62828; border-bottom: 2px solid #c62828; }
@media (max-width: 700px) { .row { grid-template-columns: 1fr; } }
</style>