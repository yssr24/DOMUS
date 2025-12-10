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


exports.addProject = async (req, res) => {
  try {
    const {
      title, description, location, clientId, staffId,
      leadArchitect, createdAt, status, dueDate
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
      location: location || null,
      clientId,
      staffId: staffId || null,
      staffAssigned: staffId ? [staffId] : [],
      leadArchitect: leadArchitect || '',
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: dueDate || null,
      status: status || 'pending',
      code
    })

    // Fetch selected user's data using clientId
    const userDocRef = db.collection('users').doc(clientId)
    const userDoc = await userDocRef.get()
    let clientEmail = ''
    let clientName = ''
    
    if (userDoc.exists) {
      const u = userDoc.data()
      clientEmail = u.email
      const firstname = u.firstname || ''
      const lastname = u.lastname || ''
      clientName = [firstname, lastname].filter(Boolean).join(' ')
      
      // If user role is 'user', update it to 'client'
      if (u.role === 'user') {
        // Update role in users collection
        await userDocRef.update({ 
          role: 'client',
          assignedProjects: admin.firestore.FieldValue.arrayUnion(projectDocRef.id)
        })
        
        // Also create/update entry in clients collection using same document ID
        await db.collection('clients').doc(clientId).set({
          userId: clientId,
          name: clientName || `${firstname} ${lastname}`.trim(),
          firstname: firstname,
          lastname: lastname,
          email: clientEmail,
          profilePic: u.profilePic || null,
          gender: u.gender || null,
          assignedProjects: admin.firestore.FieldValue.arrayUnion(projectDocRef.id),
          createdAt: u.createdAt || new Date().toISOString(),
          convertedAt: new Date().toISOString()
        }, { merge: true })
      } else if (u.role === 'client') {
        // User is already a client, just add the project to their assignedProjects
        await userDocRef.update({
          assignedProjects: admin.firestore.FieldValue.arrayUnion(projectDocRef.id)
        })
        
        // Update clients collection as well
        await db.collection('clients').doc(clientId).update({
          assignedProjects: admin.firestore.FieldValue.arrayUnion(projectDocRef.id)
        }).catch(async () => {
          // If client doc doesn't exist, create it
          await db.collection('clients').doc(clientId).set({
            userId: clientId,
            name: clientName || `${firstname} ${lastname}`.trim(),
            firstname: firstname,
            lastname: lastname,
            email: clientEmail,
            profilePic: u.profilePic || null,
            gender: u.gender || null,
            assignedProjects: [projectDocRef.id],
            createdAt: u.createdAt || new Date().toISOString(),
            convertedAt: new Date().toISOString()
          })
        })
      }
    }

    // Create notification document
    const message = `A new project (${code}) has been created for you.`
    await db.collection('notifications').add({
      userId: clientId,
      projectId: projectDocRef.id,
      type: 'created_project',
      message,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
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
// ...existing code...

// Stream a file from Firebase Storage
exports.streamFile = async (req, res) => {
  try {
    const { path } = req.query
    
    if (!path) {
      return res.status(400).json({ success: false, message: 'No file path provided' })
    }

    const bucket = admin.storage().bucket()
    const file = bucket.file(path)

    // Check if file exists
    const [exists] = await file.exists()
    if (!exists) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    // Get file metadata
    const [metadata] = await file.getMetadata()
    const contentType = metadata.contentType || 'application/octet-stream'
    const fileSize = metadata.size

    // Set response headers
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', fileSize)
    res.setHeader('Accept-Ranges', 'bytes')
    
    // Handle range requests for PDF viewing
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      res.setHeader('Content-Length', chunkSize)

      const stream = file.createReadStream({ start, end })
      stream.pipe(res)
    } else {
      // Stream the entire file
      const stream = file.createReadStream()
      stream.on('error', (err) => {
        console.error('Stream error:', err)
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error streaming file' })
        }
      })
      stream.pipe(res)
    }
  } catch (err) {
    console.error('streamFile error:', err)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to stream file.' })
    }
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

// ...existing code...

// Overview stats
exports.getOverviewStats = async (req, res) => {
  try {
    const usersRef = admin.firestore().collection('users')
    const projectsRef = admin.firestore().collection('projects')
    const userStatusRef = admin.firestore().collection('userStatus')

    // Get all users
    const usersSnap = await usersRef.get()
    let totalUsers = 0
    let totalClients = 0
    let totalStaff = 0

    usersSnap.forEach(doc => {
      const data = doc.data()
      if (data.role === 'user') totalUsers++
      else if (data.role === 'client') totalClients++
      else if (data.role === 'staff') totalStaff++
    })

    // Get active users (online in userStatus)
    const statusSnap = await userStatusRef.where('state', '==', 'online').get()
    const activeUsers = statusSnap.size

    // Get total projects
    const projectsSnap = await projectsRef.get()
    const totalProjects = projectsSnap.size

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers + totalClients + totalStaff,
        activeUsers,
        totalProjects,
        totalClients
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to fetch overview stats.' })
  }
}

// User registration chart data
exports.getUserRegistrationStats = async (req, res) => {
  try {
    const { range } = req.query // week, month, year
    const usersRef = admin.firestore().collection('users')
    const snapshot = await usersRef.get()
    const now = new Date()
    const stats = {}

    snapshot.forEach(doc => {
      const data = doc.data()
      if (data.createdAt) {
        const created = new Date(data.createdAt)
        let key
        if (range === 'week') {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24))
          if (diffDays < 7) {
            key = dayNames[created.getDay()]
          }
        } else if (range === 'month') {
          const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24))
          if (diffDays < 30) {
            key = `Week ${Math.ceil((30 - diffDays) / 7)}`
          }
        } else if (range === 'year') {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          if (created.getFullYear() === now.getFullYear()) {
            key = monthNames[created.getMonth()]
          }
        }
        if (key) {
          stats[key] = (stats[key] || 0) + 1
        }
      }
    })

    let chartData = []
    if (range === 'week') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const today = now.getDay()
      const orderedDays = []
      for (let i = 6; i >= 0; i--) {
        orderedDays.push(dayNames[(today - i + 7) % 7])
      }
      chartData = orderedDays.map(day => ({ x: day, y: stats[day] || 0 }))
    } else if (range === 'month') {
      chartData = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => ({ x: w, y: stats[w] || 0 }))
    } else if (range === 'year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      chartData = monthNames.map(m => ({ x: m, y: stats[m] || 0 }))
    }

    res.json({ success: true, data: chartData })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to fetch registration stats.' })
  }
}

