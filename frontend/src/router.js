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
import File_and_Document from './components/admin/content/file_and_document.vue'
import clientPortal from './components/admin/content/clientPortal.vue'
import NotificationCenter from './components/admin/content/notificationCenter.vue'
import Billing_and_finance from './components/admin/content/billing_and_finance.vue'
import Website from './components/admin/content/Website.vue'
import FileView from './components/admin/content/file-view.vue' // NEW


import AddProject from './components/admin/content/projectmanagement/addProject.vue'
import CreateTask from './components/admin/content/taskmanagement/createTask.vue'

import Staff from './components/staff/staffHome.vue'
import OverviewStaff from './components/staff/content/OverviewStaff.vue'
import ProjectsStaff from './components/staff/content/ProjectsStaff.vue'
import TaskStaff from './components/staff/content/TaskStaff.vue'

const routes = [
  { path: '/', component: Homepage }, // <-- Add homepage route
  { path: '/about', component: Homepage, meta: { show: 'about' } },
  { path: '/contact', component: Homepage, meta: { show: 'contact' } },
  { path: '/projects', component: Homepage, meta: { show: 'projects' } },
    { path: '/projectdetails/:id?', name: 'project-details', component: Homepage, meta: { show: 'projectDetails' } },

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
      { path: 'file-and-document', 
        component: File_and_Document 
      },
      { path: 'client-portal', 
        component: clientPortal 
      },
      { path: 'notification-center', 
        component: NotificationCenter 
      },
      { path: 'billing-and-finance', 
        component: Billing_and_finance 
      },
      {
        path: 'website', 
        component: Website
      },
      {
        path: 'file-view',
        component: FileView
      }


    ]
  }, 
  { path: '/staff', 
    component: Staff,
    children: [
      { path : '', component: OverviewStaff },
      { path: 'projects', component: ProjectsStaff },
      { path: 'tasks', component: TaskStaff }
    ]
   },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router