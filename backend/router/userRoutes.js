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

module.exports = router