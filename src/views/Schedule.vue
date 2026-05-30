<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const enrollments = ref([])
const loading = ref(false)
const error = ref('')

onMounted(async () => { await fetchSchedule() })

async function fetchSchedule() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('academics/enrollments/')
    enrollments.value = res.data
  } catch { error.value = 'Impossible de charger l\'emploi du temps.' }
  finally { loading.value = false }
}

// Groupe les cours par cours pour affichage
const courseList = computed(() => {
  const seen = new Set()
  return enrollments.value
    .filter(e => {
      if (seen.has(e.course.id)) return false
      seen.add(e.course.id)
      return true
    })
    .map(e => e.course)
})

const pageTitle = computed(() => {
  if (role === 'student') return 'Mon emploi du temps'
  if (role === 'parent') return 'Emploi du temps de mon enfant'
  if (role === 'teacher') return 'Mes cours'
  return 'Emploi du temps'
})
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">{{ pageTitle }}</h3>
        <p class="text-body-secondary mb-0">{{ courseList.length }} cours au programme</p>
      </CCol>
    </CRow>

    <CAlert color="info" class="mb-4">
      <CIcon icon="cil-info" class="me-2" />
      L'emploi du temps est basé sur vos inscriptions aux cours. Pour un planning horaire détaillé, contactez l'administration.
    </CAlert>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>
    <div v-if="loading" class="text-center py-5"><CSpinner color="primary" /></div>

    <div v-else>
      <div v-if="enrollments.length === 0" class="text-center py-5">
        <p class="fs-1">📅</p>
        <p class="fw-semibold">Aucun cours au programme.</p>
        <p class="text-body-secondary">Aucune inscription active trouvée.</p>
      </div>

      <CRow v-else>
        <CCol :md="6" :lg="4" v-for="enrollment in enrollments" :key="enrollment.id" class="mb-4">
          <CCard class="h-100 border-start border-primary border-3">
            <CCardBody>
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0">{{ enrollment.course.name }}</h6>
                <CBadge :color="enrollment.status === 'active' ? 'success' : 'secondary'">
                  {{ enrollment.status === 'active' ? 'Actif' : enrollment.status }}
                </CBadge>
              </div>
              <div v-if="role === 'admin' || role === 'teacher'" class="text-body-secondary small mb-1">
                <CIcon icon="cil-user" class="me-1" />
                {{ enrollment.student.first_name }} {{ enrollment.student.last_name }}
              </div>
              <div class="text-body-secondary small">
                <CIcon icon="cil-calendar" class="me-1" />
                Inscrit le {{ enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR') : '—' }}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  </div>
</template>