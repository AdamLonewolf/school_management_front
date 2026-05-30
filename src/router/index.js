import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/stores/auth'

import Dashboard from '@/views/Dashboard.vue'
import Students from '@/views/students/Students.vue'
import StudentInfo from '@/views/students/StudentInfo.vue'
import Parents from '@/views/Parent.vue'
import Teachers from '@/views/Teacher.vue'
import Users from '@/views/Users.vue'
import Grades from '@/views/Grades.vue'
import Assignments from '@/views/Assignments.vue'
import Attendance from '@/views/Attendance.vue'
import Courses from '@/views/Courses.vue'
import Enrollments from '@/views/Enrollments.vue'
import Submissions from '@/views/Submissions.vue'
import Fields from '@/views/Fields.vue'
import Levels from '@/views/Levels.vue'
import Schedule from '@/views/Schedule.vue'
import Login from '@/views/auth/Login.vue'
import Page404 from '@/views/pages/Page404.vue'
import Page500 from '@/views/pages/Page500.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: Dashboard },
      { path: 'students', name: 'Students', component: Students },
      { path: 'students/:id', name: 'StudentInfo', component: StudentInfo },
      { path: 'parents', name: 'Parents', component: Parents },
      { path: 'teachers', name: 'Teachers', component: Teachers },
      { path: 'assignments', name: 'Assignments', component: Assignments },
      { path: 'attendance', name: 'Attendance', component: Attendance },
      { path: 'courses', name: 'Courses', component: Courses },
      { path: 'enrollments', name: 'Enrollments', component: Enrollments },
      { path: 'fields', name: 'Fields', component: Fields },
      { path: 'grades', name: 'Grades', component: Grades },
      { path: 'levels', name: 'Levels', component: Levels },
      { path: 'submissions', name: 'Submissions', component: Submissions },
      { path: 'schedule', name: 'Schedule', component: Schedule },
      { path: 'users', name: 'Users', component: Users },
    ],
  },
  {
    path: '/auth',
    children: [
      { path: 'login', name: 'Login', component: Login },
    ],
  },
  {
    path: '/pages',
    children: [
      { path: '404', name: 'Page404', component: Page404 },
      { path: '500', name: 'Page500', component: Page500 },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/pages/404' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const authStore = useAuth()
  const isAuthenticated = authStore.isAuthenticated
  console.log('Navigation vers:', to.name, '| Connecté:', isAuthenticated)

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'Login' }
  }

  if (to.name === 'Login' && isAuthenticated) {
    return { name: 'Dashboard' }
  }
})

export default router