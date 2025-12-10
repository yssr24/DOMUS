const admin = require('firebase-admin')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const nodemailer = require('nodemailer')
const paths = require('../config/paths')
const { FRONTEND_BASE_URL } = require('../config/appConfig')
const crypto = require('crypto')


const nodemailerSendgrid = require('nodemailer-sendgrid');

const transporter = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: process.env.SENDGRID_API_KEY
  })
);

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
    from: `"DOMUS" <${process.env.EMAIL_FROM}>`,
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
// List files under "files/"
exports.getFiles = async (_req, res) => {
  try {
    const admin = require('../config/database')
    const bucket = admin.storage().bucket()
    console.log('Storage bucket:', bucket.name) // debug

    const prefix = 'files/'
    const [gcsFiles] = await bucket.getFiles({ prefix })

    const items = []
    for (const f of gcsFiles) {
      if (f.name.endsWith('/')) continue
      const [meta] = await f.getMetadata()
      const baseName = f.name.substring(f.name.lastIndexOf('/') + 1)
      items.push({
        id: f.name,
        path: f.name, // e.g., files/my.pdf
        name: baseName,
        type: meta.contentType || '',
        size: Number(meta.size) || 0,
        uploadedAt: meta.updated || meta.timeCreated || null
      })
    }
    items.sort((a,b) => new Date(b.uploadedAt||0) - new Date(a.uploadedAt||0))
    res.json({ success: true, data: items })
  } catch (err) {
    console.error('getFiles error:', err?.message)
    res.status(500).json({ success: false, message: 'Failed to list files.' })
  }
}

// Stream a file (fixes CORS/range for pdf.js)
exports.streamFile = async (req, res) => {
  try {
    const path = String(req.query.path || '')
    if (!path || !path.startsWith('files/')) {
      return res.status(400).json({ success: false, message: 'Invalid path.' })
    }
    const admin = require('../config/database')
    const bucket = admin.storage().bucket()
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
      .on('error', e => {
        console.error('streamFile error:', e?.message)
        if (!res.headersSent) res.status(500).end('Stream error')
      })
      .pipe(res)
  } catch (err) {
    console.error('streamFile error:', err?.message)
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to stream file.' })
  }
}

// ...existing code...

// Handle contact form submission
exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, message, senderId } = req.body

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' })
    }

    // Save to Firestore messages collection
    const messageData = {
      projectId: null,
      senderId: senderId || null,
      senderName: name,
      senderEmail: email, // User's email saved in database
      receiverId: 'admin',
      text: message,
      files: [],
      type: 'contact',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    }

    const docRef = await admin.firestore().collection('messages').add(messageData)

    // Send email notification to DOMUS
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); padding: 32px; }
          .logo { display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
          .logo img { width: 48px; height: 48px; margin-right: 12px; }
          .logo-text { font-size: 1.8rem; font-weight: 700; color: #e6b23a; letter-spacing: 2px; }
          h2 { text-align: center; color: #213547; margin-bottom: 24px; }
          .info { background: #f9f6f2; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
          .info-row { margin-bottom: 10px; }
          .label { font-weight: 600; color: #5a6675; }
          .value { color: #213547; }
          .email-link { color: #1976d2; text-decoration: none; }
          .email-link:hover { text-decoration: underline; }
          .message-box { background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 16px; margin-top: 16px; }
          .footer { text-align: center; color: #888; font-size: 0.9rem; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; }
          .reply-note { background: #e3f2fd; border-radius: 8px; padding: 12px; margin-top: 16px; text-align: center; }
          .reply-note a { color: #1976d2; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="https://firebasestorage.googleapis.com/v0/b/dts-capstone.firebasestorage.app/o/img%2Fdomus.png?alt=media&token=c374d8fd-0bb7-4747-99d6-2f1938bc68cc" alt="DOMUS">
            <span class="logo-text">DOMUS</span>
          </div>
          <h2>New Contact Form Submission</h2>
          <div class="info">
            <div class="info-row">
              <span class="label">From:</span>
              <span class="value">${name}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <a href="mailto:${email}" class="email-link">${email}</a>
            </div>
          </div>
          <div class="message-box">
            <div class="label" style="margin-bottom: 8px;">Message:</div>
            <p style="color: #213547; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <div class="reply-note">
            <p style="margin: 0;">To reply to this message, click: <a href="mailto:${email}?subject=Re: DOMUS Contact Form">${email}</a></p>
          </div>
          <div class="footer">
            This message was sent via the DOMUS website contact form.
          </div>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: `"DOMUS Architecture" <${process.env.EMAIL_FROM}>`, // SendGrid verified sender
      to: 'domus.architecture92@gmail.com',
      subject: `New Contact Form Message from ${name} (${email})`,
      html: emailHtml
    })

    res.json({ success: true, messageId: docRef.id, message: 'Message sent successfully!' })
  } catch (err) {
    console.error('Contact form error:', err)
    res.status(500).json({ success: false, message: 'Failed to send message.' })
  }
}
// ...existing code...
exports.getOverviewStats = async (req, res) => {
  try {
    const usersRef = admin.firestore().collection('users')
    const userStatusRef = admin.firestore().collection('userStatus')
    const projectsRef = admin.firestore().collection('projects')

    // Get all users
    const usersSnapshot = await usersRef.get()
    let totalUsers = 0
    let totalClients = 0

    usersSnapshot.forEach(doc => {
      const data = doc.data()
      totalUsers++
      if (data.role === 'client') {
        totalClients++
      }
    })

    // Get active users (online status)
    const statusSnapshot = await userStatusRef.where('state', '==', 'online').get()
    const activeUsers = statusSnapshot.size

    // Get total projects
    const projectsSnapshot = await projectsRef.get()
    const totalProjects = projectsSnapshot.size

    res.json({
      success: true,
      totalUsers,
      activeUsers,
      totalProjects,
      totalClients
    })
  } catch (err) {
    console.error('Error fetching overview stats:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch overview stats.' })
  }
}

// Get project stats by status
exports.getProjectStats = async (req, res) => {
  try {
    const projectsRef = admin.firestore().collection('projects')
    const snapshot = await projectsRef.get()

    const statusCounts = {
      pending: 0,
      design: 0,
      review: 0,
      construction: 0,
      completed: 0
    }

    snapshot.forEach(doc => {
      const data = doc.data()
      const status = (data.status || 'pending').toLowerCase()
      
      if (status === 'pending' || status === 'planning') {
        statusCounts.pending++
      } else if (status === 'design') {
        statusCounts.design++
      } else if (status === 'review' || status === 'on review' || status === 'in review') {
        statusCounts.review++
      } else if (status === 'construction' || status === 'in-progress') {
        statusCounts.construction++
      } else if (status === 'completed' || status === 'done') {
        statusCounts.completed++
      } else {
        statusCounts.pending++ // default to pending
      }
    })

    res.json({
      success: true,
      ...statusCounts
    })
  } catch (err) {
    console.error('Error fetching project stats:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch project stats.' })
  }
}