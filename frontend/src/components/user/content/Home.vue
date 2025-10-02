<script setup>
import { ref, onMounted, reactive } from 'vue'
import { API_BASE_URL } from '../../../config'

const designs = ref([])
const loading = ref(false)
const error = ref('')
const currentIndex = reactive({}) // per design id

function getMain(d) {
  const i = currentIndex[d.id] ?? 0
  return (d.images && d.images[i]) || ''
}
function setIndex(id, idx) {
  currentIndex[id] = idx
}
function next(id, images = []) {
  if (!images.length) return
  const i = (currentIndex[id] ?? 0) + 1
  currentIndex[id] = i % images.length
}
function prev(id, images = []) {
  if (!images.length) return
  const len = images.length
  const i = (currentIndex[id] ?? 0) - 1
  currentIndex[id] = (i + len) % len
}
function restOf(d) {
  const i = currentIndex[d.id] ?? 0
  return (d.images || []).map((u, idx) => ({ u, idx })).filter(x => x.idx !== i)
}

async function fetchDesigns() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/designs`)
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load designs.')
    designs.value = data.data || []
    // ensure index initialized
    for (const d of designs.value) {
      if (currentIndex[d.id] == null) currentIndex[d.id] = 0
    }
  } catch (e) {
    error.value = e.message || 'Failed to load designs.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDesigns)
</script>

<template>
  <!-- ...existing code... -->
  <!-- Hero -->
  <div class="hero-section">
    <img src="../../../assets/bg.jpg" alt="DOMUS Hero" class="hero-image" />
    <h2 class="hero-title">DOMUS Architecture</h2>
    <p class="hero-desc">
      Our goal is to be a leading architectural firm in the country in creating innovative designs.
    </p>
  </div>
  <!-- ...existing code... -->

  <!-- Designs -->
  <section class="designs-wrapper">
    <div class="designs-inner">
      <div v-if="loading" class="designs-loading">Loading designs…</div>
      <div v-else-if="error" class="designs-error">{{ error }}</div>
      <div v-else-if="!designs.length" class="designs-empty">No designs yet.</div>

      <article v-for="d in designs" :key="d.id" class="design-block">
        <h2 class="design-title">{{ d.title }}</h2>

        <div class="design-gallery" :class="{ single: (d.images?.length || 0) <= 1 }">
          <!-- Left: main carousel -->
          <div class="main">
            <button
              v-if="(d.images?.length || 0) > 1"
              class="nav prev"
              type="button"
              aria-label="Previous image"
              @click="prev(d.id, d.images)"
            >
              ‹
            </button>
            <img
              v-if="getMain(d)"
              class="main-img"
              :src="getMain(d)"
              :alt="`${d.title} main image`"
              loading="lazy"
            />
            <button
              v-if="(d.images?.length || 0) > 1"
              class="nav next"
              type="button"
              aria-label="Next image"
              @click="next(d.id, d.images)"
            >
              ›
            </button>
          </div>

          <!-- Right: collage of rest images -->
          <div class="thumbs" v-if="(d.images?.length || 0) > 1">
            <img
              v-for="it in restOf(d)"
              :key="it.idx"
              :src="it.u"
              :alt="`${d.title} image ${it.idx + 1}`"
              loading="lazy"
              :class="{ active: (currentIndex[d.id] ?? 0) === it.idx }"
              @click="setIndex(d.id, it.idx)"
            />
          </div>
        </div>

        <p v-if="d.description" class="design-desc">{{ d.description }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
/* Container */
.designs-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 12px 40px;
  background: #f8fafc;
}
.designs-inner {
  width: min(1200px, 96vw);
}

/* States */
.designs-loading,
.designs-empty,
.designs-error {
  color: #475569;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: center;
  margin: 0 0 16px;
}

/* Each design block */
.design-block {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
  margin: 0 0 18px;
  box-shadow: 0 6px 18px rgba(2, 12, 27, 0.06);
}

/* Title */
.design-title {
  margin: 0 0 12px;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.2px;
  position: relative;
}
.design-title::after {
  content: '';
  display: block;
  width: 48px;
  height: 3px;
  background: #e6b23a;
  border-radius: 3px;
  margin-top: 6px;
}

/* Gallery layout */
.design-gallery {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 14px;
  align-items: start;
}
.design-gallery.single {
  grid-template-columns: 1fr;
}

/* Main image (left) */
.main {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: #e2e8f0;
  min-height: 320px;
}
.main-img {
  width: 100%;
  height: 100%;
  max-height: 460px;
  object-fit: cover;
  display: block;
}

/* Carousel buttons */
.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 22px;
  line-height: 38px;
  text-align: center;
  cursor: pointer;
  backdrop-filter: blur(2px);
}
.nav:hover { background: rgba(15, 23, 42, 0.75); }
.nav.prev { left: 10px; }
.nav.next { right: 10px; }

/* Collage (right) */
.thumbs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  max-height: 460px;
  overflow: auto;
  padding-right: 4px; /* avoid scrollbar overlap */
}
.thumbs img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 10px;
  background: #f1f5f9;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.thumbs img:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(2, 12, 27, 0.12);
}
.thumbs img.active {
  outline: 2px solid #e6b23a;
  outline-offset: 2px;
}

/* Description */
.design-desc {
  margin: 12px 2px 0;
  color: #334155;
  font-size: 0.98rem;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 900px) {
  .design-gallery {
    grid-template-columns: 1fr;
  }
  .thumbs {
    grid-template-columns: repeat(3, 1fr);
    max-height: none;
    padding-right: 0;
  }
  .main { min-height: 240px; }
  .thumbs img { height: 100px; }
}
@media (max-width: 520px) {
  .thumbs { grid-template-columns: repeat(2, 1fr); }
}
</style>