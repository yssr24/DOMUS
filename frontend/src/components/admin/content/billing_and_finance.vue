<template>
  <div class="bf-wrap">
    <header class="bf-header">
      <h2>Billing & Finance</h2>
      <input v-model="search" type="search" class="bf-search" placeholder="Search invoice, client, project, status..." />
    </header>

    <!-- KPI Cards -->
    <section class="bf-cards">
      <div class="bf-card revenue">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M4 20v-7l4-2 4 3 4-6 4 2v10H4z" fill="#43a047"/></svg>
        </div>
        <div class="info">
          <div class="label">Revenue (This Month)</div>
          <div class="value">{{ currency(totalRevenueThisMonth) }}</div>
        </div>
      </div>
      <div class="bf-card outstanding">
        <div class="icon">
          <svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3" fill="#1976d2"/><rect x="3" y="13" width="18" height="7" rx="2" fill="#1976d2"/></svg>
        </div>
        <div class="info">
          <div class="label">Outstanding</div>
          <div class="value">{{ currency(outstandingAmount) }}</div>
        </div>
      </div>
      <div class="bf-card paid">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2z" fill="#8e24aa"/><path d="M8 12l2.5 2.5L16 9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="info">
          <div class="label">Paid (This Month)</div>
          <div class="value">{{ currency(paidThisMonth) }}</div>
        </div>
      </div>
      <div class="bf-card overdue">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 2L2 20h20L12 2z" fill="#e6b23a"/><rect x="11" y="8" width="2" height="6" rx="1" fill="#fff"/><circle cx="12" cy="17" r="1.6" fill="#fff"/></svg>
        </div>
        <div class="info">
          <div class="label">Overdue</div>
          <div class="value">{{ overdueCount }} • {{ currency(overdueAmount) }}</div>
        </div>
      </div>
    </section>

    <!-- Charts -->
    <section class="bf-charts">
      <div class="chart-card">
        <h3>Revenue — Last 12 Months</h3>
        <apexchart type="area" height="240" :options="revOptions" :series="revSeries" />
      </div>
      <div class="chart-card">
        <h3>Invoices by Status</h3>
        <apexchart type="donut" height="240" :options="statusOptions" :series="statusSeries" />
      </div>
    </section>

    <!-- Invoices Table -->
    <section class="bf-table-card">
      <div class="table-toolbar">
        <span class="hint">{{ sortedRows.length }} of {{ invoices.length }} shown</span>
      </div>

      <div class="table-wrap">
        <table class="bf-table">
          <thead>
            <tr>
              <th @click="toggleSort('number')" :class="thClass('number')">Invoice #</th>
              <th @click="toggleSort('client')" :class="thClass('client')">Client</th>
              <th @click="toggleSort('project')" :class="thClass('project')">Project</th>
              <th @click="toggleSort('amount')" :class="thClass('amount')">Amount</th>
              <th @click="toggleSort('dueDate')" :class="thClass('dueDate')">Due</th>
              <th @click="toggleSort('status')" :class="thClass('status')">Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in sortedRows" :key="inv.id">
              <td class="mono">{{ inv.number }}</td>
              <td>{{ inv.client }}</td>
              <td class="ellipsis" :title="inv.project">{{ inv.project }}</td>
              <td class="mono">{{ currency(inv.amount) }}</td>
              <td class="mono">{{ formatDate(inv.dueDate) }}</td>
              <td><span class="pill" :class="statusClass(inv.status)">{{ inv.status }}</span></td>
              <td class="actions">
                <button class="link-btn" @click="download(inv)">PDF</button>
                <button v-if="inv.status !== 'paid'" class="link-btn ok" @click="markPaid(inv)">Mark paid</button>
              </td>
            </tr>
            <tr v-if="!sortedRows.length">
              <td colspan="7" class="center muted">No invoices found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

// Search + sort
const search = ref('')
const sortKey = ref('dueDate')
const sortDir = ref('asc')

// Sample invoices
const invoices = ref([

])

// KPIs
const now = new Date()
const isSameMonth = (d1, d2 = now) => d1 && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()

const totalRevenueThisMonth = computed(() =>
  invoices.value.filter(i => i.status === 'paid' && isSameMonth(i.paidDate)).reduce((s, i) => s + i.amount, 0)
)
const outstandingAmount = computed(() =>
  invoices.value.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
)
const paidThisMonth = computed(() =>
  invoices.value.filter(i => i.status === 'paid' && isSameMonth(i.paidDate)).reduce((s, i) => s + i.amount, 0)
)
const overdueCount = computed(() => invoices.value.filter(i => i.status === 'overdue').length)
const overdueAmount = computed(() => invoices.value.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0))

