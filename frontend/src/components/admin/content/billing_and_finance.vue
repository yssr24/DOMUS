<template>
  <div class="bf-wrap">
    <!-- Alert -->
    <div v-if="alertMsg" :class="['alert', alertType]">{{ alertMsg }}</div>

    <header class="bf-header">
      <h2>Billing & Finance</h2>
      <div class="header-actions">
        <button class="upload-btn" @click="openUploadModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Invoice
        </button>
        <input
          v-model="search"
          class="bf-search"
          type="text"
          placeholder="Search invoices..."
        />
      </div>
    </header>

    <!-- KPI Cards -->
    <section class="bf-cards">
      <div class="bf-card revenue">
        <div class="icon">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="info">
          <span class="label">Revenue This Month</span>
          <span class="value">{{ currency(totalRevenueThisMonth) }}</span>
        </div>
      </div>
      <div class="bf-card outstanding">
        <div class="icon">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="#1976d2" stroke-width="2"/>
            <path d="M3 10h18" stroke="#1976d2" stroke-width="2"/>
          </svg>
        </div>
        <div class="info">
          <span class="label">Outstanding</span>
          <span class="value">{{ currency(outstandingAmount) }}</span>
        </div>
      </div>
      <div class="bf-card paid">
        <div class="icon">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#8e24aa" stroke-width="2" stroke-linecap="round"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke="#8e24aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="info">
          <span class="label">Paid This Month</span>
          <span class="value">{{ currency(paidThisMonth) }}</span>
        </div>
      </div>
      <div class="bf-card overdue">
        <div class="icon">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#e6b23a" stroke-width="2"/>
            <path d="M12 6v6l4 2" stroke="#e6b23a" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="info">
          <span class="label">Overdue ({{ overdueCount }})</span>
          <span class="value">{{ currency(overdueAmount) }}</span>
        </div>
      </div>
    </section>

    <!-- Charts -->
    <section class="bf-charts">
      <div class="chart-card">
        <h3>Monthly Revenue</h3>
        <apexchart type="area" height="220" :options="revOptions" :series="revSeries" />
      </div>
      <div class="chart-card">
        <h3>Invoice Status</h3>
        <apexchart type="donut" height="220" :options="statusOptions" :series="statusSeries" />
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading invoices...</p>
    </div>

    <!-- Invoice Table -->
    <section v-else class="bf-table-card">
      <div class="table-toolbar">
        <h3>Invoices</h3>
        <span class="hint">Click headers to sort</span>
      </div>
      <div class="table-wrap">
        <table class="bf-table">
          <thead>
            <tr>
              <th :class="thClass('number')" @click="toggleSort('number')">Invoice #</th>
              <th :class="thClass('projectName')" @click="toggleSort('projectName')">Project</th>
              <th :class="thClass('vendor')" @click="toggleSort('vendor')">Vendor</th>
              <th :class="thClass('amount')" @click="toggleSort('amount')">Amount</th>
              <th :class="thClass('dueDate')" @click="toggleSort('dueDate')">Due Date</th>
              <th :class="thClass('status')" @click="toggleSort('status')">Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!sortedRows.length">
              <td colspan="7" class="center muted">No invoices found.</td>
            </tr>
            <tr v-for="inv in sortedRows" :key="inv.id">
              <td class="mono">{{ inv.number || inv.invoiceNumber || '—' }}</td>
              <td class="ellipsis">{{ inv.projectName || '—' }}</td>
              <td class="ellipsis">{{ inv.vendor || '—' }}</td>
              <td>{{ currency(inv.amount || inv.totalAmount) }}</td>
              <td>{{ formatDate(inv.dueDate) }}</td>
              <td>
                <span :class="['pill', statusClass(inv.status)]">{{ inv.status || 'pending' }}</span>
              </td>
              <td class="actions">
                <button v-if="inv.status !== 'paid'" class="link-btn ok" @click="markPaid(inv)">Mark Paid</button>
                <button class="link-btn" @click="viewInvoice(inv)">View</button>
                <button class="link-btn" @click="download(inv)">Download</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
      <div class="upload-modal">
        <div class="modal-header">
          <h3>Upload Invoice</h3>
          <button class="close-btn" @click="closeUploadModal">&times;</button>
        </div>

        <div class="upload-form">
          <!-- Project Selection -->
          <div class="form-group">
            <label>Project <span class="required">*</span></label>
            <select v-model="uploadForm.projectId" :disabled="loadingProjects">
              <option value="" disabled>Select a project</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">
                {{ p.code || p.projectCode }} - {{ p.title || p.projectTitle }}
              </option>
            </select>
          </div>

          <!-- Vendor Name (optional) -->
          <div class="form-group">
            <label>Vendor Name</label>
            <input v-model="uploadForm.vendor" type="text" placeholder="e.g., ABC Suppliers" />
          </div>

          <!-- File Upload -->
          <div class="form-group">
            <label>Invoice File <span class="required">*</span></label>
            <div 
              class="dropzone"
              :class="{ 'drag-over': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
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
                <span class="file-types">PDF, JPG, PNG (max 10MB)</span>
              </div>
              <div v-else class="file-preview">
                <div class="preview-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div class="preview-info">
                  <span class="preview-name">{{ uploadForm.file.name }}</span>
                  <span class="preview-size">{{ formatFileSize(uploadForm.file.size) }}</span>
                </div>
                <button class="remove-file" @click.stop="removeFile">&times;</button>
              </div>
            </div>
          </div>

          <!-- Processing Info -->
          <div class="processing-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <span>Invoice will be automatically parsed to extract amount, date, and vendor info.</span>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button class="btn-cancel" @click="closeUploadModal">Cancel</button>
            <button 
              class="btn-upload" 
              :disabled="!canUpload || uploading"
              @click="handleUpload"
            >
              <span v-if="uploading" class="spinner-small"></span>
              <span v-else>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </span>
              {{ uploading ? 'Uploading...' : 'Upload & Process' }}
            </button>
          </div>
        </div>

        <!-- Processing Status -->
        <div v-if="processingStatus" class="processing-status">
          <div class="status-icon" :class="processingStatus.type">
            <svg v-if="processingStatus.type === 'loading'" class="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"/>
            </svg>
            <svg v-else-if="processingStatus.type === 'success'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#43a047" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c62828" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="status-text">
            <strong>{{ processingStatus.title }}</strong>
            <span>{{ processingStatus.message }}</span>
          </div>
        </div>

        <!-- Parsed Data Preview -->
        <div v-if="parsedData" class="parsed-preview">
          <h4>Extracted Invoice Data</h4>
          <div class="parsed-grid">
            <div class="parsed-item">
              <label>Invoice Number</label>
              <span>{{ parsedData.invoiceNumber || '—' }}</span>
            </div>
            <div class="parsed-item">
              <label>Vendor</label>
              <span>{{ parsedData.vendor || uploadForm.vendor || '—' }}</span>
            </div>
            <div class="parsed-item">
              <label>Total Amount</label>
              <span class="amount">{{ currency(parsedData.totalAmount) }}</span>
            </div>
            <div class="parsed-item">
              <label>Invoice Date</label>
              <span>{{ formatDate(parsedData.invoiceDate) }}</span>
            </div>
            <div class="parsed-item">
              <label>Due Date</label>
              <span>{{ formatDate(parsedData.dueDate) }}</span>
            </div>
            <div class="parsed-item full">
              <label>Line Items</label>
              <span>{{ parsedData.lineItems?.length || 0 }} items detected</span>
            </div>
          </div>
          <div class="parsed-actions">
            <button class="btn-save" @click="saveInvoice">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { API_BASE_URL } from '../../../config'

