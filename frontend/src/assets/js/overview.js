import { ref } from 'vue'
import { API_BASE_URL } from '../../config'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

// ...existing code...

// Update the downloadPDF function to match print.vue style
export function downloadPDF() {
  const printData = {
    stats: stats.value,
    userChartData: {
      categories: userChartOptions.value?.xaxis?.categories || [],
      data: userChartSeries.value?.[0]?.data || []
    },
    projectData: {
      labels: projChartOptions.value?.labels || [],
      data: projChartSeries.value || []
    },
    users: users.value || []
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })
  
  const currentDateTime = new Date().toLocaleString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>DOMUS Overview Report</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #213547; line-height: 1.5; padding: 20px; background: #fff; }
          .page-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 2px solid #e6b23a; margin-bottom: 24px; }
          .logo-section { display: flex; align-items: center; gap: 12px; }
          .logo-placeholder { width: 48px; height: 48px; background: linear-gradient(135deg, #e6b23a 0%, #d4a12e 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 14px; }
          .title-section h1 { font-size: 24px; color: #e6b23a; margin: 0; }
          .title-section p { font-size: 12px; color: #666; margin: 0; }
          .report-info { text-align: right; }
          .report-info h2 { font-size: 18px; color: #213547; margin: 0; }
          .report-info p { font-size: 12px; color: #666; margin: 0; }
          .print-section { margin-bottom: 24px; }
          .print-section h3 { font-size: 16px; color: #213547; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .stat-box { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e0e0e0; }
          .stat-label { display: block; font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
          .stat-value { display: block; font-size: 24px; font-weight: 700; color: #1976d2; }
          .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .chart-box { background: #fafafa; border-radius: 8px; padding: 12px; border: 1px solid #eee; }
          .chart-box h4 { font-size: 13px; color: #213547; margin-bottom: 10px; }
          .data-table, .users-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .data-table th, .data-table td, .users-table th, .users-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
          .data-table th, .users-table th { background: #f5f5f5; font-weight: 600; color: #333; }
          .users-table { font-size: 10px; }
          .no-data { text-align: center; color: #999; padding: 20px !important; }
          .page-footer { display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #eee; margin-top: 40px; font-size: 10px; color: #666; }
          .status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
          .status-active, .status-online { background: #e8f5e9; color: #2e7d32; }
          .status-inactive, .status-offline { background: #f5f5f5; color: #757575; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <header class="page-header">
          <div class="logo-section">
            <div class="logo-placeholder">D</div>
            <div class="title-section">
              <h1>DOMUS</h1>
              <p>Architecture Management System</p>
            </div>
          </div>
          <div class="report-info">
            <h2>Overview Report</h2>
            <p>Generated: ${currentDate}</p>
          </div>
        </header>

        <section class="print-section">
          <h3>Statistics Summary</h3>
          <div class="stats-grid">
            <div class="stat-box"><span class="stat-label">Total Users</span><span class="stat-value">${printData.stats?.totalUsers || 0}</span></div>
            <div class="stat-box"><span class="stat-label">Active Users</span><span class="stat-value">${printData.stats?.activeUsers || 0}</span></div>
            <div class="stat-box"><span class="stat-label">Total Projects</span><span class="stat-value">${printData.stats?.totalProjects || 0}</span></div>
            <div class="stat-box"><span class="stat-label">Total Clients</span><span class="stat-value">${printData.stats?.totalClients || 0}</span></div>
          </div>
        </section>

        <section class="print-section">
          <h3>Data Analysis</h3>
          <div class="charts-grid">
            <div class="chart-box">
              <h4>User Registrations (Last 7 Days)</h4>
              <table class="data-table">
                <thead><tr><th>Day</th><th>Registrations</th></tr></thead>
                <tbody>${(printData.userChartData?.data || []).map((val, idx) => `<tr><td>${printData.userChartData?.categories?.[idx] || ''}</td><td>${val}</td></tr>`).join('')}</tbody>
              </table>
            </div>
            <div class="chart-box">
              <h4>Projects by Status</h4>
              <table class="data-table">
                <thead><tr><th>Status</th><th>Count</th></tr></thead>
                <tbody>${(printData.projectData?.data || []).map((val, idx) => `<tr><td>${printData.projectData?.labels?.[idx] || ''}</td><td>${val}</td></tr>`).join('')}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="print-section">
          <h3>Recent Users</h3>
          <table class="users-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>
              ${(printData.users || []).length > 0 
                ? (printData.users || []).map(user => `<tr><td>${user.name || ''}</td><td>${user.email || ''}</td><td>${user.role || ''}</td><td><span class="status-badge status-${(user.status || '').toLowerCase()}">${user.status || ''}</span></td><td>${user.joined || ''}</td></tr>`).join('')
                : '<tr><td colspan="5" class="no-data">No users to display</td></tr>'}
            </tbody>
          </table>
        </section>

        <footer class="page-footer">
          <div>DOMUS Architecture © ${new Date().getFullYear()}</div>
          <div>Page 1 of 1</div>
          <div>Printed: ${currentDateTime}</div>
        </footer>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to download PDF')
    return
  }
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  printWindow.onload = function() {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

// ...existing code...