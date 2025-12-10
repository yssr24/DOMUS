import { ref, onMounted } from 'vue'
import { API_BASE_URL } from '../../../config'

export function useOverview() {
  const loading = ref(true)
  const error = ref('')

  const stats = ref({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalClients: 0,
  })

  const users = ref([])
  const recentUsers = ref([])

  // Chart data
  const userChartOptions = ref({
    chart: { toolbar: { show: false } },
    xaxis: { categories: [] },
    colors: ['#1976d2'],
    dataLabels: { enabled: false },
  })
  const userChartSeries = ref([{ name: 'Users', data: [] }])

  const projChartOptions = ref({
    labels: ['Pending', 'Design', 'Review', 'Construction', 'Completed'],
    colors: ['#fbc02d', '#1976d2', '#8e24aa', '#43a047', '#bdbdbd'],
    legend: { position: 'bottom' },
    dataLabels: { enabled: true },
  })
  const projChartSeries = ref([0, 0, 0, 0, 0])

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/overview-stats`)
      const data = await res.json()
      if (data.success) {
        stats.value = {
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          totalProjects: data.totalProjects || 0,
          totalClients: data.totalClients || 0,
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users-with-status`)
      const data = await res.json()
      if (data.success) {
        users.value = data.data || []
        // Get 5 most recent users
        recentUsers.value = [...users.value]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  async function fetchUserRegistrationStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user-stats?range=week`)
      const data = await res.json()
      if (data.success && data.data) {
        userChartOptions.value.xaxis.categories = data.data.map(d => d.label)
        userChartSeries.value = [{ name: 'Users', data: data.data.map(d => d.count) }]
      }
    } catch (err) {
      console.error('Failed to fetch user registration stats:', err)
    }
  }

  async function fetchProjectStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/project-stats`)
      const data = await res.json()
      if (data.success) {
        projChartSeries.value = [
          data.pending || 0,
          data.design || 0,
          data.review || 0,
          data.construction || 0,
          data.completed || 0,
        ]
      }
    } catch (err) {
      console.error('Failed to fetch project stats:', err)
    }
  }

  function getUserRegistrationRows() {
    const cats = (userChartOptions.value?.xaxis?.categories || []).map(String)
    const data = (userChartSeries.value?.[0]?.data || [])
    const rows = cats.map((d, i) => [d, data[i] ?? 0])
    return { head: ['Day', 'Registrations'], rows }
  }

  function getProjectRows() {
    const labels = (projChartOptions.value?.labels || []).map(String)
    const data = (projChartSeries.value || [])
    const rows = labels.map((s, i) => [s, data[i] ?? 0])
    return { head: ['Status', 'Count'], rows }
  }

  function getUserRows() {
    const rows = (recentUsers.value || []).map(u => [
      `${u.lastname || ''}, ${u.firstname || ''}`.trim() || u.email,
      u.email,
      u.role || 'user',
      u.status || 'offline',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'
    ])
    return { head: ['Name', 'Email', 'Role', 'Status', 'Joined'], rows }
  }

  function downloadCSV() {
    const parts = []

    // Section 1: User Registrations
    const reg = getUserRegistrationRows()
    parts.push('User Registrations (Last 7 Days)')
    parts.push(reg.head.join(','))
    reg.rows.forEach(r => parts.push(r.join(',')))
    parts.push('')

    // Section 2: Projects by Status
    const proj = getProjectRows()
    parts.push('Projects by Status')
    parts.push(proj.head.join(','))
    proj.rows.forEach(r => parts.push(r.join(',')))
    parts.push('')

    // Section 3: Recent Users
    const usr = getUserRows()
    parts.push('Recent Users')
    parts.push(usr.head.join(','))
    usr.rows.forEach(r => parts.push(r.map(c => `"${c}"`).join(',')))

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

  async function downloadPDF() {
    try {
      const jsPDF = (await import('jspdf')).default
      await import('jspdf-autotable')

      const doc = new jsPDF()
      let y = 15

      doc.setFontSize(18)
      doc.text('DOMUS Overview Report', 14, y)
      y += 10

      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y)
      y += 10

      // Stats summary
      doc.setFontSize(12)
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
      y += 12

      // User Registrations Table
      const reg = getUserRegistrationRows()
      doc.autoTable({
        startY: y,
        head: [reg.head],
        body: reg.rows,
        theme: 'grid',
        headStyles: { fillColor: [25, 118, 210] },
        margin: { left: 14 }
      })
      y = doc.lastAutoTable.finalY + 10

      // Projects by Status Table
      const proj = getProjectRows()
      doc.autoTable({
        startY: y,
        head: [proj.head],
        body: proj.rows,
        theme: 'grid',
        headStyles: { fillColor: [230, 178, 58] },
        margin: { left: 14 }
      })
      y = doc.lastAutoTable.finalY + 10

      // Recent Users Table
      const usr = getUserRows()
      doc.autoTable({
        startY: y,
        head: [usr.head],
        body: usr.rows,
        theme: 'grid',
        headStyles: { fillColor: [67, 160, 71] },
        margin: { left: 14 }
      })

      doc.save(`overview-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
      console.error('PDF generation failed:', e)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  async function loadAllData() {
    loading.value = true
    error.value = ''
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchUserRegistrationStats(),
        fetchProjectStats()
      ])
    } catch (err) {
      error.value = 'Failed to load overview data'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  onMounted(loadAllData)

  return {
    loading,
    error,
    stats,
    users,
    recentUsers,
    userChartOptions,
    userChartSeries,
    projChartOptions,
    projChartSeries,
    downloadCSV,
    downloadPDF,
    loadAllData
  }
}