const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')
const multer = require('multer')
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }
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

module.exports = router