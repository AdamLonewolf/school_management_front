<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const submissions = ref([])
const assignments = ref([])
const loading = ref(false)
const error = ref('')

// Pour étudiant — soumettre
const showModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const form = ref({ assignment_id: '' })

onMounted(async () => {
  await fetchSubmissions()
  if (role === 'student') await fetchAssignments()
})

async function fetchSubmissions() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('assignments/submissions/')
    submissions.value = res.data
  } catch { error.value = 'Impossible de charger les soumissions.' }
  finally { loading.value = false }
}

async function fetchAssignments() {
  try {
    const res = await api.get('assignments/assignments/')
    assignments.value = res.data
  } catch {}
}

async function submitAssignment() {
  saving.value = true
  modalError.value = ''
  try {
    await api.post('assignments/submissions/', form.value)
    await fetchSubmissions()
    showModal.value = false
  } catch (err) {
    modalError.value = err.response?.data?.detail || 'Erreur lors de la soumission.'
  } finally { saving.value = false }
}

async function deleteSubmission(id) {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await api.delete(`assignments/submissions/${id}/`)
    await fetchSubmissions()
  } catch { error.value = 'Erreur lors de la suppression.' }
}
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">
          {{ role === 'student' ? 'Mes soumissions' : 'Soumissions des étudiants' }}
        </h3>
        <p class="text-body-secondary mb-0">{{ submissions.length }} soumission(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'student'">
        <CButton color="primary" @click="showModal = true">
          <CIcon icon="cil-plus" class="me-2" /> Soumettre un devoir
        </CButton>
      </CCol>
    </CRow>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>
    <div v-if="loading" class="text-center py-5"><CSpinner color="primary" /></div>

    <CCard v-else>
      <CCardBody class="p-0">
        <div v-if="submissions.length === 0" class="text-center py-5">
          <p class="fs-1">📨</p>
          <p class="fw-semibold">Aucune soumission pour l'instant.</p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell v-if="role !== 'student'">Étudiant</CTableHeaderCell>
              <CTableHeaderCell>Devoir</CTableHeaderCell>
              <CTableHeaderCell>Soumis le</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin' || role === 'teacher'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(sub, index) in submissions" :key="sub.id">
              <CTableDataCell>{{ index + 1 }}</CTableDataCell>
              <CTableDataCell v-if="role !== 'student'" class="fw-semibold">
                {{ sub.student.first_name }} {{ sub.student.last_name }}
              </CTableDataCell>
              <CTableDataCell>
                <CBadge color="info">{{ sub.assignment.title }}</CBadge>
              </CTableDataCell>
              <CTableDataCell>
                {{ sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('fr-FR') : '—' }}
              </CTableDataCell>
              <CTableDataCell v-if="role === 'admin' || role === 'teacher'">
                <CButton color="danger" size="sm" @click="deleteSubmission(sub.id)">
                  <CIcon icon="cil-trash" /> Supprimer
                </CButton>
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>

    <!-- Modal soumission étudiant -->
    <CModal :visible="showModal" @close="showModal = false" backdrop="static">
      <CModalHeader>
        <CModalTitle>Soumettre un devoir</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CAlert v-if="modalError" color="danger">{{ modalError }}</CAlert>
        <CFormLabel>Sélectionner le devoir</CFormLabel>
        <CFormSelect v-model="form.assignment_id">
          <option value="">Choisir un devoir</option>
          <option v-for="a in assignments" :key="a.id" :value="a.id">
            {{ a.title }} — {{ a.course.name }}
          </option>
        </CFormSelect>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showModal = false" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="submitAssignment" :disabled="saving || !form.assignment_id">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Envoi...' : 'Soumettre' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>