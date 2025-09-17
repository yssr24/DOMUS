const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')

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


module.exports = router