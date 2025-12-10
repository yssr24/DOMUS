<template>
  <div class="fd-wrap">
    <!-- Alert -->
    <div v-if="alertMsg" :class="['alert', alertType]">{{ alertMsg }}</div>

    <header class="fd-header">
      <h2>Files & Documents</h2>
      <input
        v-model="search"
        type="text"
        class="fd-search"
        placeholder="Search files..."
      />
    </header>

    <!-- KPI Cards -->
    <section class="fd-cards">
      <div class="fd-card total">
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </span>
        <span class="info">
          <span class="label">Total Files</span>
          <span class="value">{{ totalCount }}</span>
        </span>
      </div>
      <div class="fd-card images">
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#8e24aa" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </span>
        <span class="info">
          <span class="label">Images</span>
          <span class="value">{{ imagesCount }}</span>
        </span>
      </div>
      <div class="fd-card docs">
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#e6b23a" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </span>
        <span class="info">
          <span class="label">Documents</span>
          <span class="value">{{ docsCount }}</span>
        </span>
      </div>
      <div class="fd-card storage">
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#43a047" stroke-width="2"><path d="M22 12H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
        </span>
        <span class="info">
          <span class="label">Total Size</span>
          <span class="value">{{ formatSize(totalBytes) }}</span>
        </span>
      </div>
    </section>

    <!-- Table -->
    <section class="fd-table-card">
      <div class="table-toolbar">
        <button class="upload-btn" @click="openUploadModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload File
        </button>
        <span v-if="loading" class="hint">Loading...</span>
        <span v-else-if="error" class="error">{{ error }}</span>
        <span v-else class="hint">{{ sortedRows.length }} file(s)</span>
      </div>
      <div class="table-wrap">
        <table class="fd-table">
          <thead>
            <tr>
              <th :class="thClass('fileName')" @click="toggleSort('fileName')">Name</th>
              <th :class="thClass('type')" @click="toggleSort('type')">Type</th>
              <th :class="thClass('size')" @click="toggleSort('size')">Size</th>
              <th :class="thClass('projectCode')" @click="toggleSort('projectCode')">Project</th>
              <th :class="thClass('uploadedAt')" @click="toggleSort('uploadedAt')">Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in sortedRows" :key="f.id">
              <td>
                <span class="name-cell">
                  <span :class="['file-icon', fileIconClass(f.type)]"></span>
                  <span class="ellipsis" :title="f.fileName">{{ f.fileName }}</span>
                </span>
              </td>
              <td><span :class="['pill', fileTypeClass(f.type)]">{{ prettyType(f.type) }}</span></td>
              <td class="mono">{{ formatSize(f.size) }}</td>
              <td>{{ f.projectCode || '—' }}</td>
              <td class="muted">{{ formatDate(f.uploadedAt) }}</td>
              <td class="actions">
                <button class="link-btn" @click="openView(f)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  View
                </button>
                <button class="link-btn" @click="download(f)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              </td>
            </tr>
            <tr v-if="!sortedRows.length && !loading">
              <td colspan="6" class="center muted">No files found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
      <div class="upload-modal">
        <div class="modal-header">
          <h3>Upload File</h3>
          <button class="close-btn" @click="closeUploadModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleUpload" class="upload-form">
          <div class="form-group">
            <label for="fileName">File Name <span class="required">*</span></label>
            <input
              id="fileName"
              v-model="uploadForm.fileName"
              type="text"
              placeholder="Enter file name"
              required
            />
          </div>

          <div class="form-group">
            <label for="projectSelect">Select Project <span class="required">*</span></label>
            <select id="projectSelect" v-model="uploadForm.projectId" required>
              <option value="" disabled>Choose a project...</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">
                {{ p.code }} - {{ p.title }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="uploadForm.description"
              rows="3"
              placeholder="Enter file description (optional)"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Upload File <span class="required">*</span></label>
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
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.csv,.dwg,.doc,.docx,.xls,.xlsx"
                @change="handleFileSelect"
                hidden
              />
              <div v-if="!uploadForm.file" class="dropzone-content">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p><strong>Click to upload</strong> or drag and drop</p>
                <span class="file-types">PDF, JPG, PNG, CSV, DWG, DOC, XLS</span>
              </div>
              <div v-else class="file-preview">
                <span :class="['preview-icon', fileIconClass(getFileExtension(uploadForm.file.name))]"></span>
                <div class="preview-info">
                  <p class="preview-name">{{ uploadForm.file.name }}</p>
                  <p class="preview-size">{{ formatSize(uploadForm.file.size) }}</p>
                </div>
                <button type="button" class="remove-file" @click.stop="removeFile">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeUploadModal">Cancel</button>
            <button type="submit" class="btn-upload" :disabled="uploading || !canUpload">
              <span v-if="uploading" class="spinner"></span>
              <span v-else>Upload File</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { API_BASE_URL } from '../../../config'
import { useRouter } from 'vue-router'

const files = ref([])
const projects = ref([])
const loading = ref(false)
const error = ref('')
const alertMsg = ref('')
const alertType = ref('success')

const search = ref('')
const sortKey = ref('uploadedAt')
const sortDir = ref('desc')

const router = useRouter()

// Upload modal state
const showUploadModal = ref(false)
const uploading = ref(false)
const isDragging = ref(false)
const fileInput = ref(null)

const uploadForm = ref({
  fileName: '',
  projectId: '',
  description: '',
  file: null
})

// Computed
const canUpload = computed(() => {
  return uploadForm.value.fileName.trim() && 
         uploadForm.value.projectId && 
         uploadForm.value.file
})

function showAlert(msg, type = 'success') {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 4000)
}

