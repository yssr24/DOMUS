<template>
  <div class="fd-wrap">
    <header class="fd-header">
      <h2>Files & Documents</h2>
      <input v-model="search" type="search" class="fd-search" placeholder="Search filename, project, uploader, type..." />
    </header>

    <!-- KPI Cards -->
    <section class="fd-cards">
      <div class="fd-card total">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M10 4l2 2h8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4z" fill="#1976d2"/></svg>
        </div>
        <div class="info">
          <div class="label">Total Files</div>
          <div class="value">{{ totalCount }}</div>
        </div>
      </div>

      <div class="fd-card images">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M21 5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5z" fill="#8e24aa"/><path d="M8 13l2.5-3 3.5 4L17 11l3 4" stroke="#fff" stroke-width="2" fill="none"/></svg>
        </div>
        <div class="info">
          <div class="label">Images</div>
          <div class="value">{{ imagesCount }}</div>
        </div>
      </div>

      <div class="fd-card docs">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#fbc02d"/><path d="M14 2v6h6" fill="#fff" opacity=".45"/></svg>
        </div>
        <div class="info">
          <div class="label">Documents</div>
          <div class="value">{{ docsCount }}</div>
        </div>
      </div>

      <div class="fd-card storage">
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="5" rx="2" fill="#43a047"/><rect x="3" y="10" width="18" height="5" rx="2" fill="#43a047"/><rect x="3" y="16" width="18" height="4" rx="2" fill="#43a047"/></svg>
        </div>
        <div class="info">
          <div class="label">Storage Used</div>
          <div class="value">{{ formatSize(totalBytes) }}</div>
        </div>
      </div>
    </section>

    <!-- Table -->
    <section class="fd-table-card">
      <div class="table-toolbar">
        <div class="left">
          <span class="hint" v-if="loading">Loading files…</span>
          <span class="error" v-else-if="error">{{ error }}</span>
          <span class="hint" v-else>{{ sortedRows.length }} of {{ totalCount }} shown</span>
        </div>
        <div class="right">
          <button class="upload-btn" @click="onUpload">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#fff" d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 9v7h14v-7h2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7h2z"/></svg>
            Upload
          </button>
        </div>
      </div>

      <div class="table-wrap">
        <table class="fd-table">
          <thead>
            <tr>
              <th @click="toggleSort('name')" :class="thClass('name')">File Name</th>
              <th @click="toggleSort('type')" :class="thClass('type')">Type</th>
              <th @click="toggleSort('project')" :class="thClass('project')">Project</th>
              <th @click="toggleSort('size')" :class="thClass('size')">Size</th>
              <th @click="toggleSort('uploadedBy')" :class="thClass('uploadedBy')">Uploaded By</th>
              <th @click="toggleSort('uploadedAt')" :class="thClass('uploadedAt')">Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!sortedRows.length && !loading">
              <td colspan="7" class="center muted">No files found.</td>
            </tr>
            <tr v-for="f in sortedRows" :key="f.id">
              <td class="name-cell">
                <span class="file-icon" :class="fileIconClass(f.type)"></span>
                <span class="ellipsis" :title="f.name">{{ f.name }}</span>
              </td>
              <td><span class="pill" :class="fileTypeClass(f.type)">{{ prettyType(f.type) }}</span></td>
              <td class="ellipsis" :title="f.project">{{ f.project }}</td>
              <td class="mono">{{ formatSize(f.size) }}</td>
              <td class="ellipsis" :title="f.uploadedBy">{{ f.uploadedBy }}</td>
              <td class="mono">{{ formatDate(f.uploadedAt) }}</td>
              <td>
              <button class="link-btn" @click.stop="openView(f)">
                View
              </button>
                <button class="link-btn" @click="download(f)">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 3v10m0 0l4-4m-4 4l-4-4M5 21h14" stroke="#1976d2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Download
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { API_BASE_URL } from '../../../config'
import { useRouter } from 'vue-router'


const files = ref([])
const loading = ref(false)
const error = ref('')

const search = ref('')
const sortKey = ref('uploadedAt')
const sortDir = ref('desc')

