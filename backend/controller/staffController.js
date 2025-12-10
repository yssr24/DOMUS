const admin = require('firebase-admin')

// Get staff dashboard overview data
exports.getStaffOverview = async (req, res) => {
  try {
    const { staffId } = req.query
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'staffId is required' })
    }

    const db = admin.firestore()

    // Get tasks assigned to this staff
    const tasksSnap = await db.collection('tasks')
      .where('assignedTo', 'array-contains', staffId)
      .get()

    const tasks = []
    const projectIds = new Set()

    tasksSnap.forEach(doc => {
      const data = doc.data()
      tasks.push({
        id: doc.id,
        ...data,
        deadline: data.deadline?.toDate?.() || data.deadline,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      })
      if (data.projectId) projectIds.add(data.projectId)
    })

    // Get projects assigned to this staff
    const projectsSnap = await db.collection('projects')
      .where('staffAssigned', 'array-contains', staffId)
      .get()

    const projects = []
    projectsSnap.forEach(doc => {
      const data = doc.data()
      projects.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      })
      projectIds.add(doc.id)
    })

    // Build project map for task enrichment
    const projectMap = {}
    for (const p of projects) {
      projectMap[p.id] = p
    }

    // Fetch any missing projects referenced in tasks
    for (const pid of projectIds) {
      if (!projectMap[pid]) {
        const pDoc = await db.collection('projects').doc(pid).get()
        if (pDoc.exists) {
          const pData = pDoc.data()
          projectMap[pid] = {
            id: pDoc.id,
            ...pData,
            createdAt: pData.createdAt?.toDate?.() || pData.createdAt,
            updatedAt: pData.updatedAt?.toDate?.() || pData.updatedAt
          }
        }
      }
    }

    // Enrich tasks with project info
    const enrichedTasks = tasks.map(t => ({
      ...t,
      projectCode: projectMap[t.projectId]?.code || t.projectId,
      projectTitle: projectMap[t.projectId]?.title || 'Unknown Project'
    }))

    // Get notifications for this staff
    const notifsSnap = await db.collection('notifications')
      .where('userId', '==', staffId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const notifications = []
    notifsSnap.forEach(doc => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      })
    })

    const unreadCount = notifications.filter(n => !n.read).length

    // Calculate KPIs
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const openTasks = enrichedTasks.filter(t => t.status !== 'done').length
    const dueThisWeek = enrichedTasks.filter(t => {
      if (t.status === 'done' || !t.deadline) return false
      const deadline = new Date(t.deadline)
      return deadline >= now && deadline <= weekFromNow
    }).length

    const overdueTasks = enrichedTasks.filter(t => {
      if (t.status === 'done' || !t.deadline) return false
      return new Date(t.deadline) < now
    }).length

    // Task status counts for chart
    const statusCounts = { todo: 0, 'in-progress': 0, review: 0, done: 0 }
    enrichedTasks.forEach(t => {
      const status = t.status || 'todo'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Activity data (tasks updated in last 7 days)
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      last7Days.push({
        date: d,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: 0
      })
    }

    enrichedTasks.forEach(t => {
      if (!t.updatedAt) return
      const updated = new Date(t.updatedAt)
      updated.setHours(0, 0, 0, 0)
      const dayData = last7Days.find(d => d.date.getTime() === updated.getTime())
      if (dayData) dayData.count++
    })

    res.json({
      success: true,
      data: {
        tasks: enrichedTasks,
        projects: Object.values(projectMap),
        notifications,
        stats: {
          openTasks,
          dueThisWeek,
          overdueTasks,
          projectsAssigned: projects.length,
          unreadNotices: unreadCount
        },
        charts: {
          statusCounts: [statusCounts.todo, statusCounts['in-progress'], statusCounts.review, statusCounts.done],
          activityDays: last7Days.map(d => d.label),
          activityData: last7Days.map(d => d.count)
        }
      }
    })
  } catch (err) {
    console.error('getStaffOverview error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch staff overview.' })
  }
}

