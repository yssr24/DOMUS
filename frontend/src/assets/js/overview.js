import { ref } from 'vue'
import { API_BASE_URL } from '../../config'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalProjects: 0,
  totalClients: 0,
})

export const users = ref([])
export const loading = ref(false)
export const error = ref('')

export const userChartOptions = ref({
  chart: { toolbar: { show: false } },
  xaxis: { categories: [] },
  colors: ['#1976d2'],
  dataLabels: { enabled: false },
})
export const userChartSeries = ref([{ name: 'Users', data: [] }])

export const projChartOptions = ref({
  labels: ['Pending', 'Design', 'Review', 'Construction', 'Completed'],
  colors: ['#fbc02d', '#1976d2', '#8e24aa', '#43a047', '#bdbdbd'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
})
export const projChartSeries = ref([0, 0, 0, 0, 0])

export async function fetchOverviewStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/overview-stats`)
    const result = await res.json()
    if (result.success) {
      stats.value = result.data
    }
  } catch (err) {
    console.error('Failed to fetch overview stats:', err)
  }
}

export async function fetchUserRegistrationStats(range = 'week') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/user-registration-stats?range=${range}`)
    const result = await res.json()
    if (result.success && result.data) {
      userChartOptions.value.xaxis.categories = result.data.map(d => d.x)
      userChartSeries.value = [{ name: 'Users', data: result.data.map(d => d.y) }]
    }
  } catch (err) {
    console.error('Failed to fetch user registration stats:', err)
  }
}

export async function fetchProjectsByStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/projects-by-status`)
    const result = await res.json()
    if (result.success && result.data) {
      projChartOptions.value.labels = result.data.labels
      projChartSeries.value = result.data.series
    }
  } catch (err) {
    console.error('Failed to fetch projects by status:', err)
  }
}

export async function fetchRecentUsers() {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/recent-users`)
    const result = await res.json()
    if (result.success) {
      users.value = result.data
    }
  } catch (err) {
    console.error('Failed to fetch recent users:', err)
    error.value = 'Failed to load users'
  } finally {
    loading.value = false
  }
}

export async function initOverview() {
  await Promise.all([
    fetchOverviewStats(),
    fetchUserRegistrationStats('week'),
    fetchProjectsByStatus(),
    fetchRecentUsers()
  ])
}

export function getUserRegistrationRows() {
  const cats = userChartOptions.value?.xaxis?.categories || []
  const data = userChartSeries.value?.[0]?.data || []
  const rows = cats.map((d, i) => [d, data[i] ?? 0])
  return { head: ['Day', 'Registrations'], rows }
}

export function getProjectRows() {
  const labels = projChartOptions.value?.labels || []
  const data = projChartSeries.value || []
  const rows = labels.map((s, i) => [s, data[i] ?? 0])
  return { head: ['Status', 'Count'], rows }
}

export function getUserRows() {
  const rows = (users.value || []).map(u => [u.name, u.email, u.role, u.status, u.joined])
  return { head: ['Name', 'Email', 'Role', 'Status', 'Joined'], rows }
}

export function downloadCSV() {
  const parts = []

  // Section 1: User Registrations
  const regData = getUserRegistrationRows()
  parts.push('User Registrations')
  parts.push(regData.head.join(','))
  regData.rows.forEach(r => parts.push(r.join(',')))
  parts.push('')

  // Section 2: Projects by Status
  const projData = getProjectRows()
  parts.push('Projects by Status')
  parts.push(projData.head.join(','))
  projData.rows.forEach(r => parts.push(r.join(',')))
  parts.push('')

  // Section 3: Users
  const userData = getUserRows()
  parts.push('Recent Users')
  parts.push(userData.head.join(','))
  userData.rows.forEach(r => parts.push(r.map(v => `"${v}"`).join(',')))

  const csv = parts.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `overview-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadPDF() {
  try {
    const doc = new jsPDF()
    let y = 20

    // Title
    doc.setFontSize(18)
    doc.setTextColor(33, 53, 71)
    doc.text('DOMUS Overview Report', 14, y)
    y += 10

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y)
    y += 15

    // Stats Summary
    doc.setFontSize(12)
    doc.setTextColor(33, 53, 71)
    doc.text('Summary Statistics', 14, y)
    y += 8

    doc.setFontSize(10)
    doc.text(`Total Users: ${stats.value.totalUsers}`, 14, y)
    y += 6
    doc.text(`Active Users: ${stats.value.activeUsers}`, 14, y)
    y += 6
    doc.text(`Total Projects: ${stats.value.totalProjects}`, 14, y)
    y += 6
    doc.text(`Total Clients: ${stats.value.totalClients}`, 14, y)
    y += 15

    // User Registrations Table
    doc.setFontSize(12)
    doc.text('User Registrations (This Week)', 14, y)
    y += 5

    const regData = getUserRegistrationRows()
    doc.autoTable({
      startY: y,
      head: [regData.head],
      body: regData.rows,
      theme: 'striped',
      headStyles: { fillColor: [25, 118, 210] },
      margin: { left: 14 }
    })
    y = doc.lastAutoTable.finalY + 15

    // Projects by Status Table
    doc.setFontSize(12)
    doc.text('Projects by Status', 14, y)
    y += 5

    const projData = getProjectRows()
    doc.autoTable({
      startY: y,
      head: [projData.head],
      body: projData.rows,
      theme: 'striped',
      headStyles: { fillColor: [230, 178, 58] },
      margin: { left: 14 }
    })
    y = doc.lastAutoTable.finalY + 15

    // Recent Users Table
    if (y > 220) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(12)
    doc.text('Recent Users', 14, y)
    y += 5

    const userData = getUserRows()
    doc.autoTable({
      startY: y,
      head: [userData.head],
      body: userData.rows,
      theme: 'striped',
      headStyles: { fillColor: [67, 160, 71] },
      margin: { left: 14 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      }
    })

    doc.save(`overview-${new Date().toISOString().slice(0, 10)}.pdf`)
  } catch (e) {
    console.error('PDF generation failed:', e)
    alert('Failed to generate PDF. Please try again.')
  }
}