// Alert
const alertMsg = ref('')
const alertType = ref('success')

function showAlert(msg, type = 'success') {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 4000)
}

// Search + sort
const search = ref('')
const sortKey = ref('createdAt')
const sortDir = ref('desc')

// Data
const invoices = ref([])
const projects = ref([])
const loading = ref(false)
const loadingProjects = ref(false)

// Upload modal state
const showUploadModal = ref(false)
const uploading = ref(false)
const isDragging = ref(false)
const fileInput = ref(null)
const processingStatus = ref(null)
const parsedData = ref(null)

const uploadForm = ref({
  projectId: '',
  vendor: '',
  file: null
})

// Computed
const canUpload = computed(() => {
  return uploadForm.value.projectId && uploadForm.value.file
})

// KPIs
const now = new Date()
const isSameMonth = (d1, d2 = now) => {
  if (!d1) return false
  const date = new Date(d1)
  return date.getMonth() === d2.getMonth() && date.getFullYear() === d2.getFullYear()
}

const totalRevenueThisMonth = computed(() =>
  invoices.value.filter(i => i.status === 'paid' && isSameMonth(i.paidDate)).reduce((s, i) => s + (i.amount || i.totalAmount || 0), 0)
)
const outstandingAmount = computed(() =>
  invoices.value.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + (i.amount || i.totalAmount || 0), 0)
)
const paidThisMonth = computed(() =>
  invoices.value.filter(i => i.status === 'paid' && isSameMonth(i.paidDate)).reduce((s, i) => s + (i.amount || i.totalAmount || 0), 0)
)
const overdueCount = computed(() => invoices.value.filter(i => i.status === 'overdue').length)
const overdueAmount = computed(() => invoices.value.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.amount || i.totalAmount || 0), 0))

