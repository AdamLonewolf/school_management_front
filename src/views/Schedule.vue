<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const schedules = ref([])
const courses = ref([])
const loading = ref(false)
const error = ref('')
const filterDay = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)
const editingId = ref(null)

const emptyForm = {
  course_id: '',
  day: '',
  start_time: '',
  end_time: '',
  room: '',
}
const form = ref({ ...emptyForm })

const days = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
]

const dayLabel = (d) => days.find(x => x.value === d)?.label || d
const dayColor = (d) => {
  const colors = {
    monday: 'primary', tuesday: 'success', wednesday: 'warning',
    thursday: 'danger', friday: 'info', saturday: 'secondary'
  }
  return colors[d] || 'secondary'
}

onMounted(async () => {
  await fetchSchedules()
  if (role === 'admin') await fetchCourses()
})

async function fetchSchedules() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('academics/schedules/')
    schedules.value = res.data
  } catch { error.value = "Impossible de charger l'emploi du temps." }
  finally { loading.value = false }
}

async function fetchCourses() {
  try {
    const res = await api.get('academics/courses/')
    courses.value = res.data
  } catch {}
}

const scheduleByDay = computed(() => {
  const grouped = {}
  days.forEach(d => { grouped[d.value] = [] })
  const filtered = filterDay.value
    ? schedules.value.filter(s => s.day === filterDay.value)
    : schedules.value
  filtered.forEach(s => {
    if (grouped[s.day]) grouped[s.day].push(s)
  })
  return grouped
})

const hasSchedules = computed(() => schedules.value.length > 0)

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(schedule) {
  isEditing.value = true
  editingId.value = schedule.id
  form.value = {
    course_id: schedule.course_id,
    day: schedule.day,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    room: schedule.room || '',
  }
  modalError.value = ''
  showModal.value = true
}

async function saveSchedule() {
  saving.value = true
  modalError.value = ''
  
  if (!form.value.course_id || !form.value.day || !form.value.start_time || !form.value.end_time) {
    modalError.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }

  try {
    if (isEditing.value) await api.put(`academics/schedules/${editingId.value}/`, form.value)
    else await api.post('academics/schedules/', form.value)
    await fetchSchedules()
    showModal.value = false
  } catch (err) {
    modalError.value = err.response?.data?.detail || "Erreur lors de l'enregistrement."
  } finally { saving.value = false }
}

async function deleteSchedule(id) {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await api.delete(`academics/schedules/${id}/`)
    await fetchSchedules()
  } catch { error.value = 'Erreur lors de la suppression.' }
}

const pageTitle = computed(() => {
  if (role === 'student') return 'Mon emploi du temps'
  if (role === 'parent') return 'Emploi du temps de mon enfant'
  if (role === 'teacher') return 'Mon planning'
  return 'Emploi du temps'
})
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">{{ pageTitle }}</h3>
        <p class="text-body-secondary mb-0">{{ schedules.length }} créneau(x) au programme</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter un créneau
        </CButton>
      </CCol>
    </CRow>

    <CCard class="mb-4">
      <CCardBody>
        <CRow class="g-2">
          <CCol xs="auto">
            <CButton :color="filterDay === '' ? 'primary' : 'secondary'" variant="outline" size="sm" @click="filterDay = ''">
              Tous
            </CButton>
          </CCol>
          <CCol xs="auto" v-for="day in days" :key="day.value">
            <CButton
              :color="filterDay === day.value ? dayColor(day.value) : 'secondary'"
              variant="outline" size="sm"
              @click="filterDay = day.value"
            >
              {{ day.label }}
            </CButton>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <p class="mt-2 text-body-secondary">Chargement...</p>
    </div>

    <div v-else-if="!hasSchedules" class="text-center py-5">
      <p class="fs-1">📅</p>
      <p class="fw-semibold">Aucun créneau disponible.</p>
      <p class="text-body-secondary" v-if="role === 'admin'">
        Cliquez sur "Ajouter un créneau" pour commencer.
      </p>
    </div>

    <div v-else>
      <div v-for="day in days" :key="day.value">
        <div v-if="scheduleByDay[day.value].length > 0" class="mb-4">
          <h5 class="fw-bold mb-3">
            <CBadge :color="dayColor(day.value)" class="me-2">{{ day.label }}</CBadge>
          </h5>
          <CRow>
            <CCol :md="6" :lg="4" v-for="schedule in scheduleByDay[day.value]" :key="schedule.id" class="mb-3">
              <CCard class="h-100" :class="`border-start border-${dayColor(day.value)} border-3`">
                <CCardBody>
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="fw-bold mb-0">{{ schedule.course.name }}</h6>
                    <div v-if="role === 'admin'" class="d-flex gap-1">
                      <CButton color="warning" size="sm" variant="ghost" @click="openEditModal(schedule)">
                        <CIcon icon="cil-pencil" />
                      </CButton>
                      <CButton color="danger" size="sm" variant="ghost" @click="deleteSchedule(schedule.id)">
                        <CIcon icon="cil-trash" />
                      </CButton>
                    </div>
                  </div>
                  <div class="text-body-secondary small mb-1">🕐 {{ schedule.start_time }} — {{ schedule.end_time }}</div>
                  <div v-if="schedule.room" class="text-body-secondary small mb-1">🚪 Salle : {{ schedule.room }}</div>
                  <div v-if="schedule.course.teacher" class="text-body-secondary small">👨‍🏫 {{ schedule.course.teacher }}</div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </div>
      </div>
    </div>

    <CModal :visible="showModal" @close="showModal = false" backdrop="static">
      <CModalHeader>
        <CModalTitle>{{ isEditing ? 'Modifier le créneau' : 'Ajouter un créneau' }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CAlert v-if="modalError" color="danger">{{ modalError }}</CAlert>
        <CRow class="g-3">
          <CCol :md="12">
            <CFormLabel>Cours</CFormLabel>
            <CFormSelect v-model="form.course_id">
              <option value="">Sélectionner un cours</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </CFormSelect>
          </CCol>
          <CCol :md="12">
            <CFormLabel>Jour</CFormLabel>
            <CFormSelect v-model="form.day">
              <option value="">Sélectionner un jour</option>
              <option v-for="d in days" :key="d.value" :value="d.value">{{ d.label }}</option>
            </CFormSelect>
          </CCol>
          <CCol :md="6">
            <CFormLabel>Heure de début</CFormLabel>
            <CFormInput type="time" v-model="form.start_time" />
          </CCol>
          <CCol :md="6">
            <CFormLabel>Heure de fin</CFormLabel>
            <CFormInput type="time" v-model="form.end_time" />
          </CCol>
          <CCol :md="12">
            <CFormLabel>Salle (optionnel)</CFormLabel>
            <CFormInput v-model="form.room" placeholder="Ex: Salle 101" />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showModal = false" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveSchedule" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>