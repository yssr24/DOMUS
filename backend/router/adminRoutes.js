const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')
const multer = require('multer')
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'application/pdf',
      'text/csv', 'application/vnd.ms-excel',
      'application/acad', 'application/x-acad', 'application/autocad_dwg', 'image/vnd.dwg', 'application/dwg', 'application/x-dwg',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    // Also allow by extension for DWG files
    const ext = file.originalname.split('.').pop().toLowerCase()
    if (allowedTypes.includes(file.mimetype) || ['dwg', 'csv', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDF, CSV, DWG, DOC, XLS'), false)
    }
  }
})

// ...existing code...
router.get('/user-role-counts', adminController.getUserRoleCounts)
router.get('/user-stats', adminController.getUserStats)
router.get('/client-stats', adminController.getClientStats)
router.post('/update-status', adminController.updateUserStatus)
router.get('/users-with-status', adminController.getUsersWithStatus)
router.post('/add-user-direct', adminController.addUserDirect)
router.post('/update-user-direct', adminController.updateUserDirect)
router.get('/get-user', adminController.getUser)
router.post('/add-project', adminController.addProject)
router.get('/projects-for-client', adminController.getProjectsForClient);
router.get('/projects', adminController.getAllProjects)
router.post('/tasks', adminController.createTask)
router.get('/tasks', adminController.getTasks)

router.post('/designs', upload.array('images', 10), adminController.addDesign)
router.get('/designs', adminController.getDesigns)

router.get('/files', adminController.getFiles)
router.get('/file', adminController.streamFile)

router.post('/contact', adminController.submitContactMessage)

// Overview routes
router.get('/overview-stats', adminController.getOverviewStats)
router.get('/user-registration-stats', adminController.getUserRegistrationStats)
router.get('/projects-by-status', adminController.getProjectsByStatus)
router.get('/recent-users', adminController.getRecentUsers)
router.get('/project-details/:id', adminController.getProjectDetails)

router.get('/project-staff/:projectId', adminController.getProjectStaff)
router.get('/available-staff', adminController.getAvailableStaff)
router.post('/assign-staff', adminController.assignStaffToProject)
router.post('/remove-staff', adminController.removeStaffFromProject)

router.get('/notifications', adminController.getAdminNotifications)
router.post('/mark-notification-read', adminController.markNotificationRead)
router.post('/mark-all-notifications-read', adminController.markAllNotificationsRead)

router.post('/upload-file', upload.single('file'), adminController.uploadFile)

router.get('/stream-file', adminController.streamFile)


// ...existing code...

// Invoice/Billing routes
router.get('/invoices', adminController.getInvoices)
router.get('/invoice/:id', adminController.getInvoice)
router.post('/upload-invoice', upload.single('file'), adminController.uploadInvoice)
router.post('/invoice/:id/mark-paid', adminController.markInvoicePaid)
router.put('/invoice/:id', adminController.updateInvoice)
router.delete('/invoice/:id', adminController.deleteInvoice)
router.get('/billing-stats', adminController.getBillingStats)

// Parsio webhook (no auth required for webhook)
router.post('/webhook/parsio', adminController.parsioWebhook)

module.exports = router
module.exports = router