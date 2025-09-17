import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/login.vue'
import SignUp from './components/signup.vue'
import Verification from './components/verification.vue'
import ChangePassword from './components/changepassword.vue'
import ForgotPassword from './components/forgotpassword.vue'
import Homepage from './components/user/homepage.vue'

import admin from './components/admin/adminHome.vue'
import Overview from './components/admin/content/overview.vue'
import UserManagement from './components/admin/content/userManagement.vue'
import ProjectManagement from './components/admin/content/projectManagement.vue'
import TaskManagement from './components/admin/content/taskManagement.vue'

import AddProject from './components/admin/content/projectmanagement/addProject.vue'
import CreateTask from './components/admin/content/taskmanagement/createTask.vue'

import Staff from './components/staff/staffHome.vue'


const routes = [
  { path: '/', component: Homepage }, // <-- Add homepage route
  { path: '/about', component: Homepage, meta: { show: 'about' } },
  { path: '/contact', component: Homepage, meta: { show: 'contact' } },
  { path: '/projects', component: Homepage, meta: { show: 'projects' } },
  { path: '/login', component: Login },
  { path: '/signup', component: SignUp },
  { path: '/verification', component: Verification },
  { path: '/change-password', component: ChangePassword },
  { path: '/forgot-password', component: ForgotPassword },
    {
    path: '/admin',
    component: admin,
    children: [
      {
        path: '',
        component: Overview
      },
      {
        path: 'user-management',
        component: UserManagement
      },
      {
        path: 'project-management',
        component: ProjectManagement
      },
      {
        path: 'project-management/add-project',
        component: AddProject
      },
      { 
        path: 'task-management', 
        component: TaskManagement 
      },
      { path: 'create-task', 
        component: CreateTask },

    ]
  }, 
  { path: '/staff', component: Staff },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router