// Projects by status
exports.getProjectsByStatus = async (req, res) => {
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
      const status = (data.status || 'pending').toLowerCase().replace('-', '')
      if (status === 'inprogress' || status === 'in-progress') {
        statusCounts.design++
      } else if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++
      } else {
        statusCounts.pending++
      }
    })

    res.json({
      success: true,
      data: {
        labels: ['Pending', 'Design', 'Review', 'Construction', 'Completed'],
        series: [
          statusCounts.pending,
          statusCounts.design,
          statusCounts.review,
          statusCounts.construction,
          statusCounts.completed
        ]
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to fetch project stats.' })
  }
}

// Recent users for table
exports.getRecentUsers = async (req, res) => {
  try {
    const usersRef = admin.firestore().collection('users')
    const userStatusRef = admin.firestore().collection('userStatus')

    const usersSnap = await usersRef.orderBy('createdAt', 'desc').limit(20).get()
    const users = []

    for (const doc of usersSnap.docs) {
      const data = doc.data()
      const statusDoc = await userStatusRef.doc(doc.id).get()
      const statusData = statusDoc.exists ? statusDoc.data() : {}

      users.push({
        id: doc.id,
        name: `${data.firstname || ''} ${data.lastname || ''}`.trim() || data.name || 'N/A',
        email: data.email || 'N/A',
        role: data.role || 'user',
        status: statusData.state || statusData.status || 'offline',
        joined: data.createdAt ? new Date(data.createdAt).toISOString().slice(0, 10) : 'N/A'
      })
    }

    res.json({ success: true, data: users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to fetch recent users.' })
  }
}

// ...existing code...

// Get project details with all related data
exports.getProjectDetails = async (req, res) => {
  try {
    const { id } = req.params
    const db = admin.firestore()

    // Get project
    const projectDoc = await db.collection('projects').doc(id).get()
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }
    const project = { id: projectDoc.id, ...projectDoc.data() }

    // Get client info
    let client = {}
    if (project.clientId) {
      const clientDoc = await db.collection('users').doc(project.clientId).get()
      if (clientDoc.exists) {
        const c = clientDoc.data()
        client = {
          id: clientDoc.id,
          name: `${c.firstname || ''} ${c.lastname || ''}`.trim() || c.name || 'Unknown',
          email: c.email,
          profilePic: c.profilePic || null
        }
      }
    }

    // Get staff members
    let staffMembers = []
    const staffIds = project.staffAssigned || (project.staffId ? [project.staffId] : [])
    for (const staffId of staffIds) {
      if (!staffId) continue
      const staffDoc = await db.collection('users').doc(staffId).get()
      if (staffDoc.exists) {
        const s = staffDoc.data()
        staffMembers.push({
          id: staffDoc.id,
          name: `${s.firstname || ''} ${s.lastname || ''}`.trim() || s.name || 'Unknown',
          email: s.email,
          profilePic: s.profilePic || null
        })
      }
    }

    // Get files for this project
    const filesSnap = await db.collection('files').where('projectId', '==', id).get()
    const files = []
    for (const doc of filesSnap.docs) {
      const f = doc.data()
      let uploaderName = 'Unknown'
      if (f.uploadedBy) {
        const uploaderDoc = await db.collection('users').doc(f.uploadedBy).get()
        if (uploaderDoc.exists) {
          const u = uploaderDoc.data()
          uploaderName = `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.name || 'Unknown'
        }
      }
      files.push({ id: doc.id, ...f, uploaderName })
    }

    // Get client submissions
    const submissionsSnap = await db.collection('clientSubmissions').where('projectId', '==', id).get()
    const submissions = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get tasks
    const tasksSnap = await db.collection('tasks').where('projectId', '==', id).get()
    const tasks = []
    for (const doc of tasksSnap.docs) {
      const t = doc.data()
      let assigneeName = 'Unassigned'
      if (t.assignedTo && Array.isArray(t.assignedTo) && t.assignedTo.length > 0) {
        const assigneeDoc = await db.collection('users').doc(t.assignedTo[0]).get()
        if (assigneeDoc.exists) {
          const a = assigneeDoc.data()
          assigneeName = `${a.firstname || ''} ${a.lastname || ''}`.trim() || a.name || 'Unknown'
        }
      } else if (t.assignedTo && typeof t.assignedTo === 'string') {
        const assigneeDoc = await db.collection('users').doc(t.assignedTo).get()
        if (assigneeDoc.exists) {
          const a = assigneeDoc.data()
          assigneeName = `${a.firstname || ''} ${a.lastname || ''}`.trim() || a.name || 'Unknown'
        }
      }
      tasks.push({ id: doc.id, ...t, assigneeName })
    }

    // Build activity logs from multiple sources
    const activities = []

    // Notifications for this project
    const notifSnap = await db.collection('notifications').where('projectId', '==', id).get()
    notifSnap.docs.forEach(doc => {
      const n = doc.data()
      activities.push({ id: doc.id, type: n.type || 'notification', message: n.message, createdAt: n.createdAt })
    })

    // Messages for this project
    const messagesSnap = await db.collection('messages').where('projectId', '==', id).get()
    for (const doc of messagesSnap.docs) {
      const m = doc.data()
      let senderName = 'Unknown'
      if (m.senderId) {
        const senderDoc = await db.collection('users').doc(m.senderId).get()
        if (senderDoc.exists) {
          const s = senderDoc.data()
          senderName = `${s.firstname || ''} ${s.lastname || ''}`.trim() || s.name || 'Unknown'
        }
      }
      activities.push({
        id: doc.id, type: 'message',
        message: `${senderName}: ${(m.text || '').substring(0, 50)}${(m.text || '').length > 50 ? '...' : ''}`,
        createdAt: m.createdAt
      })
    }

    // File uploads as activities
    files.forEach(f => {
      activities.push({ id: `file-${f.id}`, type: 'file_upload', message: `${f.uploaderName} uploaded ${f.fileName}`, createdAt: f.createdAt })
    })

    // Submissions as activities
    submissions.forEach(s => {
      activities.push({ id: `sub-${s.id}`, type: 'submission', message: `Client submitted: ${(s.message || 'New submission').substring(0, 50)}`, createdAt: s.createdAt })
    })

    // Task creations as activities
    tasks.forEach(t => {
      activities.push({ id: `task-${t.id}`, type: 'task_created', message: `Task created: ${t.title}`, createdAt: t.createdAt })
    })

    res.json({ success: true, data: { project, client, staffMembers, files, submissions, tasks, activities } })
  } catch (err) {
    console.error('getProjectDetails error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch project details.' })
  }
}

// ...existing code...

// Get staff assigned to a project
exports.getProjectStaff = async (req, res) => {
  try {
    const { projectId } = req.params
    const db = admin.firestore()

    const projectDoc = await db.collection('projects').doc(projectId).get()
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    const project = projectDoc.data()
    const staffIds = project.staffAssigned || []

    const staffMembers = []
    for (const staffId of staffIds) {
      const staffDoc = await db.collection('users').doc(staffId).get()
      if (staffDoc.exists) {
        const s = staffDoc.data()
        staffMembers.push({
          id: staffDoc.id,
          name: `${s.firstname || ''} ${s.lastname || ''}`.trim() || s.name || 'Unknown',
          email: s.email,
          profilePic: s.profilePic || null,
          role: s.role
        })
      }
    }

    res.json({ success: true, data: staffMembers })
  } catch (err) {
    console.error('getProjectStaff error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch project staff.' })
  }
}

// Get all available staff members
exports.getAvailableStaff = async (req, res) => {
  try {
    const { excludeProjectId } = req.query
    const db = admin.firestore()

    const staffSnap = await db.collection('users').where('role', '==', 'staff').get()
    
    let excludedStaffIds = []
    if (excludeProjectId) {
      const projectDoc = await db.collection('projects').doc(excludeProjectId).get()
      if (projectDoc.exists) {
        excludedStaffIds = projectDoc.data().staffAssigned || []
      }
    }

    const staffList = []
    staffSnap.forEach(doc => {
      if (!excludedStaffIds.includes(doc.id)) {
        const s = doc.data()
        staffList.push({
          id: doc.id,
          name: `${s.firstname || ''} ${s.lastname || ''}`.trim() || s.name || 'Unknown',
          email: s.email,
          profilePic: s.profilePic || null
        })
      }
    })

    res.json({ success: true, data: staffList })
  } catch (err) {
    console.error('getAvailableStaff error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch available staff.' })
  }
}

// Send staff assignment email
async function sendStaffAssignedEmail({ to, staffName, projectCode, projectTitle, projectLink }) {
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
        .btn { display: inline-block; background: #1976d2; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
        .btn:hover { background: #1565c0; }
        .footer { text-align: center; color: #888; font-size: 0.9rem; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="https://firebasestorage.googleapis.com/v0/b/dts-capstone.firebasestorage.app/o/img%2Fdomus.png?alt=media&token=c374d8fd-0bb7-4747-99d6-2f1938bc68cc" alt="DOMUS">
          <span class="logo-text">DOMUS</span>
        </div>
        <h2>You've Been Assigned to a Project!</h2>
        <p style="text-align: center; color: #213547;">Hello <strong>${staffName}</strong>,</p>
        <p style="text-align: center; color: #5a6675;">You have been assigned to work on a new project.</p>
        <div class="info">
          <div class="info-row">
            <span class="label">Project Code:</span>
            <span class="value">${projectCode}</span>
          </div>
          <div class="info-row">
            <span class="label">Project Title:</span>
            <span class="value">${projectTitle}</span>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${projectLink}" class="btn">View Project</a>
        </div>
        <div class="footer">
          This is an automated message from DOMUS Architecture.
        </div>
      </div>
    </body>
    </html>
  `

  return transporter.sendMail({
    from: `"DOMUS Architecture" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `You've been assigned to project ${projectCode} - DOMUS`,
    html: emailHtml
  })
}

// Assign staff to project
exports.assignStaffToProject = async (req, res) => {
  try {
    const { projectId, staffId } = req.body
    const db = admin.firestore()

    if (!projectId || !staffId) {
      return res.status(400).json({ success: false, message: 'projectId and staffId are required.' })
    }

    // Get project
    const projectRef = db.collection('projects').doc(projectId)
    const projectDoc = await projectRef.get()
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, message: 'Project not found.' })
    }
    const project = projectDoc.data()

    // Check if staff already assigned
    const currentStaff = project.staffAssigned || []
    if (currentStaff.includes(staffId)) {
      return res.status(400).json({ success: false, message: 'Staff is already assigned to this project.' })
    }

    // Update project with new staff
    await projectRef.update({
      staffAssigned: admin.firestore.FieldValue.arrayUnion(staffId),
      updatedAt: new Date().toISOString()
    })

    // Update staff's assignedProjects
    const staffRef = db.collection('users').doc(staffId)
    const staffDoc = await staffRef.get()
    if (staffDoc.exists) {
      await staffRef.update({
        assignedProjects: admin.firestore.FieldValue.arrayUnion(projectId)
      })
    }

    // Get staff info for email and notification
    const staffData = staffDoc.exists ? staffDoc.data() : null
    const staffName = staffData ? `${staffData.firstname || ''} ${staffData.lastname || ''}`.trim() : 'Staff'
    const staffEmail = staffData?.email

    // Create notification
    const notificationMessage = `You have been assigned to project ${project.code || projectId}: ${project.title || 'Untitled'}`
    await db.collection('notifications').add({
      userId: staffId,
      projectId: projectId,
      type: 'staff_assigned',
      message: notificationMessage,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    // Send email notification
    if (staffEmail) {
      const projectLink = `${FRONTEND_BASE_URL}/staff/projects`
      try {
        await sendStaffAssignedEmail({
          to: staffEmail,
          staffName: staffName || 'Team Member',
          projectCode: project.code || projectId,
          projectTitle: project.title || 'Untitled',
          projectLink
        })
      } catch (e) {
        console.error('Staff assignment email failed:', e.message)
      }
    }

    res.json({ 
      success: true, 
      message: 'Staff assigned successfully.',
      staff: {
        id: staffId,
        name: staffName,
        email: staffEmail,
        profilePic: staffData?.profilePic || null
      }
    })
  } catch (err) {
    console.error('assignStaffToProject error:', err)
    res.status(500).json({ success: false, message: 'Failed to assign staff.' })
  }
}

// Remove staff from project
exports.removeStaffFromProject = async (req, res) => {
  try {
    const { projectId, staffId } = req.body
    const db = admin.firestore()

    if (!projectId || !staffId) {
      return res.status(400).json({ success: false, message: 'projectId and staffId are required.' })
    }

    // Update project - remove staff
    const projectRef = db.collection('projects').doc(projectId)
    const projectDoc = await projectRef.get()
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, message: 'Project not found.' })
    }
    const project = projectDoc.data()

    await projectRef.update({
      staffAssigned: admin.firestore.FieldValue.arrayRemove(staffId),
      updatedAt: new Date().toISOString()
    })

    // Update staff's assignedProjects
    const staffRef = db.collection('users').doc(staffId)
    await staffRef.update({
      assignedProjects: admin.firestore.FieldValue.arrayRemove(projectId)
    })

    // Create notification for removal
    await db.collection('notifications').add({
      userId: staffId,
      projectId: projectId,
      type: 'staff_removed',
      message: `You have been removed from project ${project.code || projectId}: ${project.title || 'Untitled'}`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ success: true, message: 'Staff removed successfully.' })
  } catch (err) {
    console.error('removeStaffFromProject error:', err)
    res.status(500).json({ success: false, message: 'Failed to remove staff.' })
  }
}

// ...existing code...

// Get notifications for admin
exports.getAdminNotifications = async (req, res) => {
  try {
    const { adminId, limit = 20 } = req.query
    if (!adminId) {
      return res.status(400).json({ success: false, message: 'adminId is required' })
    }

    const db = admin.firestore()

    // Get notifications where userId matches adminId
    const notifsSnap = await db.collection('notifications')
      .where('userId', '==', adminId)
      .get()

    let notifications = []
    notifsSnap.forEach(doc => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      })
    })

    // Sort by createdAt descending
    notifications.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })

    notifications = notifications.slice(0, parseInt(limit))

    res.json({ success: true, data: notifications })
  } catch (err) {
    console.error('getAdminNotifications error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' })
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
    await db.collection('notifications').doc(notificationId).update({ read: true })

    res.json({ success: true })
  } catch (err) {
    console.error('markNotificationRead error:', err)
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' })
  }
}