// Charts
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const revSeries = ref([{ name: 'Revenue', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }])
const revOptions = ref({
  chart: { toolbar: { show: false } },
  xaxis: { categories: months },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  colors: ['#1976d2'],
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] } },
  tooltip: { y: { formatter: val => currency(val) } }
})

const statusSeries = computed(() => {
  const paid = invoices.value.filter(i => i.status === 'paid').length
  const pending = invoices.value.filter(i => i.status === 'pending').length
  const overdue = invoices.value.filter(i => i.status === 'overdue').length
  const draft = invoices.value.filter(i => i.status === 'draft').length
  return [pending, overdue, paid, draft]
})
const statusOptions = ref({
  labels: ['Pending', 'Overdue', 'Paid', 'Draft'],
  colors: ['#1976d2', '#e6b23a', '#43a047', '#bdbdbd'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true }
})

// Table helpers
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return invoices.value
  return invoices.value.filter(i =>
    (i.number || i.invoiceNumber || '').toLowerCase().includes(q) ||
    (i.projectName || '').toLowerCase().includes(q) ||
    (i.vendor || '').toLowerCase().includes(q) ||
    (i.status || '').toLowerCase().includes(q)
  )
})

function thClass(key) {
  return { 
    sortable: true, 
    'sort-asc': sortKey.value === key && sortDir.value === 'asc', 
    'sort-desc': sortKey.value === key && sortDir.value === 'desc' 
  }
}

function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filtered.value].sort((a, b) => {
    const aVal = a[key] ?? ''
    const bVal = b[key] ?? ''
    if (key === 'amount' || key === 'totalAmount') {
      return ((a.amount || a.totalAmount || 0) - (b.amount || b.totalAmount || 0)) * dir
    }
    if (key === 'dueDate' || key === 'createdAt') {
      return (new Date(aVal) - new Date(bVal)) * dir
    }
    return String(aVal).localeCompare(String(bVal)) * dir
  })
})

function statusClass(s) {
  return {
    paid: s === 'paid',
    pending: s === 'pending',
    overdue: s === 'overdue',
    draft: s === 'draft',
    cancelled: s === 'cancelled'
  }
}

function currency(v) {
  try { 
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP', 
      maximumFractionDigits: 2 
    }).format(v || 0) 
  } catch { 
    return `₱${(v || 0).toLocaleString()}` 
  }
}

function formatDate(v) {
  if (!v) return '—'
  const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Fetch data
async function fetchInvoices() {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/invoices`)
    const json = await res.json()
    if (json.success) {
      invoices.value = json.data || []
      updateRevenueChart()
    }
  } catch (e) {
    console.error('Failed to fetch invoices:', e)
  } finally {
    loading.value = false
  }
}

async function fetchProjects() {
  loadingProjects.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/projects`)
    const json = await res.json()
    if (json.success) {
      projects.value = json.data || []
    }
  } catch (e) {
    console.error('Failed to fetch projects:', e)
  } finally {
    loadingProjects.value = false
  }
}

function updateRevenueChart() {
  const monthlyRevenue = new Array(12).fill(0)
  const currentYear = new Date().getFullYear()
  
  invoices.value.forEach(inv => {
    if (inv.status === 'paid' && inv.paidDate) {
      const d = new Date(inv.paidDate)
      if (d.getFullYear() === currentYear) {
        monthlyRevenue[d.getMonth()] += (inv.amount || inv.totalAmount || 0)
      }
    }
  })
  
  revSeries.value = [{ name: 'Revenue', data: monthlyRevenue }]
}

// Upload Modal Functions
function openUploadModal() {
  showUploadModal.value = true
  uploadForm.value = { projectId: '', vendor: '', file: null }
  processingStatus.value = null
  parsedData.value = null
  if (projects.value.length === 0) fetchProjects()
}

function closeUploadModal() {
  showUploadModal.value = false
  uploadForm.value = { projectId: '', vendor: '', file: null }
  processingStatus.value = null
  parsedData.value = null
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      showAlert('File size must be less than 10MB', 'error')
      return
    }
    uploadForm.value.file = file
  }
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      showAlert('Only PDF, JPG, and PNG files are allowed', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showAlert('File size must be less than 10MB', 'error')
      return
    }
    uploadForm.value.file = file
  }
}