const router = useRouter()


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
    String(f.name).toLowerCase().includes(q) ||
    String(f.project).toLowerCase().includes(q) ||
    String(f.uploadedBy).toLowerCase().includes(q) ||
    String(f.type).toLowerCase().includes(q)
  )
})

const sortedRows = computed(() => {
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    let va = a[key]; let vb = b[key]
    if (key === 'uploadedAt') {
      const ta = va ? new Date(va).getTime() : 0
      const tb = vb ? new Date(vb).getTime() : 0
      return (ta - tb) * dir
    }
    if (key === 'size') {
      return ((va || 0) - (vb || 0)) * dir
    }
    va = (va ?? '').toString().toLowerCase()
    vb = (vb ?? '').toString().toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

function normalizeType(t) {
  const s = (t || '').toLowerCase()
  if (/(jpg|jpeg|png|gif|bmp|svg|image)/.test(s)) return 'image'
  if (/pdf/.test(s)) return 'pdf'
  if (/(doc|docx)/.test(s)) return 'doc'
  if (/(xls|xlsx|csv)/.test(s)) return 'sheet'
  if (/(ppt|pptx)/.test(s)) return 'ppt'
  if (/(dwg|cad|dxf|skp|rvt)/.test(s)) return 'cad'
  if (/(zip|rar|7z)/.test(s)) return 'archive'
  if (/(txt|md)/.test(s)) return 'text'
  return 'other'
}
function prettyType(t) {
  const m = {
    image: 'Image',
    pdf: 'PDF',
    doc: 'DOC',
    sheet: 'Sheet',
    ppt: 'Slides',
    cad: 'CAD',
    archive: 'Archive',
    text: 'Text',
    other: 'Other'
  }
  return m[normalizeType(t)]
}
function fileTypeClass(t) {
  const v = normalizeType(t)
  return {
    image: v === 'image',
    pdf: v === 'pdf',
    doc: v === 'doc',
    sheet: v === 'sheet',
    ppt: v === 'ppt',
    cad: v === 'cad',
    archive: v === 'archive',
    text: v === 'text',
    other: v === 'other',
  }
}
function fileIconClass(t) {
  return 'ico-' + normalizeType(t)
}
function formatSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`
}
function formatDate(v) {
  if (!v) return '—'
  const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v
  return d.toLocaleDateString()
}

async function fetchFiles() {
  loading.value = true; error.value = ''
  try {
    const r = await fetch(`${API_BASE_URL}/api/admin/files`)
    const j = await r.json()
    if (!r.ok || !j.success) throw new Error(j.message || 'Failed to load files')
    files.value = (j.data || []).map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      uploadedAt: f.uploadedAt,
      path: f.path // Storage path, e.g., fil/mydoc.pdf
    }))
  } catch (e) { error.value = e.message || 'Network error' }
  finally { loading.value = false }
}

function onUpload() {
  alert('Upload clicked (hook up your modal or uploader here)')
}
function openView(f) {
  const url = `${API_BASE_URL}/api/admin/file?path=${encodeURIComponent(f.path)}&disposition=inline`
  router.push({
    path: '/admin/file-view',
    query: { url: encodeURIComponent(url), name: f.name, type: f.type }
  })
}

function download(f) {
  const url = `${API_BASE_URL}/api/admin/file?path=${encodeURIComponent(f.path)}&disposition=attachment`
  window.open(url, '_blank')
}

onMounted(fetchFiles)
</script>

<style scoped>
.fd-wrap {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
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
  margin-bottom: 16px;
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
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 6px 6px 6px;
}
.upload-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: #1976d2; color: #fff; border: none; border-radius: 10px;
  padding: 8px 12px; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 20px #1976d244;
}
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
  user-select: none;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
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

.fd-table tbody td {
  padding: 12px 10px;
  border-bottom: 1px solid #f5f5f5;
  color: #213547;
  vertical-align: middle;
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
.actions { display:flex; gap:10px; }

@media (max-width: 900px) {
  .fd-cards { grid-template-columns: repeat(2, 1fr); }
  .fd-search { flex: 1; min-width: 0; }
}
@media (max-width: 560px) {
  .fd-cards { grid-template-columns: 1fr; }
  .ellipsis { max-width: 140px; }
}
</style>