// Mark all notifications as read for admin
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const { adminId } = req.body
    if (!adminId) {
      return res.status(400).json({ success: false, message: 'adminId is required' })
    }

    const db = admin.firestore()
    const notifsSnap = await db.collection('notifications')
      .where('userId', '==', adminId)
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
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' })
  }
}

// ...existing code...

// Upload file and notify client
exports.uploadFile = async (req, res) => {
  try {
    const { fileName, projectId, description, uploadedBy, uploaderEmail } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    if (!fileName || !projectId) {
      return res.status(400).json({ success: false, message: 'File name and project are required' })
    }

    const db = admin.firestore()
    const bucket = admin.storage().bucket()

    // Get project details
    const projectDoc = await db.collection('projects').doc(projectId).get()
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }
    const project = projectDoc.data()

    // Get client details
    let clientEmail = null
    let clientName = null
    if (project.clientId) {
      const clientDoc = await db.collection('users').doc(project.clientId).get()
      if (clientDoc.exists) {
        const clientData = clientDoc.data()
        clientEmail = clientData.email
        clientName = [clientData.firstname, clientData.lastname].filter(Boolean).join(' ') || clientData.email
      }
    }

    // Upload file to Firebase Storage
    const ext = file.originalname.split('.').pop().toLowerCase()
    const storagePath = `files/${projectId}/${Date.now()}_${fileName}.${ext}`
    const fileRef = bucket.file(storagePath)

    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedBy: uploadedBy || 'admin'
        }
      }
    })

    // Make file publicly accessible
    await fileRef.makePublic()
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`

    // Determine file type
    const typeMap = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', bmp: 'image',
      pdf: 'pdf',
      doc: 'doc', docx: 'doc',
      xls: 'sheet', xlsx: 'sheet', csv: 'sheet',
      dwg: 'cad', dxf: 'cad',
      ppt: 'ppt', pptx: 'ppt'
    }
    const fileType = typeMap[ext] || ext

    // Save to files collection
    const fileData = {
      projectId,
      uploadedBy: uploadedBy || null,
      fileName: `${fileName}.${ext}`,
      fileUrl,
      type: fileType,
      size: file.size,
      description: description || '',
      createdAt: new Date().toISOString()
    }

    const fileDocRef = await db.collection('files').add(fileData)

    // Create notification for client
    if (project.clientId) {
      await db.collection('notifications').add({
        userId: project.clientId,
        projectId,
        type: 'file_upload',
        message: `A new file "${fileName}.${ext}" has been uploaded to your project "${project.title || project.code}"`,
        read: false,
        createdAt: new Date().toISOString()
      })
    }

    // Send email notification to client
    if (clientEmail) {
      try {
        const projectLink = `${FRONTEND_BASE_URL}/projects/${projectId}`
        
        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New File Uploaded - DOMUS</title>
  <style>
    body { background: #f5f5f5; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); padding: 32px 28px; }
    .logo { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .logo img { width: 48px; height: 48px; margin-right: 12px; }
    .logo-text { font-size: 1.8rem; font-weight: 700; color: #e6b23a; letter-spacing: 2px; }
    h2 { text-align: center; color: #213547; margin: 0 0 16px 0; }
    .file-box { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .file-name { font-weight: 700; color: #213547; font-size: 1.1rem; margin: 0 0 8px 0; }
    .file-meta { color: #666; font-size: 0.95rem; margin: 4px 0; }
    .btn { display: block; width: 100%; background: #e6b23a; color: #fff; font-weight: 600; font-size: 1.1rem; border: none; border-radius: 8px; padding: 14px 0; margin: 24px 0 12px 0; text-align: center; text-decoration: none; box-shadow: 0 4px 14px rgba(230, 178, 58, 0.3); }
    .note { font-size: 0.95rem; color: #888; text-align: center; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://firebasestorage.googleapis.com/v0/b/dts-capstone.firebasestorage.app/o/img%2Fdomus.png?alt=media&token=c374d8fd-0bb7-4747-99d6-2f1938bc68cc" alt="DOMUS">
      <span class="logo-text">DOMUS</span>
    </div>
    <h2>New File Uploaded</h2>
    <p style="text-align:center; color:#555;">Hello ${clientName || 'there'},</p>
    <p style="text-align:center; color:#555;">A new file has been uploaded to your project:</p>
    
    <div class="file-box">
      <p class="file-name">📄 ${fileName}.${ext}</p>
      <p class="file-meta"><strong>Project:</strong> ${project.code || ''} - ${project.title || 'Your Project'}</p>
      ${description ? `<p class="file-meta"><strong>Description:</strong> ${description}</p>` : ''}
      <p class="file-meta"><strong>Size:</strong> ${(file.size / 1024).toFixed(1)} KB</p>
    </div>
    
    <a href="${projectLink}" class="btn">View Project</a>
    
    <p class="note">
      If you have any questions, please contact our team.<br>
      Thank you for choosing DOMUS Architecture!
    </p>
  </div>
</body>
</html>
        `

        await transporter.sendMail({
          from: `"DOMUS" <${process.env.EMAIL_FROM}>`,
          to: clientEmail,
          subject: `New File Uploaded - ${project.code || 'Your Project'}`,
          html: emailHtml
        })

        console.log(`Email notification sent to ${clientEmail}`)
      } catch (emailErr) {
        console.error('Failed to send email notification:', emailErr)
        // Don't fail the upload if email fails
      }
    }

    // Also notify assigned staff
    if (project.staffAssigned && project.staffAssigned.length > 0) {
      for (const staffId of project.staffAssigned) {
        await db.collection('notifications').add({
          userId: staffId,
          projectId,
          type: 'file_upload',
          message: `A new file "${fileName}.${ext}" has been uploaded to project "${project.code || project.title}"`,
          read: false,
          createdAt: new Date().toISOString()
        })
      }
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: fileDocRef.id,
        ...fileData
      }
    })

  } catch (err) {
    console.error('uploadFile error:', err)
    res.status(500).json({ success: false, message: err.message || 'Failed to upload file' })
  }
}

