const admin = require('firebase-admin')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const nodemailer = require('nodemailer')
const paths = require('../config/paths')
const { FRONTEND_BASE_URL } = require('../config/appConfig')
const crypto = require('crypto')


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})
// Get user counts by role (already exists)
exports.getUserRoleCounts = async (req, res) => {
  try {
    const usersRef = admin.firestore().collection('users')
    const snapshot = await usersRef.get()
    let userCount = 0
    let clientCount = 0
    let staffCount = 0

    snapshot.forEach(doc => {
      const data = doc.data()
      if (data.role === 'user') userCount++
      else if (data.role === 'client') clientCount++
      else if (data.role === 'staff') staffCount++
    })

    res.json({
      success: true,
      user: userCount,
      client: clientCount,
      staff: staffCount
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch counts.' })
  }
}

// Get user registration stats for chart (week/month/year)
exports.getUserStats = async (req, res) => {
  try {
    const { range } = req.query // 'week', 'month', 'year'
    const usersRef = admin.firestore().collection('users')
    const snapshot = await usersRef.where('role', '==', 'user').get()
    const now = new Date()
    let stats = {}

    snapshot.forEach(doc => {
      const data = doc.data()
      const createdAt = data.createdAt ? new Date(data.createdAt) : null
      if (!createdAt) return

      let key
      if (range === 'week') {
        // Group by day in current week
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        if (createdAt >= startOfWeek) {
          key = createdAt.toISOString().slice(0, 10)
          stats[key] = (stats[key] || 0) + 1
        }
      } else if (range === 'month') {
        // Group by week in current month
        if (
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear()
        ) {
          const week = Math.ceil(createdAt.getDate() / 7)
          key = `Week ${week}`
          stats[key] = (stats[key] || 0) + 1
        }
      } else {
        // Group by month in current year
        if (createdAt.getFullYear() === now.getFullYear()) {
          key = createdAt.toLocaleString('default', { month: 'short' })
          stats[key] = (stats[key] || 0) + 1
        }
      }
    })

    // Format for ApexCharts
    let chartData = []
    if (range === 'week') {
      // Fill missing days
      for (let i = 0; i < 7; i++) {
        const d = new Date(now)
        d.setDate(now.getDate() - now.getDay() + i)
        const key = d.toISOString().slice(0, 10)
        chartData.push({ x: key, y: stats[key] || 0 })
      }
    } else if (range === 'month') {
      for (let i = 1; i <= 5; i++) {
        const key = `Week ${i}`
        chartData.push({ x: key, y: stats[key] || 0 })
      }
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      for (const m of months) {
        chartData.push({ x: m, y: stats[m] || 0 })
      }
    }

    res.json({ success: true, data: chartData })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user stats.' })
  }
}

exports.getClientStats = async (req, res) => {
  try {
    const { range } = req.query // 'week', 'month', 'year'
    const clientsRef = admin.firestore().collection('clients')
    const snapshot = await clientsRef.get()
    const now = new Date()
    let stats = {}

    snapshot.forEach(doc => {
      const data = doc.data()
      const createdAt = data.createdAt ? new Date(data.createdAt) : null
      if (!createdAt) return

      let key
      if (range === 'week') {
        // Group by day in current week
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        if (createdAt >= startOfWeek) {
          key = createdAt.toISOString().slice(0, 10)
          stats[key] = (stats[key] || 0) + 1
        }
      } else if (range === 'month') {
        // Group by week in current month
        if (
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear()
        ) {
          const week = Math.ceil(createdAt.getDate() / 7)
          key = `Week ${week}`
          stats[key] = (stats[key] || 0) + 1
        }
      } else {
        // Group by month in current year
        if (createdAt.getFullYear() === now.getFullYear()) {
          key = createdAt.toLocaleString('default', { month: 'short' })
          stats[key] = (stats[key] || 0) + 1
        }
      }
    })

    // Format for ApexCharts
    let chartData = []
    if (range === 'week') {
      // Fill missing days
      for (let i = 0; i < 7; i++) {
        const d = new Date(now)
        d.setDate(now.getDate() - now.getDay() + i)
        const key = d.toISOString().slice(0, 10)
        chartData.push({ x: key, y: stats[key] || 0 })
      }
    } else if (range === 'month') {
      for (let i = 1; i <= 5; i++) {
        const key = `Week ${i}`
        chartData.push({ x: key, y: stats[key] || 0 })
      }
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      for (const m of months) {
        chartData.push({ x: m, y: stats[m] || 0 })
      }
    }

    res.json({ success: true, data: chartData })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch client stats.' })
  }
}

exports.updateUserStatus = async (req, res) => {
  const { email, status } = req.body
  try {
    const usersRef = admin.firestore().collection('users')
    const snapshot = await usersRef.where('email', '==', email).get()
    if (snapshot.empty) return res.status(404).json({ success: false, message: 'User not found.' })
    const userDoc = snapshot.docs[0]
    const userId = userDoc.id

    // Save status in "userStatus" collection, using userId as doc id
    await admin.firestore().collection('userStatus').doc(userId).set({
      userId: userId,
      status: status,
      lastSeen: new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status.' })
  }
}

// Add this to adminController.js
exports.getUsersWithStatus = async (req, res) => {
  try {
    const role = req.query.role || 'user'
    const usersRef = admin.firestore().collection('users')
    const statusRef = admin.firestore().collection('userStatus')
    const userSnap = await usersRef.where('role', '==', role).get()
    let data = []
    for (const doc of userSnap.docs) {
      const user = doc.data()
      const statusDoc = await statusRef.doc(doc.id).get()
      const statusData = statusDoc.exists ? statusDoc.data() : {}
      data.push({
        id: doc.id,
        firstname: user.firstname,
        lastname: user.lastname,
        status: statusData.status || 'offline',
        lastSeen: statusData.lastSeen || null
      })
    }
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' })
  }
}

exports.addUserDirect = async (req, res) => {
  try {
    const { firstname, lastname, gender, email, password, createdAt, role } = req.body
    // Check if email already exists
    const usersRef = admin.firestore().collection('users')
    const snapshot = await usersRef.where('email', '==', email).get()
    if (!snapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already registered.'
      })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    await usersRef.add({
      firstname,
      lastname,
      gender,
      email,
      password: hashedPassword,
      createdAt,
      role: role || 'user'
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add user.' })
  }
}

exports.updateUserDirect = async (req, res) => {
  try {
    const { id, firstname, lastname, gender, email, role } = req.body
    const usersRef = admin.firestore().collection('users')
    const userDoc = await usersRef.doc(id).get()
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    await usersRef.doc(id).update({
      firstname,
      lastname,
      gender,
      email,
      role
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user.' })
  }
}

exports.getUser = async (req, res) => {
  try {
    const { id } = req.query
    const usersRef = admin.firestore().collection('users')
    const userDoc = await usersRef.doc(id).get()
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    const user = userDoc.data()
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' })
  }
}

async function sendProjectCreatedEmail({ to, clientName, projectLink }) {
  let html = fs.readFileSync(paths.createdProjectTemplate, 'utf8')
  html = html.replace('[Client Name]', clientName || 'Client')
  html = html.replace('[PROJECT_LINK]', projectLink)
  return transporter.sendMail({
    from: `"DOMUS" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your project has been created - DOMUS Architecture',
    html
  })
}

// Create project + notification + email
exports.addProject = async (req, res) => {
  try {
    const {
      title, description, location, clientId, staffId,
      leadArchitect, createdAt, status
    } = req.body

    const db = admin.firestore()

    // Generate sequential code PR-0001, PR-0002...
    const snap = await db.collection('projects')
      .orderBy('code', 'desc')
      .limit(1)
      .get()

    let nextNum = 1
    if (!snap.empty) {
      const lastCode = snap.docs[0].data().code // e.g. PR-0032
      const m = lastCode && lastCode.match(/PR-(\d+)/)
      if (m) nextNum = parseInt(m[1], 10) + 1
    }
    const code = `PR-${String(nextNum).padStart(4, '0')}`

    // Save project
    const projectDocRef = await db.collection('projects').add({
      title,
      description: description || '',
      location: location || null, // { province, city, barangay, zip }
      clientId,                   // user doc id from users collection
      staffId: staffId || null,
      leadArchitect: leadArchitect || '',
      createdAt: createdAt || new Date().toISOString(),
      status: status || 'pending',
      code
    })

    // Fetch selected user's email/name using clientId
    const userDoc = await db.collection('users').doc(clientId).get()
    let clientEmail = ''
    let clientName = ''
    if (userDoc.exists) {
      const u = userDoc.data()
      clientEmail = u.email
      clientName = [u.firstname, u.lastname].filter(Boolean).join(' ')
    }

    // Create notification document
    // Collection: notifications
    // Fields: userId, type, message, read, createdAt, projectId, projectCode, title
    const message = `A new project (${code}) has been created for you.`
    await db.collection('notifications').add({
      userId: clientId,
      type: 'created_project',
      message,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      projectId: projectDocRef.id,
      projectCode: code,
      title
    })

    // Send email if email is available
    if (clientEmail) {
      const projectLink = `${FRONTEND_BASE_URL}/projects`
      try {
        await sendProjectCreatedEmail({
          to: clientEmail,
          clientName: clientName || 'Client',
          projectLink
        })
      } catch (e) {
        // Do not fail the whole request if email fails
        console.error('Email send failed:', e.message)
      }
    }

    res.json({ success: true, id: projectDocRef.id, code })
  } catch (err) {
    console.error('addProject error:', err)
    res.status(500).json({ success: false, message: 'Failed to add project.' })
  }
}

exports.getProjectsForClient = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.json({ success: false, message: 'Missing email' });

    const db = require('firebase-admin').firestore();
    // Find the user by email to get their userId
    const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (userSnap.empty) return res.json({ success: false, message: 'User not found' });

    const userId = userSnap.docs[0].id;

    // Now get projects where clientId == userId
    const projSnap = await db.collection('projects').where('clientId', '==', userId).get();
    const projects = [];
    projSnap.forEach(doc => projects.push({ id: doc.id, ...doc.data() }));

    res.json({ success: true, projects });
  } catch (err) {
    res.json({ success: false, message: 'Failed to fetch projects.' });
  }
};

// ...existing code...
exports.getAllProjects = async (req, res) => {
  try {
    const db = admin.firestore()
    const snap = await db.collection('projects').get()
    const projects = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Collect unique clientIds from projects
    const clientIds = [...new Set(projects.map(p => p.clientId).filter(Boolean))]

    // Helper: Firestore "in" query max 10
    const chunk = (arr, size = 10) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))

    // Build a map { userId: "Lastname, Firstname" }
    const usersRef = db.collection('users')
    const ownerMap = {}
    for (const batch of chunk(clientIds, 10)) {
      const q = await usersRef.where(admin.firestore.FieldPath.documentId(), 'in', batch).get()
      q.forEach(doc => {
        const u = doc.data()
        const first = (u.firstname || '').trim()
        const last = (u.lastname || '').trim()
        const name = [last, first].filter(Boolean).join(', ') || (u.email || '—')
        ownerMap[doc.id] = name
      })
    }

    const data = projects.map(p => ({
      id: p.id,
      code: p.code || p.projectCode || p.id,
      title: p.title || p.projectTitle || 'Untitled',
      status: p.status || 'pending',
      clientId: p.clientId || '',
      ownerName: ownerMap[p.clientId] || '—',
    }))

    res.json({ success: true, data })
  } catch (err) {
    console.error('getAllProjects error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch projects.' })
  }
}


exports.createTask = async (req, res) => {
  try {
    const db = admin.firestore()
    const {
      projectId,
      title,
      description = '',
      status = 'todo',
      assignedTo = [],
      deadline,     // ISO string or timestamp
      createdByEmail
    } = req.body || {}

    if (!projectId || !title || !Array.isArray(assignedTo) || !createdByEmail) {
      return res.status(400).json({ success: false, message: 'projectId, title, assignedTo[], createdByEmail are required.' })
    }

    // Resolve createdBy userId from email
    const usersRef = db.collection('users')
    const creatorSnap = await usersRef.where('email', '==', createdByEmail).limit(1).get()
    if (creatorSnap.empty) return res.status(400).json({ success: false, message: 'Creator not found.' })
    const createdBy = creatorSnap.docs[0].id

    const payload = {
      projectId,
      title,
      description,
      status,
      assignedTo,
      createdBy,
      sharedBy: null,
      files: [],
      deadline: deadline ? admin.firestore.Timestamp.fromDate(new Date(deadline)) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }

    const docRef = await db.collection('tasks').add(payload)
    res.json({ success: true, id: docRef.id, data: { id: docRef.id, ...payload } })
  } catch (err) {
    console.error('createTask error:', err)
    res.status(500).json({ success: false, message: 'Failed to create task.' })
  }
}

function chunk(arr, size = 10) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}

// List tasks with joined project code/title and assignee names
exports.getTasks = async (_req, res) => {
  try {
    const db = admin.firestore()

    // fetch tasks
    const snap = await db.collection('tasks').get()
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // unique ids (as arrays)
    const projIds = Array.from(new Set(tasks.map(t => t.projectId).filter(Boolean)))
    const assigneeIds = Array.from(
      new Set(
        tasks.flatMap(t => (Array.isArray(t.assignedTo) ? t.assignedTo : [])).filter(Boolean)
      )
    )

    // build project map
    const projectsMap = {}
    for (const group of chunk(projIds, 10)) {
      if (!group.length) continue
      const q = await db
        .collection('projects')
        .where(admin.firestore.FieldPath.documentId(), 'in', group)
        .get()
      q.forEach(doc => {
        const p = doc.data() || {}
        const code = p.code || p.projectCode || doc.id
        const title = p.title || p.projectTitle || 'Untitled'
        projectsMap[doc.id] = { code, title }
      })
    }

    // build users map
    const usersMap = {}
    for (const group of chunk(assigneeIds, 10)) {
      if (!group.length) continue
      const q = await db
        .collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', group)
        .get()
      q.forEach(doc => {
        const u = doc.data() || {}
        const fn = (u.firstname || u.firstName || '').trim()
        const ln = (u.lastname || u.lastName || '').trim()
        const name = [ln, fn].filter(Boolean).join(', ') || (u.email || '—')
        usersMap[doc.id] = name
      })
    }

    // shape response
    const data = tasks.map(t => {
      const proj = projectsMap[t.projectId] || null
      const assignees = (Array.isArray(t.assignedTo) ? t.assignedTo : [])
        .map(id => usersMap[id] || '—')

      const deadline =
        t.deadline && typeof t.deadline.toDate === 'function'
          ? t.deadline.toDate()
          : t.deadline || null

      return {
        id: t.id,
        title: t.title || '',
        status: t.status || 'todo',
        projectId: t.projectId || '',
        projectTitle: proj ? `${proj.code} | ${proj.title}` : (t.projectId || '—'),
        assigneeName: assignees.join(', ') || '—',
        dueDate: deadline
      }
    })

    res.json({ success: true, data })
  } catch (err) {
    console.error('getTasks error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' })
  }
}

exports.addDesign = async (req, res) => {
  try {
    const { title = '', description = '', createdAt } = req.body || {}
    const files = Array.isArray(req.files) ? req.files : []

    const bucket = require('../config/database').storage().bucket()
    const imageUrls = []

    for (const f of files) {
      const safeName = f.originalname.replace(/\s+/g, '_')
      const filePath = `design/${Date.now()}-${safeName}`
      const token = crypto.randomUUID()

      const file = bucket.file(filePath)
      await file.save(f.buffer, {
        resumable: false,
        contentType: f.mimetype,
        metadata: {
          contentType: f.mimetype,
          metadata: { firebaseStorageDownloadTokens: token }
        }
      })

      const encoded = encodeURIComponent(filePath)
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`
      imageUrls.push(url)
    }

    const doc = {
      title: title.trim(),
      description: description.trim(),
      createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
      images: imageUrls
    }

    const ref = await require('firebase-admin').firestore().collection('designs').add(doc)

    res.json({ success: true, id: ref.id, data: { id: ref.id, ...doc } })
  } catch (err) {
    console.error('addDesign error:', err)
    res.status(500).json({ success: false, message: 'Failed to save design.' })
  }
}

exports.getDesigns = async (req, res) => {
  try {
    const snap = await admin.firestore()
      .collection('designs')
      .orderBy('createdAt', 'desc')
      .get()

    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json({ success: true, data })
  } catch (err) {
    console.error('getDesigns error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch designs.' })
  }
}

// ...existing code...

// List files under "fil/" (no signed URLs; we stream via backend)
exports.getFiles = async (req, res) => {
  try {
    const [files] = await admin.storage().bucket().getFiles({ prefix: 'files/' })
    const result = files.map(f => ({
      name: f.name,
      size: f.metadata?.size,
      contentType: f.metadata?.contentType,
      updated: f.metadata?.updated,
      md5Hash: f.metadata?.md5Hash,
    }))
    return res.json({ files: result })
  } catch (e) {
    if (e.code === 404 || e?.errors?.[0]?.reason === 'notFound') {
      return res.status(200).json({
        files: [],
        warning: `Storage bucket "${admin.bucketName || 'unknown'}" does not exist. Create it in Firebase Console or set FIREBASE_STORAGE_BUCKET.`,
      })
    }
    console.error('getFiles error:', e)
    return res.status(500).json({ error: 'Failed to list files' })
  }
}

// Stream a file from Storage (fixes browser CORS for pdf.js/image)
// GET /api/admin/file?path=fil/xyz.pdf&disposition=inline|attachment
exports.streamFile = async (req, res) => {
  try {
    const path = String(req.query.path || '')
    if (!path || !path.startsWith('files/')) {
      return res.status(400).json({ success: false, message: 'Invalid path.' })
    }
    const bucket = require('../config/database').storage().bucket()
    const file = bucket.file(path)
    const [exists] = await file.exists()
    if (!exists) return res.status(404).json({ success: false, message: 'Not found.' })

    const [meta] = await file.getMetadata()
    const baseName = path.substring(path.lastIndexOf('/') + 1)
    const disp = String(req.query.disposition || 'inline').toLowerCase() === 'attachment' ? 'attachment' : 'inline'

    res.setHeader('Content-Type', meta.contentType || 'application/octet-stream')
    res.setHeader('Content-Disposition', `${disp}; filename="${encodeURIComponent(baseName)}"`)
    res.setHeader('Cache-Control', 'private, max-age=60')
    res.setHeader('Access-Control-Allow-Origin', '*')

    file.createReadStream()
      .on('error', (e) => {
        console.error('streamFile error:', e)
        if (!res.headersSent) res.status(500).end('Stream error')
      })
      .pipe(res)
  } catch (err) {
    console.error('streamFile error:', err)
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to stream file.' })
  }
}
// ...existing code...