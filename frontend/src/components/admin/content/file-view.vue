<template>
  <div class="file-view-wrap">
    <!-- Header -->
    <header class="fv-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Files
      </button>
      <div class="file-info">
        <span :class="['file-icon', fileIconClass]"></span>
        <div class="file-meta">
          <h2>{{ fileName }}</h2>
          <span class="file-type">{{ prettyType }}</span>
        </div>
      </div>
      <div class="actions">
        <button class="action-btn download" @click="downloadFile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
        <button class="action-btn print" @click="printFile" v-if="canPrint">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner-large"></div>
      <p>Loading file...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c62828" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Failed to load file</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadFile">Try Again</button>
    </div>

    <!-- File Content -->
    <div v-else class="file-content">
      <!-- Image Viewer -->
      <div v-if="isImage" class="image-viewer">
        <div class="image-controls">
          <button @click="zoomOut" :disabled="zoom <= 0.25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
          <button @click="zoomIn" :disabled="zoom >= 3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <button @click="resetZoom">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            Reset
          </button>
          <button @click="rotateImage">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Rotate
          </button>
        </div>
        <div class="image-container" ref="imageContainer">
          <img 
            :src="fileUrl" 
            :alt="fileName"
            :style="imageStyle"
            @load="onImageLoad"
            @error="onImageError"
          />
        </div>
      </div>

      <!-- PDF Viewer -->
      <div v-else-if="isPdf" class="pdf-viewer">
        <iframe 
          :src="pdfViewerUrl" 
          frameborder="0"
          class="pdf-frame"
        ></iframe>
      </div>

      <!-- Document Viewer (DOC, DOCX, XLS, XLSX, PPT, PPTX) -->
      <div v-else-if="isOfficeDoc" class="office-viewer">
        <iframe 
          :src="officeViewerUrl" 
          frameborder="0"
          class="office-frame"
        ></iframe>
      </div>

      <!-- Text/Code Viewer -->
      <div v-else-if="isText" class="text-viewer">
        <pre class="text-content">{{ textContent }}</pre>
      </div>

      <!-- CAD Preview -->
      <div v-else-if="isCad" class="cad-viewer">
        <div class="unsupported-preview">
          <span class="cad-icon"></span>
          <h3>CAD File</h3>
          <p>{{ fileName }}</p>
          <p class="hint">CAD files cannot be previewed in browser. Please download to view.</p>
          <button class="download-btn-large" @click="downloadFile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download File
          </button>
        </div>
      </div>

      <!-- Unsupported File Type -->
      <div v-else class="unsupported-viewer">
        <div class="unsupported-preview">
          <span :class="['file-icon-large', fileIconClass]"></span>
          <h3>Preview not available</h3>
          <p>{{ fileName }}</p>
          <p class="hint">This file type cannot be previewed in browser.</p>
          <button class="download-btn-large" @click="downloadFile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download File
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '../../../config'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const textContent = ref('')
const zoom = ref(1)
const rotation = ref(0)

// Get file info from query params
const fileUrl = computed(() => {
  const url = route.query.url
  return url ? decodeURIComponent(url) : ''
})

const fileName = computed(() => route.query.name || 'Unknown File')
const fileType = computed(() => (route.query.type || '').toLowerCase())

// File type detection
const normalizedType = computed(() => {
  const t = fileType.value
  const name = fileName.value.toLowerCase()
  const ext = name.split('.').pop()
  
  if (/(jpg|jpeg|png|gif|bmp|svg|webp|image)/.test(t) || /(jpg|jpeg|png|gif|bmp|svg|webp)/.test(ext)) return 'image'
  if (/pdf/.test(t) || ext === 'pdf') return 'pdf'
  if (/(doc|docx)/.test(t) || /(doc|docx)/.test(ext)) return 'doc'
  if (/(xls|xlsx|csv|sheet)/.test(t) || /(xls|xlsx|csv)/.test(ext)) return 'sheet'
  if (/(ppt|pptx)/.test(t) || /(ppt|pptx)/.test(ext)) return 'ppt'
  if (/(dwg|dxf|cad|skp|rvt)/.test(t) || /(dwg|dxf|skp|rvt)/.test(ext)) return 'cad'
  if (/(txt|md|rtf|text|json|xml|html|css|js)/.test(t) || /(txt|md|rtf|json|xml|html|css|js)/.test(ext)) return 'text'
  if (/(zip|rar|7z|tar|gz|archive)/.test(t) || /(zip|rar|7z|tar|gz)/.test(ext)) return 'archive'
  return 'other'
})