// Get staff's assigned projects
exports.getStaffProjects = async (req, res) => {
  try {
    const { staffId } = req.query
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'staffId is required' })
    }

    const db = admin.firestore()

    const projectsSnap = await db.collection('projects')
      .where('staffAssigned', 'array-contains', staffId)
      .get()

    const projects = []
    const clientIds = new Set()

    projectsSnap.forEach(doc => {
      const data = doc.data()
      projects.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      })
      if (data.clientId) clientIds.add(data.clientId)
    })

    // Get client names
    const clientMap = {}
    for (const cid of clientIds) {
      const cDoc = await db.collection('users').doc(cid).get()
      if (cDoc.exists) {
        const cData = cDoc.data()
        clientMap[cid] = `${cData.lastname || ''}, ${cData.firstname || ''}`.trim() || cData.email
      }
    }

    // Get task counts per project
    const projectTaskCounts = {}
    for (const p of projects) {
      const taskSnap = await db.collection('tasks')
        .where('projectId', '==', p.id)
        .get()
      
      let openTasks = 0
      taskSnap.forEach(doc => {
        if (doc.data().status !== 'done') openTasks++
      })
      projectTaskCounts[p.id] = openTasks
    }

    const enrichedProjects = projects.map(p => ({
      ...p,
      clientName: clientMap[p.clientId] || '—',
      tasksOpen: projectTaskCounts[p.id] || 0
    }))

    res.json({ success: true, data: enrichedProjects })
  } catch (err) {
    console.error('getStaffProjects error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch staff projects.' })
  }
}

// Get staff's tasks
exports.getStaffTasks = async (req, res) => {
  try {
    const { staffId } = req.query
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'staffId is required' })
    }

    const db = admin.firestore()

    const tasksSnap = await db.collection('tasks')
      .where('assignedTo', 'array-contains', staffId)
      .get()

    const tasks = []
    const projectIds = new Set()

    tasksSnap.forEach(doc => {
      const data = doc.data()
      tasks.push({
        id: doc.id,
        ...data,
        deadline: data.deadline?.toDate?.() || data.deadline,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      })
      if (data.projectId) projectIds.add(data.projectId)
    })

    // Get project info
    const projectMap = {}
    for (const pid of projectIds) {
      const pDoc = await db.collection('projects').doc(pid).get()
      if (pDoc.exists) {
        const pData = pDoc.data()
        projectMap[pid] = {
          code: pData.code,
          title: pData.title
        }
      }
    }

    const enrichedTasks = tasks.map(t => ({
      ...t,
      projectCode: projectMap[t.projectId]?.code || t.projectId,
      projectTitle: projectMap[t.projectId]?.title || 'Unknown'
    }))

    res.json({ success: true, data: enrichedTasks })
  } catch (err) {
    console.error('getStaffTasks error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch staff tasks.' })
  }
}

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId, status, staffId } = req.body
    if (!taskId || !status) {
      return res.status(400).json({ success: false, message: 'taskId and status are required' })
    }

    const db = admin.firestore()
    const taskRef = db.collection('tasks').doc(taskId)
    const taskDoc = await taskRef.get()

    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }

    await taskRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ success: true, message: 'Task status updated' })
  } catch (err) {
    console.error('updateTaskStatus error:', err)
    res.status(500).json({ success: false, message: 'Failed to update task status.' })
  }
}

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.body
    if (!notificationId) {
      return res.status(400).json({ success: false, message: 'notificationId is required' })
    }

    const db = admin.firestore()
    await db.collection('notifications').doc(notificationId).update({
      read: true
    })

    res.json({ success: true })
  } catch (err) {
    console.error('markNotificationRead error:', err)
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' })
  }
}

// Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const { staffId } = req.body
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'staffId is required' })
    }

    const db = admin.firestore()
    const notifsSnap = await db.collection('notifications')
      .where('userId', '==', staffId)
      .where('read', '==', false)
      .get()

    const batch = db.batch()
    notifsSnap.forEach(doc => {
      batch.update(doc.ref, { read: true })
    })
    await batch.commit()

    res.json({ success: true })
  } catch (err) {
    console.error('markAllNotificationsRead error:', err)
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' })
  }
}