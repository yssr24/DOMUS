const admin = require('firebase-admin')

function parseServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing')
  const sa = JSON.parse(json)
  if (typeof sa.private_key === 'string') {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n')
  }
  return sa
}

const serviceAccount = parseServiceAccount()

let bucket = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
// Auto-fix common mistakes
if (/firebasestorage\.app/i.test(bucket) || /^https?:\/\//i.test(bucket)) {
  bucket = `${serviceAccount.project_id}.appspot.com`
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
    storageBucket: bucket,
  })
}

// Optional: check bucket existence at startup (logs a warning, doesn’t crash)
async function checkStorage() {
  try {
    const [exists] = await admin.storage().bucket().exists()
    if (!exists) {
      console.warn(`Firebase Storage bucket "${bucket}" does not exist. Create it in Firebase Console or set FIREBASE_STORAGE_BUCKET to the exact bucket name.`)
    } else {
      console.log(`Firebase Storage bucket OK: ${bucket}`)
    }
  } catch (err) {
    console.warn('Storage check failed:', err.message)
  }
}

admin.bucketName = bucket
admin.checkStorage = checkStorage

module.exports = admin