const isImage = computed(() => normalizedType.value === 'image')
const isPdf = computed(() => normalizedType.value === 'pdf')
const isOfficeDoc = computed(() => ['doc', 'sheet', 'ppt'].includes(normalizedType.value))
const isText = computed(() => normalizedType.value === 'text')
const isCad = computed(() => normalizedType.value === 'cad')
const canPrint = computed(() => isImage.value || isPdf.value)

const prettyType = computed(() => {
  const map = {
    image: 'Image',
    pdf: 'PDF Document',
    doc: 'Word Document',
    sheet: 'Spreadsheet',
    ppt: 'Presentation',
    cad: 'CAD File',
    text: 'Text File',
    archive: 'Archive',
    other: 'File'
  }
  return map[normalizedType.value] || 'File'
})

const fileIconClass = computed(() => 'ico-' + normalizedType.value)

// Image controls
const imageStyle = computed(() => ({
  transform: `scale(${zoom.value}) rotate(${rotation.value}deg)`,
  transition: 'transform 0.2s ease'
}))

function zoomIn() {
  if (zoom.value < 3) zoom.value = Math.min(3, zoom.value + 0.25)
}

function zoomOut() {
  if (zoom.value > 0.25) zoom.value = Math.max(0.25, zoom.value - 0.25)
}

function resetZoom() {
  zoom.value = 1
  rotation.value = 0
}

function rotateImage() {
  rotation.value = (rotation.value + 90) % 360
}

// PDF viewer URL (using browser's built-in PDF viewer or Google Docs)
const pdfViewerUrl = computed(() => {
  if (!fileUrl.value) return ''
  // Try direct URL first - most browsers can render PDFs
  return fileUrl.value
})