// ...existing code...
// ...existing code...

// ========================
// INVOICE / BILLING MANAGEMENT
// ========================

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const db = admin.firestore()
    const invoicesSnap = await db.collection('invoices').orderBy('createdAt', 'desc').get()
    
    const invoices = []
    for (const doc of invoicesSnap.docs) {
      const data = doc.data()
      
      // Get project info
      let projectName = '—'
      if (data.projectId) {
        const projectDoc = await db.collection('projects').doc(data.projectId).get()
        if (projectDoc.exists) {
          const p = projectDoc.data()
          projectName = `${p.code || ''} - ${p.title || 'Untitled'}`.trim()
        }
      }
      
      invoices.push({
        id: doc.id,
        ...data,
        projectName,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        dueDate: data.dueDate?.toDate?.() || data.dueDate,
        paidDate: data.paidDate?.toDate?.() || data.paidDate,
        invoiceDate: data.invoiceDate?.toDate?.() || data.invoiceDate
      })
    }
    
    res.json({ success: true, data: invoices })
  } catch (err) {
    console.error('getInvoices error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch invoices.' })
  }
}

// Get single invoice
exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params
    const db = admin.firestore()
    
    const invoiceDoc = await db.collection('invoices').doc(id).get()
    if (!invoiceDoc.exists) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    
    const data = invoiceDoc.data()
    
    // Get project info
    let projectName = '—'
    if (data.projectId) {
      const projectDoc = await db.collection('projects').doc(data.projectId).get()
      if (projectDoc.exists) {
        const p = projectDoc.data()
        projectName = `${p.code || ''} - ${p.title || 'Untitled'}`.trim()
      }
    }
    
    res.json({
      success: true,
      data: {
        id: invoiceDoc.id,
        ...data,
        projectName,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        dueDate: data.dueDate?.toDate?.() || data.dueDate,
        paidDate: data.paidDate?.toDate?.() || data.paidDate,
        invoiceDate: data.invoiceDate?.toDate?.() || data.invoiceDate
      }
    })
  } catch (err) {
    console.error('getInvoice error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch invoice.' })
  }
}

