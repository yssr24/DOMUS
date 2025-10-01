const admin = require('firebase-admin')

function mask(str, keep = 4) {
  if (!str || typeof str !== 'string') return ''
  return str.slice(0, keep) + '...' + str.slice(-keep)
}
// ...existing code...
function loadServiceAccount() {
  let json = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!json && process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try { json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8') } catch {}
  }
  let fromJson = null
  if (json) {
    try {
      fromJson = JSON.parse(json)
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.')
    }
  }
  const fromEnv = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }
  const raw = fromJson || fromEnv
  let projectId = raw.project_id || raw.projectId
  let clientEmail = raw.client_email || raw.clientEmail
  let privateKey = raw.private_key || raw.privateKey
  if (typeof privateKey === 'string') {
    privateKey = privateKey.replace(/^"+|"+$/g, '').replace(/\\n/g, '\n')
  }
  const cred = { projectId, clientEmail, privateKey }
  ;['projectId', 'clientEmail', 'privateKey'].forEach((k) => {
    if (!cred[k] || typeof cred[k] !== 'string') {
      throw new Error(`Missing or invalid Firebase ${k}. Check your Railway variables.`)
    }
  })
  return cred
}
// ...existing code...

const cred = loadServiceAccount()

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(cred),
    databaseURL: process.env.FIREBASE_DB_URL,
  })
}

module.exports = admin