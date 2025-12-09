<template>
  <div class="pd-wrap" v-if="project">
    <section class="pd-hero" :style="heroStyle">
      <div class="hero-top">
        <div class="crumbs">
          <router-link to="/projects">Projects</router-link>
          <span>›</span>
          <span>{{ project.code }}</span>
        </div>
        <button class="text-btn" @click="goBack">← Back to list</button>
      </div>

      <div class="hero-main">
        <div>
          <p class="eyebrow">Architecture Workspace · {{ project.phase }}</p>
          <h1>{{ project.name }}</h1>
          <p class="subtitle">{{ project.description }}</p>
          <div class="chips">
            <span v-for="tag in project.tags" :key="tag" class="chip">{{ tag }}</span>
          </div>
        </div>
        <div class="hero-progress">
          <div class="hero-progress-value">{{ project.progress }}%</div>
          <div class="hero-progress-track">
            <div class="hero-progress-fill" :style="{ width: project.progress + '%' }"></div>
          </div>
          <span class="hero-progress-label">{{ prettyStatus(project.status) }}</span>
          <p class="time-remaining">{{ timeRemaining }}</p>
        </div>
      </div>

      <div class="hero-meta">
        <div class="meta-card">
          <span class="meta-label">Client</span>
          <span class="meta-value">{{ project.client }}</span>
          <span class="meta-extra">{{ project.clientContact }}</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Schedule</span>
          <span class="meta-value">{{ formatDate(project.startDate) }} → {{ formatDate(project.dueDate) }}</span>
          <span class="meta-extra">{{ timeRemaining }}</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Budget / Area</span>
          <span class="meta-value">{{ project.budget }}</span>
          <span class="meta-extra">Floor Area · {{ project.area }}</span>
        </div>
      </div>
    </section>

    <section class="pd-body">
      <div class="pd-grid">
        <article class="pd-card">
          <header>
            <h2>Project Narrative</h2>
            <span class="badge badge-phase">{{ project.phase }}</span>
          </header>
          <p>{{ project.longform }}</p>
          <ul class="pd-list">
            <li>
              <span>Lead Architect</span>
              <strong>{{ project.architect }}</strong>
            </li>
            <li>
              <span>Project Manager</span>
              <strong>{{ project.manager }}</strong>
            </li>
            <li>
              <span>Location</span>
              <strong>{{ project.location }}</strong>
            </li>
          </ul>
        </article>

        <article class="pd-card timeline">
          <header><h2>Milestones</h2></header>
          <ul class="timeline-list">
            <li v-for="m in project.milestones" :key="m.label" :class="{ done: m.done }">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h3>{{ m.label }}</h3>
                <p>{{ formatDate(m.date) }}</p>
              </div>
            </li>
          </ul>
        </article>
      </div>

      <div class="pd-grid">
        <article class="pd-card files">
          <header>
            <h2>Files & Documents</h2>
            <span class="badge badge-count">{{ files.length }} files</span>
          </header>
          <div class="files-grid">
            <div v-for="file in files" :key="file.name" class="file-card">
              <div class="file-icon" :class="fileTypeClass(file.type)">{{ fileExtension(file.type) }}</div>
              <div>
                <h3>{{ file.name }}</h3>
                <p>Uploaded by {{ file.uploadedBy }} ({{ file.role }})</p>
                <p class="file-meta">{{ formatDate(file.uploadedAt) }} · {{ formatSize(file.size) }}</p>
              </div>
            </div>
          </div>
        </article>

        <article class="pd-card tasks">
          <header>
            <div>
              <h2>Task Board</h2>
              <p>Assigned by Admin for coordination</p>
            </div>
            <span class="badge badge-count">{{ tasks.length }} tasks</span>
          </header>
          <ul class="task-list">
            <li v-for="task in tasks" :key="task.title" :class="taskStatusClass(task.status)">
              <div class="task-head">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-status">{{ taskStatusLabel(task.status) }}</span>
              </div>
              <p class="task-meta">
                Assigned to {{ task.assignedTo }} · Created by {{ task.createdBy }} · Due {{ formatDate(task.due) }}
              </p>
              <span class="task-priority" :class="`priority-${task.priority}`">{{ task.priority }} priority</span>
            </li>
          </ul>
        </article>
      </div>

      <article class="pd-card team">
        <header>
          <h2>Project Team & Updates</h2>
          <p>Collaborators and internal notes</p>
        </header>
        <div class="team-grid">
          <div v-for="member in project.team" :key="member.name" class="team-card">
            <div class="avatar" :style="{ background: member.tint }">{{ initials(member.name) }}</div>
            <div>
              <h3>{{ member.name }}</h3>
              <p>{{ member.role }}</p>
              <span class="team-note">{{ member.note }}</span>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>

  <div v-else class="pd-empty">
    <p>Project not found.</p>
    <router-link class="text-btn" to="/projects">Back to Projects</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const project = ref(null)
