import { ref, onMounted, reactive } from 'vue'
import { API_BASE_URL } from '../../../config'

export function useOverview() {
  const loading = ref(true)
  const error = ref('')

  const stats = reactive({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalClients: 0,
  })

  const users = ref([])
  const recentUsers = ref([])

  // Chart data - use reactive for proper reactivity
  const userChartOptions = ref({
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: { enabled: true }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      }
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: '#5a6675' } }
    },
    yaxis: {
      labels: { style: { colors: '#5a6675' } }
    },
    colors: ['#1976d2'],
    dataLabels: { enabled: false },
    grid: { borderColor: '#f0f0f0' }
  })

  const userChartSeries = ref([{ name: 'Registrations', data: [0, 0, 0, 0, 0, 0, 0] }])

  const projChartOptions = ref({
    chart: {
      type: 'donut',
      animations: { enabled: true }
    },
    labels: ['In Progress', 'Completed', 'Pending', 'On Hold'],
    colors: ['#1976d2', '#43a047', '#fbc02d', '#9e9e9e'],
    legend: {
      position: 'bottom',
      labels: { colors: '#5a6675' }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => Math.round(val) + '%'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: '#213547'
            }
          }
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 280 },
        legend: { position: 'bottom' }
      }
    }]
  })

  const projChartSeries = ref([0, 0, 0, 0])

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/overview-stats`)
      const data = await res.json()
      if (data.success) {
        stats.totalUsers = data.totalUsers || 0
        stats.activeUsers = data.activeUsers || 0
        stats.totalProjects = data.totalProjects || 0
        stats.totalClients = data.totalClients || 0
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
        // Get 5 most recent users, sorted by createdAt
        recentUsers.value = [...users.value]
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
            return dateB - dateA
          })
          .slice(0, 5)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  async function fetchUserRegistrationStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user-registration-stats`)
      const data = await res.json()
      if (data.success && data.data) {
        const labels = data.data.map(d => d.label)
        const counts = data.data.map(d => d.count)
        
        userChartOptions.value = {
          ...userChartOptions.value,
          xaxis: {
            ...userChartOptions.value.xaxis,
            categories: labels
          }
        }
        userChartSeries.value = [{ name: 'Registrations', data: counts }]
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
        // Update series with actual data
        projChartSeries.value = [
          data.inProgress || 0,
          data.completed || 0,
          data.pending || 0,
          data.onHold || 0
        ]
        
        // Update labels if needed
        projChartOptions.value = {
          ...projChartOptions.value,
          labels: ['In Progress', 'Completed', 'Pending', 'On Hold']
        }
      }
    } catch (err) {
      console.error('Failed to fetch project stats:', err)
    }
  }

  function getUserRegistrationRows() {
    const cats = userChartOptions.value?.xaxis?.categories || []
    const data = userChartSeries.value?.[0]?.data || []
    const rows = cats.map((d, i) => [d, data[i] ?? 0])
    return { head: ['Day', 'Registrations'], rows }
  }

  function getProjectRows() {
    const labels = projChartOptions.value?.labels || []
    const data = projChartSeries.value || []
    const rows = labels.map((s, i) => [s, data[i] ?? 0])
    return { head: ['Status', 'Count'], rows }
  }

  function getUserRows() {
    const rows = (recentUsers.value || []).map(u => {
      const name = u.name || `${u.lastname || ''}, ${u.firstname || ''}`.trim() || 'N/A'
      const email = u.email || 'N/A'
      const role = u.role || 'user'
      const status = u.status || 'offline'
      const joined = u.createdAt ? formatDateForExport(u.createdAt) : 'N/A'
      return [name, email, role, status, joined]
    })
    return { head: ['Name', 'Email', 'Role', 'Status', 'Joined'], rows }
  }

  function formatDateForExport(dateValue) {
    if (!dateValue) return 'N/A'
    try {
      // Handle Firestore timestamp
      if (dateValue._seconds) {
        return new Date(dateValue._seconds * 1000).toLocaleDateString()
      }
      // Handle ISO string or other date formats
      return new Date(dateValue).toLocaleDateString()
    } catch {
      return 'N/A'
    }
  }

  function downloadCSV() {
    const parts = []

    // Section 1: Summary Stats
    parts.push('Overview Summary')
    parts.push('Metric,Value')
    parts.push(`Total Users,${stats.totalUsers}`)
    parts.push(`Active Users,${stats.activeUsers}`)
    parts.push(`Total Projects,${stats.totalProjects}`)
    parts.push(`Total Clients,${stats.totalClients}`)
    parts.push('')

    // Section 2: User Registrations
    const reg = getUserRegistrationRows()
    parts.push('User Registrations (Last 7 Days)')
    parts.push(reg.head.join(','))
    reg.rows.forEach(r => parts.push(r.join(',')))
    parts.push('')

    // Section 3: Projects by Status
    const proj = getProjectRows()
    parts.push('Projects by Status')
    parts.push(proj.head.join(','))
    proj.rows.forEach(r => parts.push(r.join(',')))
    parts.push('')

    // Section 4: Recent Users
    const usr = getUserRows()
    parts.push('Recent Users')
    parts.push(usr.head.join(','))
    usr.rows.forEach(r => parts.push(r.map(c => `"${c}"`).join(',')))

    const csv = parts.join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `domus-overview-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function downloadPDF() {
    try {
      // Dynamic import for jsPDF
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF
      
      // Import autotable plugin
      await import('jspdf-autotable')

      const doc = new jsPDF()
      let y = 20

      // Title
      doc.setFontSize(20)
      doc.setTextColor(33, 53, 71)
      doc.text('DOMUS Overview Report', 14, y)
      y += 10

      // Date
      doc.setFontSize(10)
      doc.setTextColor(90, 102, 117)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y)
      y += 15

      // Summary Stats Box
      doc.setFontSize(14)
      doc.setTextColor(33, 53, 71)
      doc.text('Summary Statistics', 14, y)
      y += 8

      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      const statsData = [
        ['Total Users', stats.totalUsers.toString()],
        ['Active Users', stats.activeUsers.toString()],
        ['Total Projects', stats.totalProjects.toString()],
        ['Total Clients', stats.totalClients.toString()]
      ]

      doc.autoTable({
        startY: y,
        head: [['Metric', 'Value']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [25, 118, 210], textColor: 255 },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
        tableWidth: 80
      })
      y = doc.lastAutoTable.finalY + 15

      // User Registrations Table
      doc.setFontSize(14)
      doc.setTextColor(33, 53, 71)
      doc.text('User Registrations (Last 7 Days)', 14, y)
      y += 8

      const reg = getUserRegistrationRows()
      doc.autoTable({
        startY: y,
        head: [reg.head],
        body: reg.rows,
        theme: 'grid',
        headStyles: { fillColor: [25, 118, 210], textColor: 255 },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 }
      })
      y = doc.lastAutoTable.finalY + 15

      // Projects by Status Table
      doc.setFontSize(14)
      doc.setTextColor(33, 53, 71)
      doc.text('Projects by Status', 14, y)
      y += 8

      const proj = getProjectRows()
      doc.autoTable({
        startY: y,
        head: [proj.head],
        body: proj.rows,
        theme: 'grid',
        headStyles: { fillColor: [230, 178, 58], textColor: 33 },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 }
      })
      y = doc.lastAutoTable.finalY + 15

      // Check if we need a new page
      if (y > 220) {
        doc.addPage()
        y = 20
      }

      // Recent Users Table
      doc.setFontSize(14)
      doc.setTextColor(33, 53, 71)
      doc.text('Recent Users', 14, y)
      y += 8

      const usr = getUserRows()
      doc.autoTable({
        startY: y,
        head: [usr.head],
        body: usr.rows,
        theme: 'grid',
        headStyles: { fillColor: [67, 160, 71], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 }
        }
      })

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `DOMUS Architecture - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }

      doc.save(`domus-overview-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF: ' + err.message)
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