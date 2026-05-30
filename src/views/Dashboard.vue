<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const authStore = useAuth()
const router = useRouter()
const role = authStore.userRole
const firstName = authStore.user.first_name
const lastName = authStore.user.last_name

// Compteurs admin
const counts = ref({
  students: 0,
  teachers: 0,
  courses: 0,
  parents: 0,
})
const loadingCounts = ref(false)

onMounted(async () => {
  if (role === 'admin') {
    await fetchCounts()
  }
})

async function fetchCounts() {
  loadingCounts.value = true
  try {
    const [students, teachers, courses, parents] = await Promise.all([
      api.get('accounts/students/'),
      api.get('accounts/teachers/'),
      api.get('academics/courses/'),
      api.get('accounts/parents/'),
    ])
    counts.value.students = students.data.length
    counts.value.teachers = teachers.data.length
    counts.value.courses  = courses.data.length
    counts.value.parents  = parents.data.length
  } catch {
    console.error('Erreur chargement compteurs')
  } finally {
    loadingCounts.value = false
  }
}

const adminLinks = [
  { name: 'Étudiants', to: '/students', color: 'primary', icon: 'cil-people' },
  { name: 'Utilisateurs', to: '/users', color: 'secondary', icon: 'cil-user' },
  { name: 'Cours', to: '/courses', color: 'success', icon: 'cil-book' },
  { name: 'Notes', to: '/grades', color: 'warning', icon: 'cil-description' },
  { name: 'Devoirs', to: '/assignments', color: 'danger', icon: 'cil-pencil' },
  { name: 'Emploi du temps', to: '/schedule', color: 'info', icon: 'cil-clock' },
  { name: 'Inscriptions', to: '/enrollments', color: 'dark', icon: 'cil-list' },
  { name: 'Absences', to: '/attendance', color: 'light', icon: 'cil-calendar' },
]
</script>

<template>
  <!-- Message de bienvenue -->
  <CCard class="mb-4 border-0 bg-transparent">
    <CCardBody class="ps-0">
      <h2 class="fw-bold">Bienvenue, {{ firstName }} {{ lastName }} 👋</h2>
      <p class="text-body-secondary">{{ new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
    </CCardBody>
  </CCard>

  <!-- ADMIN -->
  <div v-if="role === 'admin'">
    <!-- Statistiques -->
    <CRow class="mb-4">
      <CCol :sm="6" :lg="3">
        <CCard class="mb-4 text-white bg-primary" style="cursor:pointer" @click="$router.push('/students')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div>
              <div class="fs-4 fw-bold">
                 <CSpinner v-if="loadingCounts" size="sm" />
                 <span v-else>{{ counts.students }}</span>
              </div>
              <div>Étudiants</div>
            </div>
            <CIcon icon="cil-people" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :sm="6" :lg="3">
        <CCard class="mb-4 text-white bg-success" style="cursor:pointer" @click="$router.push('/users')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div>
              <div class="fs-4 fw-bold">
                 <CSpinner v-if="loadingCounts" size="sm" />
                 <span v-else>{{ counts.teachers }}</span>
              </div>
              <div>Professeurs</div>
            </div>
            <CIcon icon="cil-user" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :sm="6" :lg="3">
        <CCard class="mb-4 text-white bg-warning" style="cursor:pointer" @click="$router.push('/courses')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div>
              <div class="fs-4 fw-bold">
                 <CSpinner v-if="loadingCounts" size="sm" />
                 <span v-else>{{ counts.courses }}</span>
              </div>
              <div>Cours</div>
            </div>
            <CIcon icon="cil-book" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :sm="6" :lg="3">
        <CCard class="mb-4 text-white bg-danger" style="cursor:pointer" @click="$router.push('/parents')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div>
              <div class="fs-4 fw-bold">
                <CSpinner v-if="loadingCounts" size="sm"  />
                <span v-else>{{ counts.parents }}</span>
              </div>
              <div>Parents</div>
            </div>
            <CIcon icon="cil-home" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>

  <!-- ÉTUDIANT -->
  <div v-else-if="role === 'student'">
    <CRow>
      <CCol :md="4">
        <CCard class="mb-4 text-white bg-primary" style="cursor:pointer" @click="$router.push('/grades')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div><div class="fw-bold">Mes Notes</div><small>Voir mes résultats</small></div>
            <CIcon icon="cil-description" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="4">
        <CCard class="mb-4 text-white bg-success" style="cursor:pointer" @click="$router.push('/schedule')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div><div class="fw-bold">Emploi du temps</div><small>Mon planning</small></div>
            <CIcon icon="cil-clock" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="4">
        <CCard class="mb-4 text-white bg-warning" style="cursor:pointer" @click="$router.push('/assignments')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div><div class="fw-bold">Mes Devoirs</div><small>Travaux à rendre</small></div>
            <CIcon icon="cil-pencil" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>

  <!-- PROFESSEUR -->
  <div v-else-if="role === 'teacher'">
    <CRow>
      <CCol :md="4">
        <CCard class="mb-4 text-white bg-primary" style="cursor:pointer" @click="$router.push('/students')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div><div class="fw-bold">Mes Étudiants</div><small>Voir mes classes</small></div>
            <CIcon icon="cil-people" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="4">
        <CCard class="mb-4 text-white bg-success" style="cursor:pointer" @click="$router.push('/grades')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div><div class="fw-bold">Notes</div><small>Saisir les notes</small></div>
            <CIcon icon="cil-description" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="4">
        <CCard class="mb-4 text-white bg-warning" style="cursor:pointer" @click="$router.push('/assignments')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div><div class="fw-bold">Devoirs</div><small>Gérer les devoirs</small></div>
            <CIcon icon="cil-pencil" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>

  <!-- PARENT -->
  <div v-else>
    <CRow>
      <CCol :md="4">
        <CCard class="mb-4 text-white bg-primary" style="cursor:pointer" @click="$router.push('/grades')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div><div class="fw-bold">Notes de mon enfant</div><small>Voir les résultats</small></div>
            <CIcon icon="cil-description" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="4">
        <CCard class="mb-4 text-white bg-success" style="cursor:pointer" @click="$router.push('/schedule')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div><div class="fw-bold">Emploi du temps</div><small>Planning de mon enfant</small></div>
            <CIcon icon="cil-clock" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="4">
        <CCard class="mb-4 text-white bg-warning" style="cursor:pointer" @click="$router.push('/enrollments')">
          <CCardBody class="d-flex justify-content-between align-items-center">
            <div><div class="fw-bold">Inscriptions</div><small>Cours de mon enfant</small></div>
            <CIcon icon="cil-list" size="xl" />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>
