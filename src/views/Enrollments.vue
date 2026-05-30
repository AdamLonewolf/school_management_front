<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const enrollments = ref([])
const students = ref([])
const courses = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')
const filterStatus = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)
const editingId = ref(null)

const emptyForm = { student_id: '', course_id: '', status: 'active' }
const form = ref({ ...emptyForm })

onMounted(async () => {
  await fetchEnrollments()
  if (role === 'admin') {
    await fetchStudents()
    await fetchCourses()
  }
})

async function fetchEnrollments() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('academics/enrollments/')
    enrollments.value = res.data
  } catch { error.value = 'Impossible de charger les inscriptions.' }
  finally { loading.value = false }
}

async function fetchStudents() {
  try { const res = await api.get('accounts/students/'); students.value = res.data } catch {}
}
async function fetchCourses() {
  try { const res = await api.get('academics/courses/'); courses.value = res.data } catch {}
}

const filteredEnrollments = computed(() => {
  return enrollments.value.filter(e => {
    const name = `${e.student.first_name} ${e.student.last_name}`.toLowerCase()
    const matchSearch = !filterSearch.value || name.includes(filterSearch.value.toLowerCase()) ||
      e.course.name.toLowerCase().includes(filterSearch.value.toLowerCase())
    const matchStatus = !filterStatus.value || e.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

const statusColor = (s) => ({ active: 'success', inactive: 'secondary', pending: 'warning' }[s] || 'secondary')
const statusLabel = (s) => ({ active: 'Actif', inactive: 'Inactif', pending: 'En attente' }[s] || s)

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(enrollment) {
  isEditing.value = true
  editingId.value = enrollment.id
  form.value = { student_id: enrollment.student_id, course_id: enrollment.course_id, status: enrollment.status }
  modalError.value = ''
  showModal.value = true
}

async function saveEnrollment() {
  saving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) await api.put(`academics/enrollments/${editingId.value}/`, form.value)
    else await api.post('academics/enrollments/', form.value)
    await fetchEnrollments()
    showModal.value = false
  } catch (err) { modalError.value = err.response?.data?.detail || 'Erreur.' }
  finally { saving.value = false }
}

async function deleteEnrollment(id) {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await api.delete(`academics/enrollments/${id}/`)
    await fetchEnrollments()
  } catch { error.value = 'Erreur lors de la suppression.' }
}

const pageTitle = computed(() => {
  if (role === 'student') return 'Mes inscriptions'
  if (role === 'parent') return 'Inscriptions de mon enfant'
  if (role === 'teacher') return 'Inscriptions à mes cours'
  return 'Liste des inscriptions'
})
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">{{ pageTitle }}</h3>
        <p class="text-body-secondary mb-0">{{ filteredEnrollments.length }} inscription(s) trouvée(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter une inscription
        </CButton>
      </CCol>
    </CRow>

    <CCard class="mb-4">
      <CCardBody>
        <CRow class="g-3">
          <CCol :md="8">
            <CFormInput v-model="filterSearch" placeholder="Rechercher par étudiant ou cours..." />
          </CCol>
          <CCol :md="4">
            <CFormSelect v-model="filterStatus">
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="pending">En attente</option>
            </CFormSelect>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>
    <div v-if="loading" class="text-center py-5"><CSpinner color="primary" /></div>

    <CCard v-else>
      <CCardBody class="p-0">
        <div v-if="filteredEnrollments.length === 0" class="text-center py-5">
          <p class="fs-1">📋</p>
          <p class="fw-semibold">Aucune inscription trouvée.</p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell v-if="role !== 'student'">Étudiant</CTableHeaderCell>
              <CTableHeaderCell>N° Étudiant</CTableHeaderCell>
              <CTableHeaderCell>Cours</CTableHeaderCell>
              <CTableHeaderCell>Statut</CTableHeaderCell>
              <CTableHeaderCell>Date d'inscription</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(enrollment, index) in filteredEnrollments" :key="enrollment.id">
              <CTableDataCell>{{ index + 1 }}</CTableDataCell>
              <CTableDataCell v-if="role !== 'student'" class="fw-semibold">
                {{ enrollment.student.first_name }} {{ enrollment.student.last_name }}
              </CTableDataCell>
              <CTableDataCell>
                <CBadge color="info">{{ enrollment.student.student_number || '—' }}</CBadge>
              </CTableDataCell>
              <CTableDataCell>{{ enrollment.course.name }}</CTableDataCell>
              <CTableDataCell>
                <CBadge :color="statusColor(enrollment.status)">{{ statusLabel(enrollment.status) }}</CBadge>
              </CTableDataCell>
              <CTableDataCell>
                {{ enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR') : '—' }}
              </CTableDataCell>
              <CTableDataCell v-if="role === 'admin'">
                <CButton color="warning" size="sm" class="me-2" @click="openEditModal(enrollment)">
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton color="danger" size="sm" @click="deleteEnrollment(enrollment.id)">
                  <CIcon icon="cil-trash" /> Supprimer
                </CButton>
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>

    <CModal :visible="showModal" @close="showModal = false" size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>{{ isEditing ? 'Modifier l\'inscription' : 'Ajouter une inscription' }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CAlert v-if="modalError" color="danger">{{ modalError }}</CAlert>
        <CRow class="g-3">
          <CCol :md="12">
            <CFormLabel>Étudiant</CFormLabel>
            <CFormSelect v-model="form.student_id">
              <option value="">Sélectionner un étudiant</option>
              <option v-for="s in students" :key="s.id" :value="s.id">
                {{ s.user.first_name }} {{ s.user.last_name }}
              </option>
            </CFormSelect>
          </CCol>
          <CCol :md="12">
            <CFormLabel>Cours</CFormLabel>
            <CFormSelect v-model="form.course_id">
              <option value="">Sélectionner un cours</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </CFormSelect>
          </CCol>
          <CCol :md="12">
            <CFormLabel>Statut</CFormLabel>
            <CFormSelect v-model="form.status">
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="pending">En attente</option>
            </CFormSelect>
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showModal = false" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveEnrollment" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>
