<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const assignments = ref([])
const courses = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)
const editingId = ref(null)

// Modal soumission (étudiant)
const showSubmitModal = ref(false)
const submittingAssignment = ref(null)
const submitForm = ref({ content: '', file: null })
const submitting = ref(false)

const emptyForm = { course_id: '', title: '', description: '', due_date: '' }
const form = ref({ ...emptyForm })

onMounted(async () => {
  await fetchAssignments()
  if (role === 'admin' || role === 'teacher') await fetchCourses()
})

async function fetchAssignments() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('assignments/assignments/')
    assignments.value = res.data
  } catch { error.value = 'Impossible de charger les devoirs.' }
  finally { loading.value = false }
}

async function fetchCourses() {
  try {
    const res = await api.get('academics/courses/')
    courses.value = res.data
  } catch {}
}

const filteredAssignments = computed(() => {
  if (!filterSearch.value) return assignments.value
  return assignments.value.filter(a =>
    a.title.toLowerCase().includes(filterSearch.value.toLowerCase()) ||
    a.course.name.toLowerCase().includes(filterSearch.value.toLowerCase())
  )
})

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(assignment) {
  isEditing.value = true
  editingId.value = assignment.id
  form.value = {
    course_id: assignment.course_id,
    title: assignment.title,
    description: assignment.description || '',
    due_date: assignment.due_date || '',
  }
  modalError.value = ''
  showModal.value = true
}

async function saveAssignment() {
  saving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) await api.put(`assignments/assignments/${editingId.value}/`, form.value)
    else await api.post('assignments/assignments/', form.value)
    await fetchAssignments()
    showModal.value = false
  } catch (err) { modalError.value = err.response?.data?.detail || 'Erreur lors de l\'enregistrement.' }
  finally { saving.value = false }
}

async function deleteAssignment(id) {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await api.delete(`assignments/assignments/${id}/`)
    await fetchAssignments()
  } catch { error.value = 'Erreur lors de la suppression.' }
}

// Soumission étudiant
function openSubmitModal(assignment) {
  submittingAssignment.value = assignment
  submitForm.value = { content: '' }
  showSubmitModal.value = true
}

async function submitAssignment() {
  submitting.value = true
  try {
    await api.post('assignments/submissions/', {
      assignment_id: submittingAssignment.value.id,
      content: submitForm.value.content,
    })
    showSubmitModal.value = false
    alert('Devoir soumis avec succès !')
  } catch (err) {
    alert(err.response?.data?.detail || 'Erreur lors de la soumission.')
  } finally { submitting.value = false }
}

const isOverdue = (due_date) => due_date && new Date(due_date) < new Date()

const pageTitle = computed(() => {
  if (role === 'student') return 'Mes devoirs'
  if (role === 'parent') return 'Devoirs de mon enfant'
  return 'Liste des devoirs'
})
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">{{ pageTitle }}</h3>
        <p class="text-body-secondary mb-0">{{ filteredAssignments.length }} devoir(s) trouvé(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin' || role === 'teacher'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter un devoir
        </CButton>
      </CCol>
    </CRow>

    <CCard class="mb-4">
      <CCardBody>
        <CFormInput v-model="filterSearch" placeholder="Rechercher par titre ou cours..." />
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
    </div>

    <CCard v-else>
      <CCardBody class="p-0">
        <div v-if="filteredAssignments.length === 0" class="text-center py-5">
          <p class="fs-1">📚</p>
          <p class="fw-semibold">Aucun devoir disponible.</p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Titre</CTableHeaderCell>
              <CTableHeaderCell>Cours</CTableHeaderCell>
              <CTableHeaderCell>Description</CTableHeaderCell>
              <CTableHeaderCell>Date limite</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(assignment, index) in filteredAssignments" :key="assignment.id">
              <CTableDataCell>{{ index + 1 }}</CTableDataCell>
              <CTableDataCell class="fw-semibold">{{ assignment.title }}</CTableDataCell>
              <CTableDataCell>
                <CBadge color="info">{{ assignment.course.name }}</CBadge>
              </CTableDataCell>
              <CTableDataCell>{{ assignment.description || '—' }}</CTableDataCell>
              <CTableDataCell>
                <CBadge :color="isOverdue(assignment.due_date) ? 'danger' : 'success'">
                  {{ assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('fr-FR') : '—' }}
                </CBadge>
              </CTableDataCell>
              <CTableDataCell>
                <!-- Admin et Teacher : modifier/supprimer -->
                <template v-if="role === 'admin' || role === 'teacher'">
                  <CButton color="warning" size="sm" class="me-2" @click="openEditModal(assignment)">
                    <CIcon icon="cil-pencil" /> Modifier
                  </CButton>
                  <CButton color="danger" size="sm" @click="deleteAssignment(assignment.id)">
                    <CIcon icon="cil-trash" /> Supprimer
                  </CButton>
                </template>
                <!-- Étudiant : soumettre -->
                <template v-else-if="role === 'student'">
                  <CButton color="primary" size="sm" @click="openSubmitModal(assignment)" :disabled="isOverdue(assignment.due_date)">
                    <CIcon icon="cil-send" /> Soumettre
                  </CButton>
                </template>
                <template v-else>—</template>
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>

    <!-- Modal Admin/Teacher : Ajouter/Modifier -->
    <CModal :visible="showModal" @close="showModal = false" size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>{{ isEditing ? 'Modifier le devoir' : 'Ajouter un devoir' }}</CModalTitle>
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
            <CFormLabel>Titre</CFormLabel>
            <CFormInput v-model="form.title" placeholder="Titre du devoir" />
          </CCol>
          <CCol :md="12">
            <CFormLabel>Description</CFormLabel>
            <CFormTextarea v-model="form.description" rows="3" placeholder="Description du devoir..." />
          </CCol>
          <CCol :md="6">
            <CFormLabel>Date limite</CFormLabel>
            <CFormInput type="date" v-model="form.due_date" />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showModal = false" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveAssignment" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- Modal Étudiant : Soumettre -->
    <CModal :visible="showSubmitModal" @close="showSubmitModal = false" backdrop="static">
      <CModalHeader>
        <CModalTitle>Soumettre — {{ submittingAssignment?.title }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CFormLabel>Votre réponse</CFormLabel>
        <CFormTextarea v-model="submitForm.content" rows="5" placeholder="Écrivez votre réponse ici..." />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showSubmitModal = false" :disabled="submitting">Annuler</CButton>
        <CButton color="primary" @click="submitAssignment" :disabled="submitting">
          <CSpinner v-if="submitting" size="sm" class="me-2" />
          {{ submitting ? 'Envoi...' : 'Soumettre' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>