// Upload invoice file
exports.uploadInvoice = async (req, res) => {
  try {
    const { projectId, vendor, uploadedBy } = req.body
    const file = req.file
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }
    
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project is required' })
    }
    
    const db = admin.firestore()
    const bucket = admin.storage().bucket()
    
    // Get project info
    const projectDoc = await db.collection('projects').doc(projectId).get()
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }
    const project = projectDoc.data()
    
    // Generate invoice number
    const invoicesSnap = await db.collection('invoices').orderBy('number', 'desc').limit(1).get()
    let nextNum = 1
    if (!invoicesSnap.empty) {
      const lastInvoice = invoicesSnap.docs[0].data()
      const match = lastInvoice.number?.match(/INV-(\d+)/)
      if (match) nextNum = parseInt(match[1], 10) + 1
    }
    const invoiceNumber = `INV-${String(nextNum).padStart(5, '0')}`
    
    // Upload file to Firebase Storage
    const ext = file.originalname.split('.').pop().toLowerCase()
    const timestamp = Date.now()
    const storagePath = `invoices/${projectId}/${timestamp}_${invoiceNumber}.${ext}`
    const fileRef = bucket.file(storagePath)
    const token = crypto.randomUUID()
    
    await fileRef.save(file.buffer, {
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: token,
          originalName: file.originalname,
          uploadedBy: uploadedBy || 'admin'
        }
      }
    })
    
    const encodedPath = encodeURIComponent(storagePath)
    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`
    
    // Create invoice document (initially unparsed)
    const invoiceData = {
      number: invoiceNumber,
      invoiceNumber: invoiceNumber,
      projectId,
      projectCode: project.code || projectId,
      vendor: vendor || '',
      fileName: file.originalname,
      fileUrl,
      storagePath,
      fileSize: file.size,
      fileType: file.mimetype,
      status: 'pending',
      parsed: false,
      totalAmount: null,
      invoiceDate: null,
      dueDate: null,
      lineItems: [],
      uploadedBy: uploadedBy || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    const invoiceRef = await db.collection('invoices').add(invoiceData)
    
    // Send to Parsio for OCR processing
    try {
      await sendToParsio(fileUrl, invoiceRef.id, file.mimetype)
    } catch (parsioErr) {
      console.error('Parsio send error:', parsioErr)
      // Continue even if Parsio fails - manual entry can be done later
    }
    
    // Create notification
    await db.collection('notifications').add({
      userId: uploadedBy || 'admin',
      projectId,
      type: 'invoice_uploaded',
      message: `Invoice ${invoiceNumber} uploaded for project ${project.code || project.title}`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
    res.json({
      success: true,
      invoiceId: invoiceRef.id,
      data: {
        id: invoiceRef.id,
        ...invoiceData,
        createdAt: new Date().toISOString()
      }
    })
    
  } catch (err) {
    console.error('uploadInvoice error:', err)
    res.status(500).json({ success: false, message: err.message || 'Failed to upload invoice.' })
  }
}

// Send file to Parsio for parsing
async function sendToParsio(fileUrl, invoiceId, mimeType) {
  const PARSIO_API_KEY = process.env.PARSIO_API_KEY
  const PARSIO_MAILBOX_ID = process.env.PARSIO_MAILBOX_ID
  
  if (!PARSIO_API_KEY || !PARSIO_MAILBOX_ID) {
    console.warn('Parsio credentials not configured')
    return
  }
  
  const fetch = (await import('node-fetch')).default
  
  // Parsio API endpoint for document upload
  const parsioUrl = `https://api.parsio.io/mailboxes/${PARSIO_MAILBOX_ID}/documents`
  
  const response = await fetch(parsioUrl, {
    method: 'POST',
    headers: {
      'X-API-Key': PARSIO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: fileUrl,
      metadata: {
        invoiceId: invoiceId,
        source: 'domus_billing'
      }
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Parsio API error: ${response.status} - ${errorText}`)
  }
  
  const result = await response.json()
  console.log('Parsio document submitted:', result)
  return result
}

// Parsio webhook handler - receives parsed invoice data
exports.parsioWebhook = async (req, res) => {
  try {
    const webhookData = req.body
    console.log('Parsio webhook received:', JSON.stringify(webhookData, null, 2))
    
    // Extract invoice ID from metadata
    const invoiceId = webhookData.metadata?.invoiceId || webhookData.custom?.invoiceId
    
    if (!invoiceId) {
      console.error('No invoiceId in Parsio webhook payload')
      return res.status(400).json({ success: false, message: 'Missing invoiceId' })
    }
    
    const db = admin.firestore()
    const invoiceRef = db.collection('invoices').doc(invoiceId)
    const invoiceDoc = await invoiceRef.get()
    
    if (!invoiceDoc.exists) {
      console.error('Invoice not found:', invoiceId)
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    
    // Extract parsed data from Parsio response
    // Parsio field names may vary based on your template configuration
    const parsedData = webhookData.parsed || webhookData.data || webhookData
    
    const extractedData = {
      parsed: true,
      parsedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // Common invoice fields - adjust based on your Parsio template
      invoiceNumber: parsedData.invoice_number || parsedData.invoiceNumber || parsedData.number || invoiceDoc.data().invoiceNumber,
      vendor: parsedData.vendor || parsedData.supplier || parsedData.company_name || parsedData.from || invoiceDoc.data().vendor,
      
      // Amount fields
      totalAmount: parseAmount(parsedData.total || parsedData.total_amount || parsedData.grand_total || parsedData.amount),
      subtotal: parseAmount(parsedData.subtotal || parsedData.sub_total),
      tax: parseAmount(parsedData.tax || parsedData.vat || parsedData.tax_amount),
      
      // Date fields
      invoiceDate: parseDate(parsedData.invoice_date || parsedData.date || parsedData.issue_date),
      dueDate: parseDate(parsedData.due_date || parsedData.payment_due),
      
      // Additional fields
      currency: parsedData.currency || 'PHP',
      description: parsedData.description || parsedData.memo || '',
      poNumber: parsedData.po_number || parsedData.purchase_order || '',
      
      // Line items
      lineItems: parseLineItems(parsedData.line_items || parsedData.items || parsedData.lines || []),
      
      // Raw parsed data for reference
      rawParsedData: parsedData,
      
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    // Update invoice document
    await invoiceRef.update(extractedData)
    
    // Create notification about successful parsing
    const invoice = invoiceDoc.data()
    if (invoice.uploadedBy) {
      await db.collection('notifications').add({
        userId: invoice.uploadedBy,
        projectId: invoice.projectId,
        type: 'invoice_parsed',
        message: `Invoice ${invoice.invoiceNumber} has been parsed. Total: ₱${(extractedData.totalAmount || 0).toLocaleString()}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }
    
    console.log('Invoice updated with parsed data:', invoiceId)
    res.json({ success: true, message: 'Webhook processed successfully' })
    
  } catch (err) {
    console.error('parsioWebhook error:', err)
    res.status(500).json({ success: false, message: 'Webhook processing failed' })
  }
}