// Charts
const months = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep']
const revSeries = ref([{ name: 'Revenue', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(v => v * 1000) }])
const revOptions = ref({
  chart: { toolbar: { show: false }, sparkline: { enabled: false } },
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
    [i.number, i.client, i.project, i.status].some(v => String(v).toLowerCase().includes(q))
  )
})
function thClass(key) {
  return { sortable: true, 'sort-asc': sortKey.value === key && sortDir.value === 'asc', 'sort-desc': sortKey.value === key && sortDir.value === 'desc' }
}
function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filtered.value].sort((a, b) => {
    let va = a[key], vb = b[key]
    if (key === 'amount') return ((va || 0) - (vb || 0)) * dir
    if (key === 'dueDate') return ((+new Date(va)) - (+new Date(vb))) * dir
    va = String(va ?? '').toLowerCase(); vb = String(vb ?? '').toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
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
  try { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(v || 0) }
  catch { return `₱${(v || 0).toLocaleString()}` }
}
function formatDate(v) {
  if (!v) return '—'
  const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v
  return d.toLocaleDateString()
}
function markPaid(inv) {
  inv.status = 'paid'
  inv.paidDate = new Date()
}
function download(inv) {
  alert(`Download PDF for ${inv.number}`)
}
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
.bf-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px;
}
.bf-header h2 { margin: 0; color: #213547; }
.bf-search {
  flex: 0 0 320px; max-width: 60vw;
  padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 10px; background:#fafafa; outline: none;
}
.bf-search:focus { border-color: #e6b23a; }

.bf-cards {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;
}
.bf-card {
  display: flex; align-items: center; gap: 14px; padding: 16px;
  border-radius: 14px; background:#fff; box-shadow: 0 2px 12px #00000012; border: 1px solid #f0f0f0;
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
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px;
}
.chart-card {
  background:#fff; border:1px solid #f0f0f0; border-radius:14px; box-shadow:0 2px 12px #00000010; padding:16px;
}
.chart-card h3 { margin:0 0 10px; color:#213547; font-size:1.1rem; }

.bf-table-card {
  background:#fff; border-radius:14px; box-shadow:0 2px 12px #0000000f; border:1px solid #f0f0f0; padding: 8px;
}
.table-toolbar { display:flex; justify-content:space-between; align-items:center; padding:8px 6px 6px; }
.hint { color:#777; }

.table-wrap { overflow-x:auto; }
.bf-table { width:100%; border-collapse:collapse; }
.bf-table thead th {
  text-align:left; padding:12px 10px; border-bottom:2px solid #f0f0f0;
  font-weight:700; color:#213547; user-select:none; cursor:pointer; white-space:nowrap; position:relative;
}
.sortable::after {
  content:''; position:absolute; right:8px; top:50%;
  border-left:4px solid transparent; border-right:4px solid transparent; border-top:6px solid #c0c0c0;
  transform: translateY(-8px);
}
.sort-asc::after  { border-top:6px solid #1976d2; transform: translateY(-2px) rotate(180deg); }
.sort-desc::after { border-top:6px solid #1976d2; transform: translateY(-8px); }

.bf-table tbody td { padding:12px 10px; border-bottom:1px solid #f5f5f5; color:#213547; }
.bf-table tbody tr:hover { background:#fafafa; }

.pill {
  padding:6px 10px; border-radius:999px; font-weight:700; font-size:.78rem; text-transform:uppercase;
  border:1px solid transparent; white-space:nowrap;
}
.pill.paid     { color:#1f7a1f; background:#ecfaec; border-color:#cfeccc; }
.pill.pending  { color:#114f8f; background:#e3f0fc; border-color:#d2e6fa; }
.pill.overdue  { color:#9a4b00; background:#fff4e5; border-color:#ffe0b2; }
.pill.draft    { color:#555; background:#f5f5f5; border-color:#e0e0e0; }
.pill.cancelled{ color:#9c1f1f; background:#ffebee; border-color:#ffcdd2; }

.actions { display:flex; gap:10px; }
.link-btn { background:transparent; border:none; color:#1976d2; font-weight:700; cursor:pointer; }
.link-btn.ok { color:#2e7d32; }
.center { text-align:center; }
.muted { color:#777; }
.mono { font-family: ui-monospace, Menlo, Consolas, Monaco, monospace; }
.ellipsis { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }

@media (max-width: 900px) {
  .bf-cards { grid-template-columns: repeat(2, 1fr); }
  .bf-charts { grid-template-columns: 1fr; }
  .bf-search { flex: 1; min-width: 0; }
}
@media (max-width: 560px) {
  .bf-cards { grid-template-columns: 1fr; }
  .ellipsis { max-width: 160px; }
}
</style>