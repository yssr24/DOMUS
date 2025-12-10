const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')

router.post('/login', userController.login)
router.post('/signup', userController.signup)
router.post('/verify', userController.verify)
router.post('/resend-code', userController.resendCode)
router.post('/forgot-password', userController.forgotPassword)
router.post('/change-password', userController.changePassword)

router.get('/notifications', userController.getClientNotifications)
router.post('/mark-notification-read', userController.markNotificationRead)
router.post('/mark-all-notifications-read', userController.markAllNotificationsRead)

// Project details routes for clients
router.get('/project/:projectId', userController.getProjectDetails)
router.get('/project/:projectId/files', userController.getProjectFiles)
router.get('/project/:projectId/submissions', userController.getProjectSubmissions)
router.get('/project/:projectId/activities', userController.getProjectActivities)
router.post('/project/:projectId/submit', userController.submitClientSubmission)

module.exports = router