// Helper function to parse amount
function parseAmount(value) {
  if (!value) return null
  if (typeof value === 'number') return value
  
  // Remove currency symbols and commas
  const cleaned = String(value).replace(/[₱$€£,\s]/g, '').trim()
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? null : parsed
}

// Helper function to parse date
function parseDate(value) {
  if (!value) return null
  
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return null
    return admin.firestore.Timestamp.fromDate(date)
  } catch {
    return null
  }
}

// Helper function to parse line items
function parseLineItems(items) {
  if (!Array.isArray(items)) return []
  
  return items.map((item, index) => ({
    lineNumber: index + 1,
    description: item.description || item.item || item.name || '',
    quantity: parseFloat(item.quantity || item.qty || 1) || 1,
    unitPrice: parseAmount(item.unit_price || item.price || item.rate),
    amount: parseAmount(item.amount || item.total || item.line_total),
    unit: item.unit || item.uom || ''
  })).filter(item => item.description || item.amount)
}

// Mark invoice as paid
exports.markInvoicePaid = async (req, res) => {
  try {
    const { id } = req.params
    const { paidDate, paymentMethod, paymentReference } = req.body
    
    const db = admin.firestore()
    const invoiceRef = db.collection('invoices').doc(id)
    const invoiceDoc = await invoiceRef.get()
    
    if (!invoiceDoc.exists) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    
    const invoice = invoiceDoc.data()
    
    await invoiceRef.update({
      status: 'paid',
      paidDate: paidDate ? admin.firestore.Timestamp.fromDate(new Date(paidDate)) : admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: paymentMethod || 'unknown',
      paymentReference: paymentReference || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
    // Create notification
    if (invoice.projectId) {
      const projectDoc = await db.collection('projects').doc(invoice.projectId).get()
      if (projectDoc.exists) {
        const project = projectDoc.data()
        
        // Notify client
        if (project.clientId) {
          await db.collection('notifications').add({
            userId: project.clientId,
            projectId: invoice.projectId,
            type: 'invoice_paid',
            message: `Invoice ${invoice.invoiceNumber} for project ${project.code || project.title} has been marked as paid.`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
        }
      }
    }
    
    res.json({ success: true, message: 'Invoice marked as paid' })
    
  } catch (err) {
    console.error('markInvoicePaid error:', err)
    res.status(500).json({ success: false, message: 'Failed to update invoice.' })
  }
}

// Update invoice details
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const db = admin.firestore()
    const invoiceRef = db.collection('invoices').doc(id)
    const invoiceDoc = await invoiceRef.get()
    
    if (!invoiceDoc.exists) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    
    // Allowed fields to update
    const allowedFields = ['vendor', 'totalAmount', 'subtotal', 'tax', 'invoiceDate', 'dueDate', 'description', 'poNumber', 'status', 'lineItems']
    const filteredUpdates = {}
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (['invoiceDate', 'dueDate'].includes(field) && updates[field]) {
          filteredUpdates[field] = admin.firestore.Timestamp.fromDate(new Date(updates[field]))
        } else {
          filteredUpdates[field] = updates[field]
        }
      }
    }
    
    filteredUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp()
    
    await invoiceRef.update(filteredUpdates)
    
    res.json({ success: true, message: 'Invoice updated successfully' })
    
  } catch (err) {
    console.error('updateInvoice error:', err)
    res.status(500).json({ success: false, message: 'Failed to update invoice.' })
  }
}

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params
    
    const db = admin.firestore()
    const bucket = admin.storage().bucket()
    
    const invoiceDoc = await db.collection('invoices').doc(id).get()
    if (!invoiceDoc.exists) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    
    const invoice = invoiceDoc.data()
    
    // Delete file from storage
    if (invoice.storagePath) {
      try {
        await bucket.file(invoice.storagePath).delete()
      } catch (e) {
        console.error('Failed to delete file from storage:', e)
      }
    }
    
    // Delete invoice document
    await db.collection('invoices').doc(id).delete()
    
    res.json({ success: true, message: 'Invoice deleted successfully' })
    
  } catch (err) {
    console.error('deleteInvoice error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete invoice.' })
  }
}

