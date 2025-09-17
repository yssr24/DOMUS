import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '../public/css/style.css'

router.beforeEach((to, from, next) => {
  const user = localStorage.getItem('domus_user')
  const authPages = ['/login', '/signup', '/verification', '/forgot-password', '/change-password']

  if (to.path.startsWith('/admin')) {
    if (!user) {
      next('/login')
      return
    }
    const userObj = JSON.parse(user)
    if (userObj.role !== 'admin') {
      next('/login')
      return
    }
  }
  
  if (to.path.startsWith('/staff')) {
    if (!user) {
      next('/login')
      return
    }
    const userObj = JSON.parse(user)
    if (userObj.role !== 'staff') {
      next('/login')
      return
    }
  }

  if (user) {
    const userObj = JSON.parse(user)
    if (authPages.includes(to.path)) {
      if (userObj.role === 'admin') {
        next('/admin')
        return
      } else if (userObj.role === 'staff') {
        next('/staff')
        return
      } else {
        next('/')
        return
      }
    }
    if (userObj.role === 'admin' && to.path === '/') {
      next('/admin')
      return
    }
    if (userObj.role === 'staff' && to.path === '/') {
      next('/staff')
      return
    }
  }
  next()
})

createApp(App).use(router).mount('#app')