function thClass(key) {
  return { sortable: true, 'sort-asc': sortKey.value === key && sortDir.value === 'asc', 'sort-desc': sortKey.value === key && sortDir.value === 'desc' }
}
function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

const totalCount = computed(() => files.value.length)
const totalBytes = computed(() => files.value.reduce((s, f) => s + (f.size || 0), 0))
const imagesCount = computed(() => files.value.filter(f => normalizeType(f.type) === 'image').length)
const docsCount = computed(() => files.value.filter(f => ['pdf','doc','sheet','ppt','text'].includes(normalizeType(f.type))).length)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return files.value
  return files.value.filter(f =>
    (f.fileName || '').toLowerCase().includes(q) ||
    (f.type || '').toLowerCase().includes(q) ||
    (f.projectCode || '').toLowerCase().includes(q)
  )
})

const sortedRows = computed(() => {
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    let va = a[key], vb = b[key]
    if (key === 'uploadedAt') {
      va = va ? new Date(va).getTime() : 0
      vb = vb ? new Date(vb).getTime() : 0
    }
    if (typeof va === 'string') va = va.toLowerCase()
    if (typeof vb === 'string') vb = vb.toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

function normalizeType(t) {
  const s = (t || '').toLowerCase()
  if (/(jpg|jpeg|png|gif|bmp|svg|image|webp)/.test(s)) return 'image'
  if (/pdf/.test(s)) return 'pdf'
  if (/(doc|docx)/.test(s)) return 'doc'
  if (/(xls|xlsx|csv)/.test(s)) return 'sheet'
  if (/(ppt|pptx)/.test(s)) return 'ppt'
  if (/(dwg|cad|dxf|skp|rvt)/.test(s)) return 'cad'
  if (/(zip|rar|7z|tar|gz)/.test(s)) return 'archive'
  if (/(txt|md|rtf)/.test(s)) return 'text'
  return 'other'
}
function prettyType(t) {
  const map = { image: 'Image', pdf: 'PDF', doc: 'Document', sheet: 'Spreadsheet', ppt: 'Presentation', cad: 'CAD', archive: 'Archive', text: 'Text', other: 'File' }
  return map[normalizeType(t)] || 'File'
}
function fileTypeClass(t) { return normalizeType(t) }
function fileIconClass(t) { return 'ico-' + normalizeType(t) }
function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
function formatDate(v) {
  if (!v) return '—'
  const d = typeof v === 'string' ? new Date(v) : v
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

async function fetchFiles() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/files`)
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load files')
    files.value = json.data || []
  } catch (e) {
    error.value = e.message || 'Network error'
  } finally {
    loading.value = false
  }
}

async function fetchProjects() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/projects`)
    const json = await res.json()
    if (json.success) {
      projects.value = json.data || []
    }
  } catch (e) {
    console.error('Failed to fetch projects:', e)
  }
}