// Office document viewer (using Google Docs Viewer)
const officeViewerUrl = computed(() => {
  if (!fileUrl.value) return ''
  // Use Google Docs Viewer for Office files
  return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl.value)}&embedded=true`
})

// Load file
async function loadFile() {
  if (!fileUrl.value) {
    error.value = 'No file URL provided'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''

  try {
    // For text files, fetch content
    if (isText.value) {
      const response = await fetch(fileUrl.value)
      if (!response.ok) throw new Error('Failed to load file')
      textContent.value = await response.text()
    }
    
    // For other files, just verify they're accessible
    // Images and PDFs will load in their respective viewers
    loading.value = false
  } catch (err) {
    error.value = err.message || 'Failed to load file'
    loading.value = false
  }
}

function onImageLoad() {
  loading.value = false
}

function onImageError() {
  error.value = 'Failed to load image'
  loading.value = false
}

function goBack() {
  router.push('/admin/files')
}

function downloadFile() {
  if (!fileUrl.value) return
  const a = document.createElement('a')
  a.href = fileUrl.value
  a.download = fileName.value
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function printFile() {
  if (isImage.value) {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head><title>Print - ${fileName.value}</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
          <img src="${fileUrl.value}" style="max-width:100%;max-height:100vh;" />
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  } else if (isPdf.value) {
    window.open(fileUrl.value, '_blank')
  }
}

onMounted(() => {
  if (!fileUrl.value) {
    error.value = 'No file URL provided'
    loading.value = false
  } else if (!isText.value) {
    // For non-text files, set loading false after a brief delay
    // to allow iframes/images to start loading
    setTimeout(() => {
      if (loading.value) loading.value = false
    }, 1000)
  } else {
    loadFile()
  }
})
</script>

<style scoped>
.file-view-wrap {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* Header */
.fv-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 16px;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.back-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
  color: #333;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e0e0e0;
}
.file-icon.ico-image   { background: linear-gradient(135deg, #f0e7ff, #e6b23a33); }
.file-icon.ico-pdf     { background: #ef9a9a; }
.file-icon.ico-doc     { background: #90caf9; }
.file-icon.ico-sheet   { background: #a5d6a7; }
.file-icon.ico-ppt     { background: #ffcc80; }
.file-icon.ico-cad     { background: #b39ddb; }
.file-icon.ico-archive { background: #bdbdbd; }
.file-icon.ico-text    { background: #cfd8dc; }
.file-icon.ico-other   { background: #e0e0e0; }

.file-meta h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #213547;
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-type {
  font-size: 0.85rem;
  color: #666;
}

.actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn.download {
  background: #1976d2;
  color: #fff;
}
.action-btn.download:hover { background: #1565c0; }
.action-btn.print {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
}
.action-btn.print:hover { background: #eee; }

/* Loading */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #666;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error */
.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 40px;
}
.error-container h3 { margin: 0; color: #c62828; }
.error-container p { margin: 0; color: #666; }

.retry-btn {
  margin-top: 12px;
  padding: 10px 24px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.retry-btn:hover { background: #1565c0; }

/* File Content */
.file-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Image Viewer */
.image-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
}

.image-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #2d2d2d;
  border-bottom: 1px solid #444;
}

.image-controls button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #444;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.image-controls button:hover:not(:disabled) { background: #555; }
.image-controls button:disabled { opacity: 0.5; cursor: not-allowed; }

.zoom-level {
  padding: 0 12px;
  color: #fff;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
}

.image-container img {
  max-width: 100%;
  max-height: calc(100vh - 200px);
  object-fit: contain;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  border-radius: 4px;
}

/* PDF Viewer */
.pdf-viewer {
  flex: 1;
  display: flex;
}

.pdf-frame {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 80px);
  border: none;
  background: #525659;
}

/* Office Viewer */
.office-viewer {
  flex: 1;
  display: flex;
}

.office-frame {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 80px);
  border: none;
  background: #f5f5f5;
}

/* Text Viewer */
.text-viewer {
  flex: 1;
  padding: 24px;
  background: #fff;
  overflow: auto;
}

.text-content {
  margin: 0;
  padding: 20px;
  background: #282c34;
  color: #abb2bf;
  border-radius: 8px;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* CAD & Unsupported Viewer */
.cad-viewer,
.unsupported-viewer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.unsupported-preview {
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.unsupported-preview h3 {
  margin: 16px 0 8px;
  color: #213547;
}

.unsupported-preview p {
  margin: 0 0 8px;
  color: #666;
}

.unsupported-preview .hint {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 20px;
}

.file-icon-large,
.cad-icon {
  display: inline-block;
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: #e0e0e0;
}
.file-icon-large.ico-image   { background: linear-gradient(135deg, #f0e7ff, #e6b23a33); }
.file-icon-large.ico-pdf     { background: #ef9a9a; }
.file-icon-large.ico-doc     { background: #90caf9; }
.file-icon-large.ico-sheet   { background: #a5d6a7; }
.file-icon-large.ico-ppt     { background: #ffcc80; }
.file-icon-large.ico-cad     { background: #b39ddb; }
.file-icon-large.ico-archive { background: #bdbdbd; }
.file-icon-large.ico-text    { background: #cfd8dc; }
.cad-icon { background: #b39ddb; }

.download-btn-large {
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
  box-shadow: 0 4px 14px rgba(25,118,210,0.3);
  transition: background 0.2s;
}
.download-btn-large:hover { background: #1565c0; }

@media (max-width: 768px) {
  .fv-header {
    flex-wrap: wrap;
    gap: 12px;
  }
  .file-info { order: -1; width: 100%; }
  .actions { width: 100%; justify-content: flex-end; }
  .image-controls { flex-wrap: wrap; }
}
</style>