const admin = require('firebase-admin')
const nodemailer = require('nodemailer')
const fs = require('fs')
const paths = require('../config/paths')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { FRONTEND_BASE_URL } = require('../config/appConfig')


require('dotenv').config()

// Temporarily store users before verification
const tempUsers = {}

const resetTokens = {}

const nodemailerSendgrid = require('nodemailer-sendgrid');

const transporter = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: process.env.SENDGRID_API_KEY
  })
);


// Helper to generate code and expiration
function generateVerification(email, userData) {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes from now
  tempUsers[email] = { ...userData, verificationCode, expiresAt }
  return { verificationCode, expiresAt }
}

// Send verification email
function sendVerificationEmail(email, code) {
  let html = fs.readFileSync(paths.emailTemplate, 'utf8')
  html = html.replace('123456', code)
  return transporter.sendMail({
    from: `"DOMUS" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'DOMUS Email Verification',
    html
  })
}

exports.login = async (req, res) => {
  const { email, password } = req.body
  const usersRef = admin.firestore().collection('users')
  const snapshot = await usersRef.where('email', '==', email).get()
  if (snapshot.empty) {
    return res.json({ success: false, message: 'Invalid email or password.' })
  }
  const userDoc = snapshot.docs[0]
  const userData = userDoc.data()
  const valid = await bcrypt.compare(password, userData.password)
  if (!valid) {
    return res.json({ success: false, message: 'Invalid email or password.' })
  }
  // Don't send password back, but include the document ID
  const { password: _, ...user } = userData
  res.json({ success: true, user: { ...user, id: userDoc.id } })
}

exports.signup = async (req, res) => {
  const { firstname, lastname, gender, email, password, createdAt } = req.body

  // Check if email already exists in Firestore
  const usersRef = admin.firestore().collection('users')
  const snapshot = await usersRef.where('email', '==', email).get()
  if (!snapshot.empty) {
    return res.status(400).json({
      success: false,
      message: 'This email address is already registered. Please use a different email or log in.'
    })
  }

  // Add role: 'user' to temp user data
  const { verificationCode } = generateVerification(email, { firstname, lastname, gender, email, password, createdAt, role: 'user' })
  try {
    await sendVerificationEmail(email, verificationCode)
    res.json({ success: true })
  } catch (err) {
    console.error('Error sending email:', err)
    res.status(500).json({ success: false, message: 'Failed to send verification email.' })
  }
}

// Verify: check code and expiration, hash password, save to Firestore with role
exports.verify = async (req, res) => {
  const { email, code } = req.body
  const user = tempUsers[email]
  if (
    user &&
    user.verificationCode === code &&
    Date.now() < user.expiresAt
  ) {
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(user.password, 10)
    await admin.firestore().collection('users').add({
      firstname: user.firstname,
      lastname: user.lastname,
      gender: user.gender,
      email: user.email,
      password: hashedPassword,
      createdAt: user.createdAt,
      role: user.role || 'user' // ensure role is saved
    })
    delete tempUsers[email]
    res.json({ success: true })
  } else {
    res.json({ success: false, message: 'Invalid or expired code.' })
  }
}

// Resend code: generate new code, expire old one
exports.resendCode = async (req, res) => {
  const { email } = req.body
  const user = tempUsers[email]
  if (!user) return res.status(400).json({ success: false, message: 'User not found.' })
  const { verificationCode } = generateVerification(email, user)
  try {
    await sendVerificationEmail(email, verificationCode)
    res.json({ success: true })
  } catch (err) {
    console.error('Error sending email:', err)
    res.status(500).json({ success: false, message: 'Failed to resend verification email.' })
  }
}

exports.forgotPassword = async (req, res) => {
  const { email } = req.body
  // Find user by email in Firestore
  const usersRef = admin.firestore().collection('users')
  const snapshot = await usersRef.where('email', '==', email).get()
  if (snapshot.empty) {
    return res.json({ success: false, message: 'Email not found.' })
  }
  // Generate token and expiry
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes
  resetTokens[email] = { token, expiresAt }
  // Prepare email template
  let html = fs.readFileSync(paths.forgotPasswordTemplate, 'utf8')
  const changeLink = `${FRONTEND_BASE_URL}/change-password?email=${encodeURIComponent(email)}&token=${token}`
  html = html.replace('CHANGE_PASSWORD_LINK', `<a href="${changeLink}" style="color:#e6b23a;">Change Password</a>`)
  // Send email
  await transporter.sendMail({
    from: `"DOMUS" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'DOMUS Password Reset',
    html
  })
  res.json({ success: true, message: 'Reset link sent if email exists.' })
}