// Upload Modal Functions
function openUploadModal() {
  uploadForm.value = {
    fileName: '',
    projectId: '',
    description: '',
    file: null
  }
  showUploadModal.value = true
}

function closeUploadModal() {
  showUploadModal.value = false
  uploadForm.value = {
    fileName: '',
    projectId: '',
    description: '',
    file: null
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    uploadForm.value.file = file
    // Auto-fill file name if empty
    if (!uploadForm.value.fileName) {
      uploadForm.value.fileName = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) {
    uploadForm.value.file = file
    if (!uploadForm.value.fileName) {
      uploadForm.value.fileName = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

function removeFile() {
  uploadForm.value.file = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleUpload() {
  if (!canUpload.value) return

  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    formData.append('fileName', uploadForm.value.fileName.trim())
    formData.append('projectId', uploadForm.value.projectId)
    formData.append('description', uploadForm.value.description || '')
    
    // Get uploader info from localStorage
    const userData = localStorage.getItem('domus_user')
    if (userData) {
      const user = JSON.parse(userData)
      formData.append('uploadedBy', user.id || user.docId || '')
      formData.append('uploaderEmail', user.email || '')
    }

    const res = await fetch(`${API_BASE_URL}/api/admin/upload-file`, {
      method: 'POST',
      body: formData
    })

    const result = await res.json()

    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Upload failed')
    }

    showAlert('File uploaded successfully! Client has been notified.', 'success')
    closeUploadModal()
    await fetchFiles() // Refresh file list

  } catch (err) {
    showAlert(err.message || 'Failed to upload file', 'error')
  } finally {
    uploading.value = false
  }
}

function openView(f) {
  router.push({
    path: '/admin/file-view',
    query: {
      url: encodeURIComponent(f.fileUrl || f.url),
      name: f.fileName,
      type: f.type
    }
  })
}

function download(f) {
  const a = document.createElement('a')
  a.href = f.fileUrl || f.url
  a.download = f.fileName || 'file'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

onMounted(() => {
  fetchFiles()
  fetchProjects()
})
</script>

<style scoped>
.fd-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
}

.alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 4px 20px #00000022;
  animation: slideDown 0.3s ease;
}
.alert.success { background: #e6f7e6; color: #2e7d32; border: 1px solid #a5d6a7; }
.alert.error { background: #ffeaea; color: #c62828; border: 1px solid #ef9a9a; }

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.fd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.fd-header h2 { margin: 0; color: #213547; }
.fd-search {
  flex: 0 0 320px;
  max-width: 60vw;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fafafa;
  outline: none;
}
.fd-search:focus { border-color: #e6b23a; }

.fd-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}
.fd-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 12px #00000012;
  border: 1px solid #f0f0f0;
}
.fd-card .icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #f8f8f8;
}
.fd-card .icon svg { width: 28px; height: 28px; }
.fd-card .info { display: flex; flex-direction: column; }
.fd-card .label { color: #5a6675; font-weight: 600; font-size: .95rem; }
.fd-card .value { color: #213547; font-size: 1.6rem; font-weight: 800; }

.fd-card.total .icon   { background: #e3f0fc; }
.fd-card.images .icon  { background: #f6eaff; }
.fd-card.docs .icon    { background: #fff7e1; }
.fd-card.storage .icon { background: #eafaf0; }

.fd-table-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px #0000000f;
  border: 1px solid #f0f0f0;
  padding: 8px;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 6px 6px;
}
.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px #1976d244;
  transition: background 0.2s, transform 0.1s;
}
.upload-btn:hover { background: #1565c0; transform: translateY(-1px); }
.upload-btn:active { transform: translateY(0); }
.hint { color: #777; }
.error { color: #c62828; }

.table-wrap { overflow-x: auto; }
.fd-table { width: 100%; border-collapse: collapse; }
.fd-table thead th {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 2px solid #f0f0f0;
  font-weight: 700;
  color: #213547;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}
.sortable::after {
  content: '';
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 6px;
  vertical-align: middle;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #bbb;
  transition: transform 0.15s;
}
.sort-asc::after  { border-top: 6px solid #1976d2; transform: translateY(-2px) rotate(180deg); }
.sort-desc::after { border-top: 6px solid #1976d2; transform: translateY(-8px); }

.fd-table tbody td {
  padding: 12px 10px;
  border-bottom: 1px solid #f5f5f5;
  color: #213547;
}
.fd-table tbody tr:hover { background: #fafafa; }

.name-cell { display: flex; align-items: center; gap: 10px; }
.file-icon { width: 22px; height: 22px; border-radius: 4px; background: #e0e0e0; }
.file-icon.ico-image   { background: linear-gradient(135deg,#f0e7ff,#e6b23a33); }
.file-icon.ico-pdf     { background: #ef9a9a; }
.file-icon.ico-doc     { background: #90caf9; }
.file-icon.ico-sheet   { background: #a5d6a7; }
.file-icon.ico-ppt     { background: #ffcc80; }
.file-icon.ico-cad     { background: #b39ddb; }
.file-icon.ico-archive { background: #bdbdbd; }
.file-icon.ico-text    { background: #cfd8dc; }
.file-icon.ico-other   { background: #e0e0e0; }

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: .78rem;
  text-transform: uppercase;
  border: 1px solid transparent;
  white-space: nowrap;
}
.pill.image   { color:#6a0596; background:#f6eaff; border-color:#ead6ff; }
.pill.pdf     { color:#9c1f1f; background:#ffebee; border-color:#ffcdd2; }
.pill.doc     { color:#114f8f; background:#e3f0fc; border-color:#d2e6fa; }
.pill.sheet   { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }
.pill.ppt     { color:#9a4b00; background:#fff4e5; border-color:#ffe0b2; }
.pill.cad     { color:#4a148c; background:#f3e5f5; border-color:#e1bee7; }
.pill.archive { color:#5d4037; background:#efebe9; border-color:#d7ccc8; }
.pill.text    { color:#37474f; background:#eceff1; border-color:#cfd8dc; }
.pill.other   { color:#555; background:#f5f5f5; border-color:#e0e0e0; }

.center { text-align:center; }
.muted { color:#777; }
.mono { font-family: ui-monospace, Menlo, Consolas, Monaco, monospace; }
.ellipsis { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; vertical-align: bottom; }
.link-btn { display:inline-flex; align-items:center; gap:6px; background:transparent; border:none; color:#1976d2; cursor:pointer; font-weight:700; }
.link-btn:hover { text-decoration: underline; }
.actions { display:flex; gap:10px; }

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.upload-modal {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}
.close-btn:hover { background: #f5f5f5; color: #c62828; }

.upload-form {
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
  font-size: 0.95rem;
}

.required { color: #c62828; }

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

/* Dropzone */
.dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: #fafbff;
}

.dropzone:hover,
.dropzone.drag-over {
  border-color: #1976d2;
  background: #f0f7ff;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dropzone-content p {
  margin: 0;
  color: #213547;
}

.dropzone-content strong {
  color: #1976d2;
}

.file-types {
  font-size: 0.85rem;
  color: #888;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 10px;
}

.preview-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #e0e0e0;
}

.preview-info {
  flex: 1;
  text-align: left;
}

.preview-name {
  margin: 0 0 4px;
  font-weight: 600;
  color: #213547;
  word-break: break-all;
}

.preview-size {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.remove-file {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 6px;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}
.remove-file:hover { background: #ffebee; color: #c62828; }

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
  transition: background 0.2s;
}
.btn-cancel:hover { background: #f5f5f5; }

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  background: #1976d2;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  box-shadow: 0 4px 14px #1976d244;
}
.btn-upload:hover:not(:disabled) { background: #1565c0; }
.btn-upload:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .fd-cards { grid-template-columns: repeat(2, 1fr); }
  .fd-header { flex-direction: column; align-items: stretch; }
  .fd-search { flex: 1; max-width: 100%; }
}

@media (max-width: 560px) {
  .fd-cards { grid-template-columns: 1fr; }
  .upload-modal { width: 95%; max-width: none; }
}
</style>