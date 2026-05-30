<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const marks = ref([])
const enrollments = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)
const editingId = ref(null)

const emptyForm = { enrollment_id: '', mark: '', remark: '' }
const form = ref({ ...emptyForm })

onMounted(async () => {
  await fetchMarks()
  if (role === 'admin' || role === 'teacher') await fetchEnrollments()
})

async function fetchMarks() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('academics/marks/')
    marks.value = res.data
  } catch { error.value = 'Impossible de charger les notes.' }
  finally { loading.value = false }
}

async function fetchEnrollments() {
  try {
    const res = await api.get('academics/enrollments/')
    enrollments.value = res.data
  } catch {}
}

const filteredMarks = computed(() => {
  if (!filterSearch.value) return marks.value
  return marks.value.filter(m =>
    m.enrollment.student.toLowerCase().includes(filterSearch.value.toLowerCase()) ||
    m.enrollment.course.toLowerCase().includes(filterSearch.value.toLowerCase())
  )
})

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(mark) {
  isEditing.value = true
  editingId.value = mark.id
  form.value = { enrollment_id: mark.enrollment_id, mark: mark.mark, remark: mark.remark || '' }
  modalError.value = ''
  showModal.value = true
}

async function saveMark() {
  saving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) await api.put(`academics/marks/${editingId.value}/`, form.value)
    else await api.post('academics/marks/', form.value)
    await fetchMarks()
    showModal.value = false
  } catch (err) { modalError.value = err.response?.data?.detail || 'Erreur lors de l\'enregistrement.' }
  finally { saving.value = false }
}

async function deleteMark(id) {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await api.delete(`academics/marks/${id}/`)
    await fetchMarks()
  } catch { error.value = 'Erreur lors de la suppression.' }
}

const markColor = (m) => {
  if (m >= 16) return 'success'
  if (m >= 12) return 'primary'
  if (m >= 10) return 'warning'
  return 'danger'
}

const pageTitle = computed(() => {
  if (role === 'student') return 'Mes notes'
  if (role === 'parent') return 'Notes de mon enfant'
  return 'Liste des notes'
})
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">{{ pageTitle }}</h3>
        <p class="text-body-secondary mb-0">{{ filteredMarks.length }} note(s) trouvée(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin' || role === 'teacher'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter une note
        </CButton>
      </CCol>
    </CRow>

    <CCard class="mb-4">
      <CCardBody>
        <CFormInput v-model="filterSearch" placeholder="Rechercher par étudiant ou cours..." />
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
    </div>

    <CCard v-else>
      <CCardBody class="p-0">
        <div v-if="filteredMarks.length === 0" class="text-center py-5">
          <p class="fs-1">📝</p>
          <p class="fw-semibold">Aucune note disponible.</p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell v-if="role !== 'student'">Étudiant</CTableHeaderCell>
              <CTableHeaderCell>Cours</CTableHeaderCell>
              <CTableHeaderCell>Note /20</CTableHeaderCell>
              <CTableHeaderCell>Appréciation</CTableHeaderCell>
              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin' || role === 'teacher'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(mark, index) in filteredMarks" :key="mark.id">
              <CTableDataCell>{{ index + 1 }}</CTableDataCell>
              <CTableDataCell v-if="role !== 'student'" class="fw-semibold">{{ mark.enrollment.student }}</CTableDataCell>
              <CTableDataCell>{{ mark.enrollment.course }}</CTableDataCell>
              <CTableDataCell>
                <CBadge :color="markColor(mark.mark)">{{ mark.mark }}/20</CBadge>
              </CTableDataCell>
              <CTableDataCell>{{ mark.remark || '—' }}</CTableDataCell>
              <CTableDataCell>{{ mark.graded_at ? new Date(mark.graded_at).toLocaleDateString('fr-FR') : '—' }}</CTableDataCell>
              <CTableDataCell v-if="role === 'admin' || role === 'teacher'">
                <CButton color="warning" size="sm" class="me-2" @click="openEditModal(mark)">
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton color="danger" size="sm" @click="deleteMark(mark.id)">
                  <CIcon icon="cil-trash" /> Supprimer
                </CButton>
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>

    <CModal :visible="showModal" @close="showModal = false" backdrop="static">
      <CModalHeader>
        <CModalTitle>{{ isEditing ? 'Modifier la note' : 'Ajouter une note' }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CAlert v-if="modalError" color="danger">{{ modalError }}</CAlert>
        <CRow class="g-3">
          <CCol :md="12">
            <CFormLabel>Inscription (Étudiant - Cours)</CFormLabel>
            <CFormSelect v-model="form.enrollment_id">
              <option value="">Sélectionner</option>
              <option v-for="e in enrollments" :key="e.id" :value="e.id">
                {{ e.student?.user?.first_name }} {{ e.student?.user?.last_name }} — {{ e.course?.name }}
              </option>
            </CFormSelect>
          </CCol>
          <CCol :md="6">
            <CFormLabel>Note /20</CFormLabel>
            <CFormInput type="number" v-model="form.mark" min="0" max="20" step="0.5" />
          </CCol>
          <CCol :md="6">
            <CFormLabel>Appréciation</CFormLabel>
            <CFormInput v-model="form.remark" placeholder="Très bien, Passable..." />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showModal = false" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveMark" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>