exports.changePassword = async (req, res) => {
  const { email, token, newPassword } = req.body
  const entry = resetTokens[email]
  if (!entry || entry.token !== token || Date.now() > entry.expiresAt) {
    return res.json({ success: false, message: 'Invalid or expired reset link.' })
  }
  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  // Update password in Firestore
  const usersRef = admin.firestore().collection('users')
  const snapshot = await usersRef.where('email', '==', email).get()
  if (snapshot.empty) {
    return res.json({ success: false, message: 'User not found.' })
  }
  const userDoc = snapshot.docs[0]
  await userDoc.ref.update({ password: hashedPassword })
  delete resetTokens[email]
  res.json({ success: true, message: 'Password updated successfully.' })
}

// ...existing code...

// Get notifications for client
exports.getClientNotifications = async (req, res) => {
  try {
    const { clientId, limit = 20 } = req.query
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'clientId is required' })
    }

    const db = admin.firestore()

    const notifsSnap = await db.collection('notifications')
      .where('userId', '==', clientId)
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
    console.error('getClientNotifications error:', err)
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

// Mark all notifications as read for client
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const { clientId } = req.body
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'clientId is required' })
    }

    const db = admin.firestore()
    const notifsSnap = await db.collection('notifications')
      .where('userId', '==', clientId)
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

// Get project details for client
exports.getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params
    const { clientId } = req.query

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' })
    }

    const db = admin.firestore()

    // Get project
    const projectDoc = await db.collection('projects').doc(projectId).get()
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    const project = { id: projectDoc.id, ...projectDoc.data() }

    // Verify client has access to this project
    if (clientId && project.clientId !== clientId) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    // Get staff members assigned to this project
    const staffMembers = []
    if (project.staffAssigned && project.staffAssigned.length > 0) {
      for (const staffId of project.staffAssigned) {
        try {
          const staffDoc = await db.collection('users').doc(staffId).get()
          if (staffDoc.exists) {
            const staffData = staffDoc.data()
            staffMembers.push({
              id: staffDoc.id,
              name: [staffData.firstname, staffData.lastname].filter(Boolean).join(' ') || staffData.email,
              email: staffData.email,
              profilePic: staffData.profilePic || null,
              role: staffData.role
            })
          }
        } catch (e) {
          console.error('Error fetching staff:', e)
        }
      }
    }

    // Get tasks for this project to calculate progress
    const tasksSnap = await db.collection('tasks')
      .where('projectId', '==', projectId)
      .get()

    const tasks = []
    let totalTasks = 0
    let completedTasks = 0

    tasksSnap.forEach(doc => {
      const task = { id: doc.id, ...doc.data() }
      tasks.push(task)
      totalTasks++
      if (task.status === 'done' || task.status === 'completed') {
        completedTasks++
      }
    })

    // Calculate progress percentage
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    res.json({
      success: true,
      data: {
        ...project,
        progress,
        staffMembers,
        taskStats: {
          total: totalTasks,
          completed: completedTasks,
          todo: tasks.filter(t => t.status === 'todo').length,
          inProgress: tasks.filter(t => t.status === 'in-progress').length,
          review: tasks.filter(t => t.status === 'review').length
        }
      }
    })
  } catch (err) {
    console.error('getProjectDetails error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch project details' })
  }
}

