// ...existing code...
<script setup>
import { ref, onMounted, nextTick /* , watch */ } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const router = useRouter()
const route = useRoute()

const fileUrl = ref('')
const fileName = ref('file')
const fileType = ref('')

const pdfDoc = ref(null)
const numPages = ref(0)
const scale = ref(1) // visual scale (CSS), keeps width fixed

const viewerEl = ref(null)
const thumbsEl = ref(null)
const isPdf = ref(false)
const isImage = ref(false)

function normalizeType(t = '') {
  const s = String(t).toLowerCase()
  if (/(jpg|jpeg|png|gif|bmp|svg|image)/.test(s)) return 'image'
  if (/pdf/.test(s)) return 'pdf'
  return 'other'
}

function back() {
  router.push('/admin/file-and-document')
}

function zoomIn() {
  scale.value = Math.min(scale.value + 0.2, 3)
}
function zoomOut() {
  scale.value = Math.max(scale.value - 0.2, 0.5)
}
function doDownload() {
  const a = document.createElement('a')
  a.href = fileUrl.value
  a.download = fileName.value || 'file'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function loadPdf(url) {
  pdfDoc.value = await pdfjsLib.getDocument(url).promise
  numPages.value = pdfDoc.value.numPages
  await renderAllPages()
}

async function renderAllPages() {
  await nextTick()
  if (viewerEl.value) viewerEl.value.innerHTML = ''
  if (thumbsEl.value) thumbsEl.value.innerHTML = ''

  if (!pdfDoc.value) return
  const renderScale = Math.max(1.2, (window.devicePixelRatio || 1)) // crisp but not affecting layout width
  for (let i = 1; i <= pdfDoc.value.numPages; i++) {
    const page = await pdfDoc.value.getPage(i)
    const viewport = page.getViewport({ scale: renderScale })

    // main canvas
    const canvas = document.createElement('canvas')
    canvas.className = 'page-canvas'
    canvas.id = `page-${i}`
    const ctx = canvas.getContext('2d', { alpha: false })
    canvas.width = viewport.width
    canvas.height = viewport.height
    viewerEl.value.appendChild(canvas)
    await page.render({ canvasContext: ctx, viewport }).promise

    // thumbnail
    const tScale = 180 / viewport.width
    const tViewport = page.getViewport({ scale: Math.max(0.2, tScale) })
    const tCanvas = document.createElement('canvas')
    tCanvas.className = 'thumb-canvas'
    const tCtx = tCanvas.getContext('2d')
    tCanvas.width = tViewport.width
    tCanvas.height = tViewport.height
    thumbsEl.value.appendChild(tCanvas)
    page.render({ canvasContext: tCtx, viewport: tViewport }).promise.then(() => {
      tCanvas.addEventListener('click', () => {
        document.getElementById(`page-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }
}

// Note: we keep width fixed and use CSS scale, so no re-render on zoom.
// If you prefer re-render, uncomment the watcher below and remove CSS scaling.
// watch(scale, async () => { if (isPdf.value) await renderAllPages() })

onMounted(async () => {
  const q = route.query || {}
  fileUrl.value = decodeURIComponent(q.url || '')
  fileName.value = q.name || 'file'
  fileType.value = q.type || ''

  const kind = normalizeType(fileType.value || fileUrl.value)
  isPdf.value = kind === 'pdf'
  isImage.value = kind === 'image'

  if (isPdf.value && fileUrl.value) {
    await loadPdf(fileUrl.value)
  }
})
</script>

<template>
  <div class="fv-wrap">
    <div class="fv-toolbar">
      <button class="back-btn" @click="back" aria-label="Back">‹ Back</button>
      <div class="center-actions">
        <button class="icon-btn" @click="zoomOut" title="Zoom out" aria-label="Zoom out">−</button>
        <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
        <button class="icon-btn" @click="zoomIn" title="Zoom in" aria-label="Zoom in">+</button>
        <button class="icon-btn" @click="doDownload" title="Download" aria-label="Download">⬇</button>
      </div>
      <div class="file-name" :title="fileName">{{ fileName }}</div>
    </div>

    <div class="fv-body">
      <div class="fv-view">
        <!-- PDF -->
        <div v-if="isPdf" class="pdf-wrap">
          <div class="pages" :style="{ transform: `scale(${scale})` }" ref="viewerEl"></div>
        </div>

        <!-- Image -->
        <div v-else-if="isImage" class="image-wrap">
          <div class="image-frame" :style="{ transform: `scale(${scale})` }">
            <img :src="fileUrl" :alt="fileName" />
          </div>
        </div>

        <!-- Fallback: just white area (no iframe) -->
        <div v-else class="white-blank"></div>
      </div>

      <aside v-if="isPdf" class="fv-side">
        <div class="thumbs" ref="thumbsEl"></div>
        <div class="pages-count">Pages: {{ numPages }}</div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.fv-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: calc(100vh - 90px);
  padding: 10px;
  background: #f6f8fb;
}

/* Toolbar */
.fv-toolbar {
  position: sticky; top: 0; z-index: 5;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #e6eaf0; border-radius: 12px; padding: 8px 10px;
  box-shadow: 0 4px 12px #00000008;
}
.back-btn {
  justify-self: start; border: 1px solid #e5e7eb; background: #fff; padding: 6px 10px; border-radius: 10px;
  cursor: pointer; font-weight: 700; color: #213547;
}
.center-actions { justify-self: center; display: inline-flex; align-items: center; gap: 8px; }
.icon-btn {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer;
  font-size: 16px; font-weight: 800; color:#213547; display: inline-flex; align-items: center; justify-content: center;
}
.zoom-label { font-weight: 800; color:#213547; min-width: 44px; text-align: center; }
.file-name {
  justify-self: end; max-width: 50vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color:#475569; font-weight: 700; font-size: .9rem;
}

/* Body layout */
.fv-body {
  flex: 1 1 auto; min-height: 0;
  display: grid; grid-template-columns: 1fr 220px; gap: 10px;
}
.fv-view {
  background: #fff; border: 1px solid #e6eaf0; border-radius: 12px;
  min-height: 0; overflow: auto; position: relative; display: flex; justify-content: center;
}

/* Fixed width content area */
.pdf-wrap, .image-wrap, .white-blank { width: 100%; display: flex; justify-content: center; background: #fff; }
.pages {
  /* Fixed visual width: desktop ~900px, shrinks on small screens but won't jump while zooming */
  width: clamp(320px, 92vw, 900px);
  padding: 16px;
  transform-origin: top center;
}
.page-canvas {
  width: 100%; height: auto; display: block; margin: 0 auto 12px; background: #ffffff;
  border-radius: 8px; box-shadow: 0 4px 12px rgba(2,12,27,.04);
}

/* Image in fixed frame */
.image-frame {
  width: clamp(320px, 92vw, 900px);
  padding: 16px;
  transform-origin: top center;
}
.image-frame img {
  width: 100%; height: auto; display: block; background: #fff; border-radius: 8px;
}

/* Fallback: pure white block */
.white-blank {
  width: clamp(320px, 92vw, 900px);
  height: 70vh;
  background: #ffffff;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(2,12,27,.04);
}

/* Sidebar */
.fv-side {
  background: #fff; border: 1px solid #e6eaf0; border-radius: 12px; padding: 8px;
  min-height: 0; overflow: auto;
}
.thumbs { display: grid; gap: 8px; }
.thumb-canvas {
  width: 100%; height: auto; display: block; cursor: pointer; background: #f8fafc;
  border-radius: 8px; box-shadow: inset 0 0 0 1px #eef2f7;
}
.pages-count { margin-top: 8px; color:#64748b; font-size: .85rem; text-align: center; }

/* Responsive */
@media (max-width: 900px) {
  .fv-body { grid-template-columns: 1fr; }
  .fv-side { order: 2; max-height: 220px; }
  .thumbs { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 520px) {
  .thumbs { grid-template-columns: repeat(2, 1fr); }
  .file-name { display: none; }
}
</style>
// ...existing code...