const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')
const multer = require('multer') // added
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 } // 10MB each, up to 10 files
})

router.get('/user-role-counts', adminController.getUserRoleCounts)
router.get('/user-stats', adminController.getUserStats)
router.get('/client-stats', adminController.getClientStats)
router.get('/overview-stats', adminController.getOverviewStats)
router.get('/project-stats', adminController.getProjectStats)
router.get('/user-registration-stats', adminController.getUserRegistrationStats)

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

router.post('/contact', adminController.submitContactMessage) // NEW

module.exports = router