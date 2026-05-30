<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const courses = ref([])
const teachers = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)
const editingId = ref(null)

const emptyForm = { name: '', description: '', teacher_id: '' }
const form = ref({ ...emptyForm })

onMounted(async () => {
  await fetchCourses()
  if (role === 'admin') await fetchTeachers()
})

async function fetchCourses() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('academics/courses/')
    courses.value = res.data
  } catch { error.value = 'Impossible de charger les cours.' }
  finally { loading.value = false }
}

async function fetchTeachers() {
  try { const res = await api.get('accounts/teachers/'); teachers.value = res.data } catch {}
}

const filteredCourses = computed(() => {
  if (!filterSearch.value) return courses.value
  return courses.value.filter(c =>
    c.name.toLowerCase().includes(filterSearch.value.toLowerCase())
  )
})

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(course) {
  isEditing.value = true
  editingId.value = course.id
  form.value = { name: course.name, description: course.description || '', teacher_id: course.teacher_id || '' }
  modalError.value = ''
  showModal.value = true
}

async function saveCourse() {
  saving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) await api.put(`academics/courses/${editingId.value}/`, form.value)
    else await api.post('academics/courses/', form.value)
    await fetchCourses()
    showModal.value = false
  } catch (err) { modalError.value = err.response?.data?.detail || 'Erreur.' }
  finally { saving.value = false }
}

async function deleteCourse(id) {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await api.delete(`academics/courses/${id}/`)
    await fetchCourses()
  } catch { error.value = 'Erreur lors de la suppression.' }
}
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">Liste des cours</h3>
        <p class="text-body-secondary mb-0">{{ filteredCourses.length }} cours trouvé(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter un cours
        </CButton>
      </CCol>
    </CRow>

    <CCard class="mb-4">
      <CCardBody>
        <CFormInput v-model="filterSearch" placeholder="Rechercher un cours..." />
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>
    <div v-if="loading" class="text-center py-5"><CSpinner color="primary" /></div>

    <CCard v-else>
      <CCardBody class="p-0">
        <div v-if="filteredCourses.length === 0" class="text-center py-5">
          <p class="fs-1">📖</p>
          <p class="fw-semibold">Aucun cours disponible.</p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Nom du cours</CTableHeaderCell>
              <CTableHeaderCell>Description</CTableHeaderCell>
              <CTableHeaderCell>Professeur</CTableHeaderCell>
              <CTableHeaderCell>Créé le</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(course, index) in filteredCourses" :key="course.id">
              <CTableDataCell>{{ index + 1 }}</CTableDataCell>
              <CTableDataCell class="fw-semibold">{{ course.name }}</CTableDataCell>
              <CTableDataCell>{{ course.description || '—' }}</CTableDataCell>
              <CTableDataCell>
                <span v-if="course.teacher">
                  {{ course.teacher.first_name }} {{ course.teacher.last_name }}
                </span>
                <span v-else class="text-body-secondary">—</span>
              </CTableDataCell>
              <CTableDataCell>{{ new Date(course.created_at).toLocaleDateString('fr-FR') }}</CTableDataCell>
              <CTableDataCell v-if="role === 'admin'">
                <CButton color="warning" size="sm" class="me-2" @click="openEditModal(course)">
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton color="danger" size="sm" @click="deleteCourse(course.id)">
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
        <CModalTitle>{{ isEditing ? 'Modifier le cours' : 'Ajouter un cours' }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CAlert v-if="modalError" color="danger">{{ modalError }}</CAlert>
        <CRow class="g-3">
          <CCol :md="12">
            <CFormLabel>Nom du cours</CFormLabel>
            <CFormInput v-model="form.name" placeholder="Ex: Mathématiques L2" />
          </CCol>
          <CCol :md="12">
            <CFormLabel>Description</CFormLabel>
            <CFormTextarea v-model="form.description" rows="3" placeholder="Description du cours..." />
          </CCol>
          <CCol :md="12">
            <CFormLabel>Professeur</CFormLabel>
            <CFormSelect v-model="form.teacher_id">
              <option value="">Sélectionner un professeur</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">
                {{ t.user.first_name }} {{ t.user.last_name }}
              </option>
            </CFormSelect>
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showModal = false" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveCourse" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>