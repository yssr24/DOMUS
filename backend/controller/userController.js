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