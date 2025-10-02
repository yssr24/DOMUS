<script setup>
import { ref, computed, onMounted } from 'vue'
import { API_BASE_URL } from '../../../config'

const title = ref('')
const description = ref('')
const files = ref([])
const submitting = ref(false)
const msg = ref('')
const msgType = ref('success')

const designs = ref([])
const loadingDesigns = ref(false)
const fileNames = computed(() => files.value.map(f => f.name))

function onFilesChange(e) {
  files.value = Array.from(e.target.files || [])
}

function resetForm() {
  title.value = ''
  description.value = ''
  files.value = []
  const input = document.getElementById('images')
  if (input) input.value = ''
  msg.value = ''
}

function formatDate(d) {
  try { return new Date(d).toLocaleString() } catch { return d }
}

async function fetchDesigns() {
  loadingDesigns.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/designs`)
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load designs.')
    designs.value = data.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingDesigns.value = false
  }
}

async function handleUpload() {
  msg.value = ''
  if (!title.value.trim()) {
    msgType.value = 'error'
    msg.value = 'Title is required.'
    return
  }

  const fd = new FormData()
  fd.append('title', title.value)
  fd.append('description', description.value)
  fd.append('createdAt', new Date().toISOString())
  for (const f of files.value) fd.append('images', f)

  submitting.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/designs`, { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed.')

    msgType.value = 'success'
    msg.value = 'Saved successfully.'
    resetForm()
    await fetchDesigns() // refresh list
  } catch (err) {
    msgType.value = 'error'
    msg.value = err.message || 'Upload failed.'
  } finally {
    submitting.value = false
  }
}

onMounted(fetchDesigns)
</script>
<template>
  <section class="page">
    <div class="card">
      <header class="card__header">
        <h1>Website Content</h1>
        <p class="subtitle">Add a title, description, and images.</p>
      </header>

      <form class="form" autocomplete="off" @submit.prevent="handleUpload">
        <div class="form__row">
          <label for="title" class="label">Title</label>
          <input id="title" class="input" type="text" placeholder="Enter a title" v-model="title" />
        </div>

        <div class="form__row">
          <label for="description" class="label">Description</label>
          <textarea id="description" class="textarea" rows="4" placeholder="Write a short description" v-model="description"></textarea>
        </div>

        <div class="form__row">
          <label class="label">Images</label>

          <label for="images" class="dropzone" tabindex="0" aria-describedby="dropzoneHelp">
            <div class="dropzone__content">
              <svg class="icon" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 16.5a4 4 0 00-3.5-3.97A5.5 5.5 0 006.1 9.4a4 4 0 00.6 7.95h11.8a3.5 3.5 0 001.5-0.85z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="dropzone__text">
                <strong>Drag & drop</strong> images here
                <span class="muted">or click to browse</span>
                <span class="muted">PNG, JPG, GIF up to 10MB each</span>
              </div>
            </div>
            <input id="images" class="file-input" type="file" accept="image/*" multiple @change="onFilesChange" />
          </label>
          <p id="dropzoneHelp" class="help">You can drag images into the dashed area or click it to select.</p>
        </div>

        <div class="preview" v-if="fileNames.length">
          <div class="preview__placeholder">
            {{ fileNames.length }} file(s) selected: {{ fileNames.join(', ') }}
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn btn--secondary" @click="resetForm" :disabled="submitting">Cancel</button>
          <button type="submit" class="btn btn--primary" :disabled="submitting">
            {{ submitting ? 'Uploading...' : 'Upload' }}
          </button>
        </div>

        <p v-if="msg" :style="{ color: msgType === 'error' ? '#c62828' : '#2e7d32', marginTop: '8px' }">
          {{ msg }}
        </p>
      </form>
    </div>
    <div class="designs-container">
      <section class="designs">
        <h2 class="section-title">Designs</h2>

        <div v-if="loadingDesigns" class="loading">Loading...</div>
        <div v-else-if="!designs.length" class="empty">No designs yet.</div>

        <div v-else class="design-grid">
          <article v-for="d in designs" :key="d.id" class="design-card">
            <header class="design-header">
              <h3 class="design-title">{{ d.title }}</h3>
              <div class="design-meta">{{ formatDate(d.createdAt) }}</div>
            </header>
            <p class="design-desc" v-if="d.description">{{ d.description }}</p>
            <div class="design-images" :class="{ single: (d.images?.length || 0) === 1 }">
              <img v-for="(url, i) in d.images || []" :key="i" :src="url" :alt="`${d.title} image ${i + 1}`" loading="lazy" />
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.page {
  --bg: #0b0c10;
  --card-bg: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e5e7eb;
  --dashed: #cbd5e1;
  --accent: #2563eb;
  --accent-600: #1d4ed8;

  min-height: 100%;
  padding: 32px 0;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.card {
  /* make width like userManagement */
  width: 98vw;            /* near full viewport width */
  max-width: 1400px;      /* cap similar to userManagement */
  margin: 0 auto;         /* center */
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow:
    0 10px 20px rgba(2, 12, 27, 0.04),
    0 2px 6px rgba(2, 12, 27, 0.06);
  overflow: hidden;
}


.card__header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  background: #ffffff;
}