function removeFile() {
  uploadForm.value.file = null
  if (fileInput.value) fileInput.value.value = ''
}

async function handleUpload() {
  if (!canUpload.value) return
  
  uploading.value = true
  processingStatus.value = {
    type: 'loading',
    title: 'Uploading...',
    message: 'Uploading invoice file to server'
  }
  
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    formData.append('projectId', uploadForm.value.projectId)
    formData.append('vendor', uploadForm.value.vendor)
    
    // Get admin ID
    const userData = localStorage.getItem('domus_user')
    if (userData) {
      const user = JSON.parse(userData)
      formData.append('uploadedBy', user.id || user.docId || user.userId)
    }
    
    const res = await fetch(`${API_BASE_URL}/api/admin/upload-invoice`, {
      method: 'POST',
      body: formData
    })
    
    const json = await res.json()
    
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Upload failed')
    }
    
    processingStatus.value = {
      type: 'loading',
      title: 'Processing...',
      message: 'Extracting invoice data using AI'
    }
    
    // Poll for parsed data
    await pollForParsedData(json.invoiceId)
    
  } catch (e) {
    processingStatus.value = {
      type: 'error',
      title: 'Upload Failed',
      message: e.message || 'Failed to upload invoice'
    }
  } finally {
    uploading.value = false
  }
}

async function pollForParsedData(invoiceId, attempts = 0) {
  if (attempts > 30) { // 30 seconds timeout
    processingStatus.value = {
      type: 'success',
      title: 'Upload Complete',
      message: 'Invoice uploaded. Parsing may take a moment.'
    }
    parsedData.value = { invoiceId, status: 'processing' }
    return
  }
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/invoice/${invoiceId}`)
    const json = await res.json()
    
    if (json.success && json.data) {
      if (json.data.parsed || json.data.totalAmount) {
        processingStatus.value = {
          type: 'success',
          title: 'Processing Complete',
          message: 'Invoice data extracted successfully'
        }
        parsedData.value = json.data
        return
      }
    }
    
    // Wait 1 second and try again
    await new Promise(resolve => setTimeout(resolve, 1000))
    await pollForParsedData(invoiceId, attempts + 1)
    
  } catch (e) {
    // Continue polling
    await new Promise(resolve => setTimeout(resolve, 1000))
    await pollForParsedData(invoiceId, attempts + 1)
  }
}

async function saveInvoice() {
  if (!parsedData.value) return
  
  try {
    showAlert('Invoice saved successfully!', 'success')
    closeUploadModal()
    await fetchInvoices()
  } catch (e) {
    showAlert('Failed to save invoice', 'error')
  }
}

async function markPaid(inv) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/invoice/${inv.id}/mark-paid`, {
      method: 'POST'
    })
    const json = await res.json()
    if (json.success) {
      inv.status = 'paid'
      inv.paidDate = new Date().toISOString()
      showAlert('Invoice marked as paid', 'success')
      updateRevenueChart()
    }
  } catch (e) {
    showAlert('Failed to update invoice', 'error')
  }
}

function viewInvoice(inv) {
  if (inv.fileUrl) {
    window.open(inv.fileUrl, '_blank')
  }
}

