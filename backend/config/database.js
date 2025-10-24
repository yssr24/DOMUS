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
// Auto-fix common mistake: using the download host instead of the bucket name
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

module.exports = admin