const files = computed(() => project.value?.files || [])
const tasks = computed(() => project.value?.tasks || [])
const demoProjects = createDemoProjects()

const heroStyle = computed(() => ({
  background: project.value?.theme?.gradient || 'linear-gradient(135deg, #0f172a 0%, #2563eb 70%)'
}))

const timeRemaining = computed(() => {
  if (!project.value?.dueDate) return 'Schedule pending'
  const today = new Date()
  const due = new Date(project.value.dueDate)
  const diff = Math.ceil((due - today) / 86400000)
  if (diff < 0) return 'Past turnover'
  if (diff === 0) return 'Due today'
  return `${diff} day${diff === 1 ? '' : 's'} remaining`
})

function goBack() {
  router.push('/projects')
}

function prettyStatus(status) {
  return (status || 'pending').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(value) {
  if (!value) return 'TBD'
  const date = new Date(value)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatSize(bytes) {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** idx).toFixed(idx ? 1 : 0)} ${units[idx]}`
}

function fileExtension(type) {
  return (type || 'file').slice(0, 3).toUpperCase()
}

function fileTypeClass(type) {
  const map = {
    pdf: 'is-pdf',
    jpg: 'is-img',
    jpeg: 'is-img',
    png: 'is-img',
    dwg: 'is-cad',
    xlsx: 'is-sheet',
    xls: 'is-sheet',
    doc: 'is-doc',
    docx: 'is-doc',
    ppt: 'is-ppt',
    pptx: 'is-ppt'
  }
  return map[(type || '').toLowerCase()] || 'is-file'
}

function taskStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    review: 'Review',
    completed: 'Completed'
  }
  return labels[(status || '').toLowerCase()] || 'Pending'
}

function taskStatusClass(status) {
  const map = {
    pending: 'task pending',
    in_progress: 'task progress',
    review: 'task review',
    completed: 'task completed'
  }
  return map[(status || '').toLowerCase()] || 'task pending'
}

function initials(name) {
  return (name || '')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function loadProject() {
  const storedPayload = sessionStorage.getItem('domus:selectedProjectPayload')
  const storedId = sessionStorage.getItem('domus:selectedProjectId')
  const routeId = route.params.id

  if (storedPayload) {
    try {
      const parsed = JSON.parse(storedPayload)
      if (!routeId || routeId === parsed.id || !parsed.id) {
        project.value = enrichProject(parsed)
        return
      }
    } catch (err) {
      console.warn('Failed to parse stored project payload', err)
    }
  }

  if (routeId) {
    const fallback = demoProjects.find(p => p.id === routeId) || demoProjects[0]
    project.value = enrichProject(fallback)
  } else if (storedId) {
    const fallback = demoProjects.find(p => p.id === storedId) || demoProjects[0]
    project.value = enrichProject(fallback)
  } else {
    project.value = enrichProject(demoProjects[0])
  }
}

function enrichProject(raw) {
  const template = demoProjects.find(p => p.id === raw.id) || demoProjects[0]
  return {
    ...template,
    ...raw,
    files: Array.isArray(raw.files) && raw.files.length ? raw.files : template.files,
    tasks: Array.isArray(raw.tasks) && raw.tasks.length ? raw.tasks : template.tasks,
    milestones: Array.isArray(raw.milestones) && raw.milestones.length ? raw.milestones : template.milestones,
    team: Array.isArray(raw.team) && raw.team.length ? raw.team : template.team,
    theme: raw.theme || template.theme,
    longform:
      raw.longform ||
      `Domus Architecture is crafting ${template.name}, a site-responsive scheme that balances climate strategy, spatial clarity, and material tactility.`
  }
}

function createDemoProjects() {
  return [
    {
      id: 'villa-alta',
      code: 'DOMUS-001',
      name: 'Villa Alta Residence',
      status: 'construction',
      phase: 'Superstructure Works',
      progress: 68,
      startDate: '2024-05-20',
      dueDate: '2025-03-30',
      client: 'Mr. & Mrs. Zamora',
      clientContact: '+63 917 555 0192',
      location: 'Barangay Aninuan, Puerto Galera, Oriental Mindoro',
      description: 'Three-storey tropical modern residence with cantilevered terraces, lap pool, and sea-facing glazing.',
      budget: '₱18,500,000',
      area: '412 sqm',
      architect: 'Ar. Keanu Borbe',
      manager: 'Ar. Elaine Balay',
      tags: ['Tropical Modern', 'Residential', 'Premium'],
      theme: { gradient: 'linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #38bdf8 100%)' },
      files: [
        { name: 'Rear Elevation.pdf', uploadedBy: 'Jc Bautista', role: 'Senior Drafter', uploadedAt: '2024-11-05T09:00:00Z', type: 'pdf', size: 1250000 },
        { name: "Architect's Perspective.jpg", uploadedBy: 'Keanu Borbe', role: 'Lead Architect', uploadedAt: '2024-11-02T11:00:00Z', type: 'jpg', size: 2450000 },
        { name: 'Structural Details.pdf', uploadedBy: 'Jc Bautista', role: 'Senior Drafter', uploadedAt: '2024-10-28T15:30:00Z', type: 'pdf', size: 1810000 },
        { name: 'Materials Schedule.xlsx', uploadedBy: 'Elaine Balay', role: 'Project Manager', uploadedAt: '2024-10-24T08:45:00Z', type: 'xlsx', size: 250000 }
      ],
      tasks: [
        { title: 'Issue AFC structural drawings', createdBy: 'Admin', assignedTo: 'Jc Bautista', status: 'in_progress', due: '2024-12-12', priority: 'high' },
        { title: 'Coordinate glazing specs with supplier', createdBy: 'Admin', assignedTo: 'Elaine Balay', status: 'pending', due: '2024-12-08', priority: 'medium' },
        { title: 'Finalize pool waterproofing details', createdBy: 'Admin', assignedTo: 'Keanu Borbe', status: 'review', due: '2024-12-05', priority: 'high' }
      ],
      milestones: [
        { label: 'Concept Sign-off', date: '2024-06-15', done: true },
        { label: 'Design Development', date: '2024-07-28', done: true },
        { label: 'Permit Approval', date: '2024-09-10', done: true },
        { label: 'Structural Shell', date: '2024-12-22', done: false }
      ],
      team: [
        { name: 'Keanu Borbe', role: 'Lead Architect', note: 'Oversees creative direction and client reviews.', tint: '#2563eb' },
        { name: 'Elaine Balay', role: 'Project Manager', note: 'Coordinates consultants and schedules.', tint: '#0ea5e9' },
        { name: 'Jc Bautista', role: 'Senior Drafter', note: 'Leads documentation and detailing packages.', tint: '#38bdf8' }
      ]
    },
    {
      id: 'marina-heights',
      code: 'DOMUS-014',
      name: 'Marina Heights Condotel',
      status: 'design',
      phase: 'Facade Optimization',
      progress: 42,
      startDate: '2024-08-05',
      dueDate: '2025-06-18',
      client: 'Harborline Hospitality Group',
      clientContact: '+63 998 441 2210',
      location: 'Calapan Boulevard, Oriental Mindoro',
      description: 'Mixed-use condotel with cascading podium gardens, double-height lobby, and rooftop amenities.',
      budget: '₱285,000,000',
      area: '18,950 sqm',
      architect: 'Ar. Keanu Borbe',
      manager: 'Ar. Elaine Balay',
      tags: ['High-Rise', 'Hospitality', 'Urban'],
      theme: { gradient: 'linear-gradient(135deg, #0f172a 0%, #2d8fff 60%, #3b82f6 100%)' },
      files: [
        { name: 'Level 12 Floor Plan.pdf', uploadedBy: 'Jc Bautista', role: 'Senior Drafter', uploadedAt: '2024-11-08T13:15:00Z', type: 'pdf', size: 1930000 },
        { name: 'Facade Study Set.pptx', uploadedBy: 'Elaine Balay', role: 'Project Manager', uploadedAt: '2024-11-01T10:00:00Z', type: 'pptx', size: 4730000 },
        { name: 'MEP Coordination Matrix.xlsx', uploadedBy: 'Elaine Balay', role: 'Project Manager', uploadedAt: '2024-10-29T16:20:00Z', type: 'xlsx', size: 320000 }
      ],
      tasks: [
        { title: 'Integrate mechanical riser adjustments', createdBy: 'Admin', assignedTo: 'Jc Bautista', status: 'pending', due: '2024-12-14', priority: 'high' },
        { title: 'Finalize facade shading study', createdBy: 'Admin', assignedTo: 'Elaine Balay', status: 'in_progress', due: '2024-12-09', priority: 'medium' },
        { title: 'Prepare client presentation boards', createdBy: 'Admin', assignedTo: 'Keanu Borbe', status: 'pending', due: '2024-12-11', priority: 'medium' }
      ],
      milestones: [
        { label: 'Site Analysis', date: '2024-08-22', done: true },
        { label: 'Concept Alternatives', date: '2024-09-30', done: true },
        { label: 'Design Review Board', date: '2024-11-18', done: false }
      ],
      team: [
        { name: 'Keanu Borbe', role: 'Lead Architect', note: 'Facilitates client alignment every sprint.', tint: '#1d4ed8' },
        { name: 'Elaine Balay', role: 'Project Manager', note: 'Drives consultant coordination matrices.', tint: '#3b82f6' },
        { name: 'Jc Bautista', role: 'Senior Drafter', note: 'Produces IFC-ready drawing sets.', tint: '#60a5fa' }
      ]
    }
  ]
}

onMounted(loadProject)
watch(() => route.params.id, loadProject)
</script>

<style>

.pd-wrap {
  min-height: 100vh;
  background: #0b1120;
  color: white;
}
.pd-hero {
  padding: 40px 32px 32px;
  background-size: cover;
  background-position: center;
}
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.crumbs {
  display: flex;
  gap: 8px;
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.9rem;
}
.crumbs a {
  color: rgba(148, 163, 184, 0.9);
  text-decoration: none;
}
.text-btn {
  border: none;
  background: rgba(226, 232, 240, 0.12);
  color: white;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
}
.hero-main {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.75);
  margin: 0 0 10px;
}
.hero-main h1 {
  margin: 0 0 10px;
  font-size: 2.2rem;
}
.subtitle {
  margin: 0 0 12px;
  max-width: 640px;
  color: rgba(226, 232, 240, 0.75);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.16);
  color: #bfdbfe;
  font-weight: 600;
  font-size: 0.82rem;
}
.hero-progress {
  width: 240px;
  background: rgba(15, 23, 42, 0.55);
  border-radius: 18px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  text-align: center;
}
.hero-progress-value {
  font-size: 2.3rem;
  font-weight: 800;
}
.hero-progress-track {
  margin: 12px 0;
  height: 10px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  overflow: hidden;
}
.hero-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8 0%, #2563eb 100%);
}
.hero-progress-label {
  font-weight: 700;
  letter-spacing: 0.14em;
  font-size: 0.74rem;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.8);
}
.time-remaining {
  margin: 6px 0 0;
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.9rem;
}
.hero-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 28px;
}
.meta-card {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 16px;
  padding: 18px 20px;
  border: 1px solid rgba(148, 163, 184, 0.16);
}
.meta-label {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.7rem;
  color: rgba(148, 163, 184, 0.7);
}
.meta-value {
  display: block;
  margin-top: 8px;
  font-size: 1.2rem;
  font-weight: 700;
}
.meta-extra {
  display: block;
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.75);
}

.pd-body {
  padding: 32px 24px 56px;
  background: linear-gradient(180deg, #0b1120 0%, #101a33 80%);
}
.pd-grid {
  display: grid;
  gap: 18px;
  margin-bottom: 20px;
}
@media (min-width: 1080px) {
  .pd-grid {
    grid-template-columns: 1.2fr 1fr;
  }
}
.pd-card {
  background: rgba(15, 23, 42, 0.85);
  border-radius: 22px;
  padding: 26px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.35);
}
.pd-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.pd-card h2 {
  margin: 0;
  font-size: 1.25rem;
}
.badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.badge-phase {
  background: rgba(56, 189, 248, 0.14);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}
.badge-count {
  background: rgba(148, 163, 184, 0.18);
  color: rgba(226, 232, 240, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.28);
}
.pd-card p {
  color: rgba(226, 232, 240, 0.78);
  line-height: 1.55;
}
.pd-list {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
  display: grid;
  gap: 10px;
}
.pd-list li {
  display: flex;
  justify-content: space-between;
  color: rgba(226, 232, 240, 0.75);
}
.pd-list strong {
  color: white;
}

.timeline-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  gap: 14px;
}
.timeline-list li {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 10px;
  align-items: start;
}
.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #38bdf8;
  margin-top: 4px;
  position: relative;
}
.timeline-list li:not(:last-child) .timeline-dot::after {
  content: '';
  position: absolute;
  top: 16px;
  left: 50%;
  width: 2px;
  height: calc(100% + 12px);
  background: rgba(56, 189, 248, 0.26);
  transform: translateX(-50%);
}
.timeline-list li.done .timeline-dot {
  background: #38bdf8;
}
.timeline-content h3 {
  margin: 0;
  font-size: 1rem;
}
.timeline-content p {
  margin: 4px 0 0;
  color: rgba(226, 232, 240, 0.65);
}

.files-grid {
  display: grid;
  gap: 14px;
}
@media (min-width: 640px) {
  .files-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.file-card {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.14);
}
.file-card h3 {
  margin: 0;
  font-size: 1rem;
  color: #e2e8f0;
}
.file-card p {
  margin: 4px 0 0;
  font-size: 0.86rem;
  color: rgba(226, 232, 240, 0.7);
}
.file-meta {
  font-size: 0.8rem;
  color: rgba(148, 163, 184, 0.75);
}
.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  color: white;
}
.file-icon.is-pdf { background: rgba(239, 68, 68, 0.32); }
.file-icon.is-img { background: rgba(56, 189, 248, 0.28); }
.file-icon.is-sheet { background: rgba(34, 197, 94, 0.28); }
.file-icon.is-doc { background: rgba(59, 130, 246, 0.32); }
.file-icon.is-cad { background: rgba(244, 114, 182, 0.28); }
.file-icon.is-ppt { background: rgba(251, 146, 60, 0.3); }
.file-icon.is-file { background: rgba(148, 163, 184, 0.28); }

.tasks .task-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  gap: 12px;
}
.task {
  padding: 16px 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
}
.task-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-title {
  font-weight: 700;
}
.task-status {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.task-meta {
  margin: 6px 0 10px;
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.86rem;
}
.task-priority {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
}
.task.pending { background: rgba(30, 64, 175, 0.18); }
.task.progress { background: rgba(17, 94, 89, 0.2); }
.task.review { background: rgba(120, 53, 15, 0.2); }
.task.completed { background: rgba(30, 64, 175, 0.1); border-style: dashed; }
.priority-high { background: rgba(248, 113, 113, 0.22); border: 1px solid rgba(248, 113, 113, 0.36); }
.priority-medium { background: rgba(251, 191, 36, 0.22); border: 1px solid rgba(251, 191, 36, 0.36); }
.priority-low { background: rgba(52, 211, 153, 0.22); border: 1px solid rgba(52, 211, 153, 0.36); }

.team {
  margin-bottom: 0;
}
.team-grid {
  display: grid;
  gap: 14px;
}
@media (min-width: 720px) {
  .team-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.team-card {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.14);
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
}
.team-card h3 {
  margin: 0;
  font-size: 1rem;
}
.team-card p {
  margin: 4px 0;
  color: rgba(226, 232, 240, 0.7);
}
.team-note {
  font-size: 0.78rem;
  color: rgba(148, 163, 184, 0.75);
}

.pd-empty {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0b1120;
  color: white;
  gap: 12px;
}

@media (max-width: 1024px) {
  .hero-main {
    flex-direction: column;
  }
  .hero-progress {
    width: 100%;
  }
  .hero-meta {
    grid-template-columns: 1fr;
  }
  .pd-body {
    padding: 24px 16px 48px;
  }
  .pd-card {
    padding: 22px;
  }
}
</style>