.card__header h1 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.2px;
}

.subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.form {
  padding: 20px 24px 24px;
  display: grid;
  gap: 18px;
}

.form__row {
  display: grid;
  gap: 8px;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.input,
.textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  color: var(--text);
  background: #fff;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
}

.input::placeholder,
.textarea::placeholder {
  color: #94a3b8;
}

.input:focus,
.textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

/* Drag & Drop area (broken line border) */
.dropzone {
  position: relative;
  border: 2px dashed var(--dashed);
  border-radius: 14px;
  background: #fafbff;
  color: var(--text);
  min-height: 160px;
  display: grid;
  place-items: center;
  padding: 18px;
  cursor: pointer;
  transition: border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease;
}

.dropzone:hover,
.dropzone:focus-visible,
.dropzone:focus-within {
  border-color: var(--accent);
  background: #f5f8ff;
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.12);
  outline: none;
}

.dropzone__content {
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
}

.icon {
  color: var(--accent);
}

.dropzone__text {
  display: grid;
  gap: 2px;
  font-size: 14px;
}

.dropzone__text strong {
  font-weight: 700;
  margin-right: 6px;
}

.muted {
  color: var(--muted);
  font-size: 12.5px;
  display: block;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* label handles click */
}

.help {
  margin: 6px 2px 0;
  font-size: 12.5px;
  color: var(--muted);
}

/* Preview placeholder */
.preview {
  border: 1px dashed var(--dashed);
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
}

.preview__placeholder {
  color: var(--muted);
  font-size: 13px;
  text-align: center;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 80ms ease, box-shadow 120ms ease, background-color 120ms ease, border-color 120ms ease;
}

.btn:active {
  transform: translateY(1px);
}

.btn--secondary {
  background: #f8fafc;
  color: #0f172a;
  border-color: var(--border);
}

.btn--secondary:hover {
  background: #f1f5f9;
}

.btn--primary {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
}

.btn--primary:hover {
  background: var(--accent-600);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.32);
}

.designs-container {
  width: 98vw;
  max-width: 1400px;
  margin: 16px auto 24px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow:
    0 10px 20px rgba(2, 12, 27, 0.04),
    0 2px 6px rgba(2, 12, 27, 0.06);
  overflow: hidden;
}

/* Inner padding for the list content */
.designs {
  padding: 16px 24px 28px;
  background: #fff;
  /* no border-top here anymore because it's outside the card */
}

.section-title {
  margin: 6px 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.loading,
.empty {
  color: var(--muted);
  font-size: 14px;
  padding: 8px 0;
}

/* Card list */
.design-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.design-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  background: #fff;
}

.design-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  justify-content: space-between;
  margin-bottom: 8px;
}

.design-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.design-meta {
  font-size: 12.5px;
  color: var(--muted);
}

.design-desc {
  margin: 6px 0 10px;
  color: #334155;
  font-size: 14px;
}

/* Image grid */
.design-images {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.design-images.single {
  grid-template-columns: 1fr;
}

.design-images img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 10px;
  background: #f1f5f9;
  box-shadow: 0 1px 3px rgba(2, 12, 27, 0.06);
}

.design-images.single img {
  height: auto;
  aspect-ratio: 16 / 9;
}
/* Responsive tweaks */
@media (min-width: 900px) {
  .design-grid {
    grid-template-columns: 1fr 1fr; /* two columns on wider screens */
  }
}
@media (min-width: 720px) {
  .form {
    gap: 20px;
  }
  .dropzone__content {
    gap: 16px;
  }
}
@media (max-width: 600px) {
  .card,
  .designs-container {
    width: 100vw;
  }
}
</style>