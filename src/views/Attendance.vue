<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const absences = ref([])
const students = ref([])
const courses = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')
const filterJustified = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)
const editingId = ref(null)

const emptyForm = { student_id: '', course_id: '', date: '', justified: false, reason: '' }
const form = ref({ ...emptyForm })

onMounted(async () => {
  await fetchAbsences()
  if (role === 'admin' || role === 'teacher') {
    await fetchStudents()
    await fetchCourses()
  }
})

async function fetchAbsences() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('academics/absences/')
    absences.value = res.data
  } catch { error.value = 'Impossible de charger les absences.' }
  finally { loading.value = false }
}

async function fetchStudents() {
  try { const res = await api.get('accounts/students/'); students.value = res.data } catch {}
}
async function fetchCourses() {
  try { const res = await api.get('academics/courses/'); courses.value = res.data } catch {}
}

const filteredAbsences = computed(() => {
  return absences.value.filter(a => {
    const name = `${a.student.first_name} ${a.student.last_name}`.toLowerCase()
    const matchSearch = !filterSearch.value || name.includes(filterSearch.value.toLowerCase())
    const matchJustified = filterJustified.value === '' || String(a.justified) === filterJustified.value
    return matchSearch && matchJustified
  })
})

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(absence) {
  isEditing.value = true
  editingId.value = absence.id
  form.value = {
    student_id: absence.student_id,
    course_id: absence.course_id,
    date: absence.date || '',
    justified: absence.justified,
    reason: absence.reason || '',
  }
  modalError.value = ''
  showModal.value = true
}

async function saveAbsence() {
  saving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) await api.put(`academics/absences/${editingId.value}/`, form.value)
    else await api.post('academics/absences/', form.value)
    await fetchAbsences()
    showModal.value = false
  } catch (err) { modalError.value = err.response?.data?.detail || 'Erreur.' }
  finally { saving.value = false }
}

async function deleteAbsence(id) {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await api.delete(`academics/absences/${id}/`)
    await fetchAbsences()
  } catch { error.value = 'Erreur lors de la suppression.' }
}

const pageTitle = computed(() => {
  if (role === 'student') return 'Mes absences'
  if (role === 'parent') return 'Absences de mon enfant'
  return 'Liste des absences'
})
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">{{ pageTitle }}</h3>
        <p class="text-body-secondary mb-0">{{ filteredAbsences.length }} absence(s) trouvée(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin' || role === 'teacher'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter une absence
        </CButton>
      </CCol>
    </CRow>

    <CCard class="mb-4">
      <CCardBody>
        <CRow class="g-3">
          <CCol :md="8">
            <CFormInput v-model="filterSearch" placeholder="Rechercher par étudiant..." />
          </CCol>
          <CCol :md="4">
            <CFormSelect v-model="filterJustified">
              <option value="">Toutes</option>
              <option value="true">Justifiées</option>
              <option value="false">Non justifiées</option>
            </CFormSelect>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>

    <div v-if="loading" class="text-center py-5"><CSpinner color="primary" /></div>

    <CCard v-else>
      <CCardBody class="p-0">
        <div v-if="filteredAbsences.length === 0" class="text-center py-5">
          <p class="fs-1">📋</p>
          <p class="fw-semibold">Aucune absence enregistrée.</p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell v-if="role !== 'student'">Étudiant</CTableHeaderCell>
              <CTableHeaderCell>Cours</CTableHeaderCell>
              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell>Statut</CTableHeaderCell>
              <CTableHeaderCell>Motif</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin' || role === 'teacher'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(absence, index) in filteredAbsences" :key="absence.id">
              <CTableDataCell>{{ index + 1 }}</CTableDataCell>
              <CTableDataCell v-if="role !== 'student'" class="fw-semibold">
                {{ absence.student.first_name }} {{ absence.student.last_name }}
              </CTableDataCell>
              <CTableDataCell>{{ absence.course.name }}</CTableDataCell>
              <CTableDataCell>{{ new Date(absence.date).toLocaleDateString('fr-FR') }}</CTableDataCell>
              <CTableDataCell>
                <CBadge :color="absence.justified ? 'success' : 'danger'">
                  {{ absence.justified ? 'Justifiée' : 'Non justifiée' }}
                </CBadge>
              </CTableDataCell>
              <CTableDataCell>{{ absence.reason || '—' }}</CTableDataCell>
              <CTableDataCell v-if="role === 'admin' || role === 'teacher'">
                <CButton color="warning" size="sm" class="me-2" @click="openEditModal(absence)">
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton color="danger" size="sm" @click="deleteAbsence(absence.id)">
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
        <CModalTitle>{{ isEditing ? 'Modifier l\'absence' : 'Enregistrer une absence' }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CAlert v-if="modalError" color="danger">{{ modalError }}</CAlert>
        <CRow class="g-3">
          <CCol :md="6">
            <CFormLabel>Étudiant</CFormLabel>
            <CFormSelect v-model="form.student_id">
              <option value="">Sélectionner</option>
              <option v-for="s in students" :key="s.id" :value="s.id">
                {{ s.user.first_name }} {{ s.user.last_name }}
              </option>
            </CFormSelect>
          </CCol>
          <CCol :md="6">
            <CFormLabel>Cours</CFormLabel>
            <CFormSelect v-model="form.course_id">
              <option value="">Sélectionner</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </CFormSelect>
          </CCol>
          <CCol :md="6">
            <CFormLabel>Date</CFormLabel>
            <CFormInput type="date" v-model="form.date" />
          </CCol>
          <CCol :md="6" class="d-flex align-items-end">
            <CFormCheck v-model="form.justified" label="Absence justifiée" id="justified" />
          </CCol>
          <CCol :md="12">
            <CFormLabel>Motif</CFormLabel>
            <CFormInput v-model="form.reason" placeholder="Motif de l'absence..." />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showModal = false" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveAbsence" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>