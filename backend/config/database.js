const admin = require('firebase-admin')

function getServiceAccount() {
  // Option A: single JSON env var (recommended for Railway)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    if (typeof sa.private_key === 'string') {
      sa.private_key = sa.private_key.replace(/\\n/g, '\n')
    }
    return sa
  }

  // Option B: separate env vars
  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^"+|"+$/g, '').trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (typeof privateKey === 'string') {
    privateKey = privateKey.replace(/^"+|"+$/g, '') // strip surrounding quotes if present
    privateKey = privateKey.replace(/\\n/g, '\n')    // convert \n to newlines if pasted escaped
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  }
}

const serviceAccount = getServiceAccount()

;['project_id', 'client_email', 'private_key'].forEach((k) => {
  if (!serviceAccount[k] || typeof serviceAccount[k] !== 'string') {
    throw new Error(`Missing or invalid Firebase ${k}. Check your Railway variables.`)
  }
})

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  })
}

module.exports = admin