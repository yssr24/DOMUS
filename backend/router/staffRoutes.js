const express = require('express')
const router = express.Router()
const multer = require('multer')
const staffController = require('../controller/staffController')

const upload = multer({ storage: multer.memoryStorage() })

router.get('/overview', staffController.getStaffOverview)
router.get('/projects', staffController.getStaffProjects)
router.get('/project-detail', staffController.getProjectDetail)
router.get('/tasks', staffController.getStaffTasks)
router.get('/notifications', staffController.getNotifications)
router.post('/update-task-status', staffController.updateTaskStatus)
router.post('/mark-notification-read', staffController.markNotificationRead)
router.post('/mark-all-notifications-read', staffController.markAllNotificationsRead)
router.post('/submit-files', upload.array('files', 10), staffController.submitFiles)

module.exports = router