// Get files for a project
exports.getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' })
    }

    const db = admin.firestore()

    const filesSnap = await db.collection('files')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .get()

    const files = []
    const uploaderIds = new Set()

    filesSnap.forEach(doc => {
      const data = doc.data()
      files.push({
        id: doc.id,
        ...data,
        uploadedAt: data.createdAt
      })
      if (data.uploadedBy) {
        uploaderIds.add(data.uploadedBy)
      }
    })

    // Get uploader names
    const uploaderMap = {}
    for (const uid of uploaderIds) {
      try {
        const userDoc = await db.collection('users').doc(uid).get()
        if (userDoc.exists) {
          const userData = userDoc.data()
          uploaderMap[uid] = [userData.firstname, userData.lastname].filter(Boolean).join(' ') || userData.email
        }
      } catch (e) {
        uploaderMap[uid] = 'Unknown'
      }
    }

    // Enrich files with uploader names
    const enrichedFiles = files.map(f => ({
      ...f,
      uploaderName: uploaderMap[f.uploadedBy] || 'System'
    }))

    res.json({ success: true, data: enrichedFiles })
  } catch (err) {
    console.error('getProjectFiles error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch project files' })
  }
}

// Get client submissions for a project
exports.getProjectSubmissions = async (req, res) => {
  try {
    const { projectId } = req.params

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' })
    }

    const db = admin.firestore()

    const submissionsSnap = await db.collection('clientSubmissions')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .get()

    const submissions = []

    submissionsSnap.forEach(doc => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      })
    })

    res.json({ success: true, data: submissions })
  } catch (err) {
    console.error('getProjectSubmissions error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch submissions' })
  }
}

// Get activity logs for a project
exports.getProjectActivities = async (req, res) => {
  try {
    const { projectId } = req.params

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' })
    }

    const db = admin.firestore()
    const activities = []

    // Get notifications/activities related to this project
    const notifsSnap = await db.collection('notifications')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    notifsSnap.forEach(doc => {
      const data = doc.data()
      activities.push({
        id: doc.id,
        type: data.type,
        message: data.message,
        createdAt: data.createdAt,
        userId: data.userId
      })
    })

    // Get file uploads as activities
    const filesSnap = await db.collection('files')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    filesSnap.forEach(doc => {
      const data = doc.data()
      activities.push({
        id: `file_${doc.id}`,
        type: 'file_upload',
        message: `File "${data.fileName}" was uploaded`,
        createdAt: data.createdAt,
        fileName: data.fileName,
        fileType: data.type
      })
    })

    // Get submissions as activities
    const subsSnap = await db.collection('clientSubmissions')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    subsSnap.forEach(doc => {
      const data = doc.data()
      activities.push({
        id: `sub_${doc.id}`,
        type: 'submission',
        message: data.message || 'Client submitted files',
        createdAt: data.createdAt,
        files: data.files
      })
    })

    // Get task activities
    const tasksSnap = await db.collection('tasks')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    tasksSnap.forEach(doc => {
      const data = doc.data()
      activities.push({
        id: `task_${doc.id}`,
        type: 'task_created',
        message: `Task "${data.title}" was created`,
        createdAt: data.createdAt,
        taskTitle: data.title,
        taskStatus: data.status
      })
    })

    // Sort all activities by date
    activities.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    res.json({ success: true, data: activities.slice(0, 50) })
  } catch (err) {
    console.error('getProjectActivities error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch activities' })
  }
}

// Submit client submission
exports.submitClientSubmission = async (req, res) => {
  try {
    const { projectId } = req.params
    const { clientId, message, files } = req.body

    if (!projectId || !clientId) {
      return res.status(400).json({ success: false, message: 'Project ID and Client ID are required' })
    }

    const db = admin.firestore()

    // Create submission
    const submission = {
      clientId,
      projectId,
      message: message || '',
      files: files || [],
      createdAt: new Date().toISOString()
    }

    const docRef = await db.collection('clientSubmissions').add(submission)

    // Create notification for admin/staff
    const projectDoc = await db.collection('projects').doc(projectId).get()
    if (projectDoc.exists) {
      const project = projectDoc.data()
      
      // Notify assigned staff
      if (project.staffAssigned && project.staffAssigned.length > 0) {
        for (const staffId of project.staffAssigned) {
          await db.collection('notifications').add({
            userId: staffId,
            projectId,
            type: 'client_submission',
            message: `Client submitted files for project "${project.code || project.title}"`,
            read: false,
            createdAt: new Date().toISOString()
          })
        }
      }
    }

    res.json({
      success: true,
      message: 'Submission successful',
      data: { id: docRef.id, ...submission }
    })
  } catch (err) {
    console.error('submitClientSubmission error:', err)
    res.status(500).json({ success: false, message: 'Failed to submit' })
  }
}

// ...existing code...