function download(inv) {
  if (inv.fileUrl) {
    const a = document.createElement('a')
    a.href = inv.fileUrl
    a.download = inv.fileName || `invoice-${inv.number || inv.id}.pdf`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}

onMounted(() => {
  fetchInvoices()
  fetchProjects()
})
</script>

<script>
export default {
  components: {
    apexchart: VueApexCharts
  }
}
</script>

<style scoped>
.bf-wrap {
  width: 100%;
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

.bf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.bf-header h2 { margin: 0; color: #213547; }

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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
  transition: all 0.2s;
  box-shadow: 0 4px 14px #1976d244;
}
.upload-btn:hover {
  background: #1565c0;
  transform: translateY(-1px);
}

.bf-search {
  flex: 0 0 280px;
  max-width: 60vw;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fafafa;
  outline: none;
}
.bf-search:focus { border-color: #e6b23a; }

.bf-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.bf-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 12px #00000012;
  border: 1px solid #f0f0f0;
}
.bf-card .icon { width: 56px; height: 56px; border-radius: 12px; display: grid; place-items: center; background:#f8f8f8; }
.bf-card .info { display: flex; flex-direction: column; }
.bf-card .label { color: #5a6675; font-weight: 600; font-size: .95rem; }
.bf-card .value { color: #213547; font-size: 1.6rem; font-weight: 800; }
.bf-card.revenue .icon     { background:#eafaf0; }
.bf-card.outstanding .icon { background:#e3f0fc; }
.bf-card.paid .icon        { background:#f6eaff; }
.bf-card.overdue .icon     { background:#fff7e1; }

.bf-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}
.chart-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 2px 12px #00000010;
  padding: 16px;
}
.chart-card h3 { margin:0 0 10px; color:#213547; font-size:1.1rem; }

.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.bf-table-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px #0000000f;
  border: 1px solid #f0f0f0;
  padding: 8px;
}
.table-toolbar { display:flex; justify-content:space-between; align-items:center; padding:8px 6px 6px; }
.table-toolbar h3 { margin: 0; color: #213547; }
.hint { color:#777; }

.table-wrap { overflow-x:auto; }
.bf-table { width:100%; border-collapse:collapse; }
.bf-table thead th {
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

.bf-table tbody td { padding:12px 10px; border-bottom:1px solid #f5f5f5; color:#213547; }
.bf-table tbody tr:hover { background:#fafafa; }

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: .78rem;
  text-transform: uppercase;
  border: 1px solid transparent;
  white-space: nowrap;
}
.pill.paid     { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }
.pill.pending  { color:#114f8f; background:#e3f0fc; border-color:#d2e6fa; }
.pill.overdue  { color:#9a4b00; background:#fff4e5; border-color:#ffe0b2; }
.pill.draft    { color:#555; background:#f5f5f5; border-color:#e0e0e0; }
.pill.cancelled{ color:#9c1f1f; background:#ffebee; border-color:#ffcdd2; }

.actions { display:flex; gap:10px; }
.link-btn { background:transparent; border:none; color:#1976d2; font-weight:700; cursor:pointer; }
.link-btn:hover { text-decoration: underline; }
.link-btn.ok { color:#2e7d32; }
.center { text-align:center; }
.muted { color:#777; }
.mono { font-family: ui-monospace, Menlo, Consolas, Monaco, monospace; }
.ellipsis { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
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
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.modal-header h3 { margin: 0; color: #213547; }
.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #888;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
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
}
.required { color: #c62828; }

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}
.form-group input:focus,
.form-group select:focus {
  border-color: #1976d2;
}

.dropzone {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
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
  gap: 12px;
}
.dropzone-content p { margin: 0; color: #333; }
.dropzone-content strong { color: #1976d2; }
.file-types { font-size: 0.85rem; color: #888; }

.file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 10px;
}
.preview-icon {
  width: 48px;
  height: 48px;
  background: #e3f0fc;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-info { flex: 1; text-align: left; }
.preview-name { display: block; font-weight: 600; color: #213547; word-break: break-all; }
.preview-size { font-size: 0.85rem; color: #888; }
.remove-file {
  background: none;
  border: none;
  font-size: 24px;
  color: #888;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.remove-file:hover { background: #ffebee; color: #c62828; }

.processing-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: #e3f0fc;
  border-radius: 10px;
  margin-bottom: 20px;
}
.processing-info span { font-size: 0.9rem; color: #1976d2; }

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.btn-cancel {
  padding: 12px 20px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
}
.btn-cancel:hover { background: #e8e8e8; }

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-upload:hover { background: #1565c0; }
.btn-upload:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.processing-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
}
.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-icon.loading { background: #e3f0fc; }
.status-icon.success { background: #e8f5e9; }
.status-icon.error { background: #ffebee; }
.status-icon .spin { animation: spin 1s linear infinite; }

.status-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.status-text strong { color: #213547; }
.status-text span { font-size: 0.9rem; color: #666; }

.parsed-preview {
  padding: 24px;
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
}
.parsed-preview h4 { margin: 0 0 16px; color: #213547; }

.parsed-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.parsed-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.parsed-item.full { grid-column: 1 / -1; }
.parsed-item label { font-size: 0.8rem; color: #888; text-transform: uppercase; font-weight: 600; }
.parsed-item span { color: #213547; font-weight: 500; }
.parsed-item .amount { font-size: 1.2rem; font-weight: 700; color: #1976d2; }

.parsed-actions {
  display: flex;
  justify-content: flex-end;
}
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #43a047;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save:hover { background: #388e3c; }

@media (max-width: 900px) {
  .bf-cards { grid-template-columns: repeat(2, 1fr); }
  .bf-charts { grid-template-columns: 1fr; }
  .header-actions { flex-wrap: wrap; }
}

@media (max-width: 560px) {
  .bf-cards { grid-template-columns: 1fr; }
  .bf-header { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; }
  .bf-search { flex: 1; max-width: 100%; }
  .parsed-grid { grid-template-columns: 1fr; }
}
</style>