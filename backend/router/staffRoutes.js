const express = require('express')
const router = express.Router()
const staffController = require('../controller/staffController')

router.get('/overview', staffController.getStaffOverview)
router.get('/projects', staffController.getStaffProjects)
router.get('/tasks', staffController.getStaffTasks)
router.post('/update-task-status', staffController.updateTaskStatus)
router.post('/mark-notification-read', staffController.markNotificationRead)
router.post('/mark-all-notifications-read', staffController.markAllNotificationsRead)

module.exports = router