// Get billing summary/stats
exports.getBillingStats = async (req, res) => {
  try {
    const db = admin.firestore()
    const invoicesSnap = await db.collection('invoices').get()
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    let totalRevenue = 0
    let revenueThisMonth = 0
    let outstandingAmount = 0
    let overdueAmount = 0
    let paidThisMonth = 0
    let pendingCount = 0
    let overdueCount = 0
    let paidCount = 0
    
    const monthlyRevenue = new Array(12).fill(0)
    
    invoicesSnap.forEach(doc => {
      const inv = doc.data()
      const amount = inv.totalAmount || 0
      
      // Get dates
      const dueDate = inv.dueDate?.toDate?.() || (inv.dueDate ? new Date(inv.dueDate) : null)
      const paidDate = inv.paidDate?.toDate?.() || (inv.paidDate ? new Date(inv.paidDate) : null)
      
      // Check if overdue
      const isOverdue = inv.status !== 'paid' && dueDate && dueDate < now
      
      if (inv.status === 'paid') {
        paidCount++
        totalRevenue += amount
        
        if (paidDate) {
          // Monthly revenue chart
          if (paidDate.getFullYear() === currentYear) {
            monthlyRevenue[paidDate.getMonth()] += amount
          }
          
          // This month
          if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
            paidThisMonth += amount
            revenueThisMonth += amount
          }
        }
      } else if (isOverdue) {
        overdueCount++
        overdueAmount += amount
        outstandingAmount += amount
      } else {
        pendingCount++
        outstandingAmount += amount
      }
    })
    
    res.json({
      success: true,
      data: {
        totalRevenue,
        revenueThisMonth,
        outstandingAmount,
        overdueAmount,
        paidThisMonth,
        pendingCount,
        overdueCount,
        paidCount,
        totalCount: invoicesSnap.size,
        monthlyRevenue
      }
    })
    
  } catch (err) {
    console.error('getBillingStats error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch billing stats.' })
  }
}

// ...existing code...