<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const levels = ref([])
const fields = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)
const editingId = ref(null)

const emptyForm = { name: '', field_id: '' }
const form = ref({ ...emptyForm })

onMounted(async () => {
  await fetchLevels()
  await fetchFields()
})

async function fetchLevels() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('academics/levels/')
    levels.value = res.data
  } catch { error.value = 'Impossible de charger les niveaux.' }
  finally { loading.value = false }
}

async function fetchFields() {
  try { const res = await api.get('academics/fields/'); fields.value = res.data } catch {}
}

const filteredLevels = computed(() => {
  if (!filterSearch.value) return levels.value
  return levels.value.filter(l => l.name.toLowerCase().includes(filterSearch.value.toLowerCase()))
})

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(level) {
  isEditing.value = true
  editingId.value = level.id
  form.value = { name: level.name, field_id: level.field_id }
  modalError.value = ''
  showModal.value = true
}

async function saveLevel() {
  saving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) await api.put(`academics/levels/${editingId.value}/`, form.value)
    else await api.post('academics/levels/', form.value)
    await fetchLevels()
    showModal.value = false
  } catch (err) { modalError.value = err.response?.data?.detail || 'Erreur.' }
  finally { saving.value = false }
}

async function deleteLevel(id) {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await api.delete(`academics/levels/${id}/`)
    await fetchLevels()
  } catch { error.value = 'Erreur lors de la suppression.' }
}
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">Niveaux</h3>
        <p class="text-body-secondary mb-0">{{ filteredLevels.length }} niveau(x) trouvé(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter un niveau
        </CButton>
      </CCol>
    </CRow>

    <CCard class="mb-4">
      <CCardBody>
        <CFormInput v-model="filterSearch" placeholder="Rechercher un niveau..." />
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>
    <div v-if="loading" class="text-center py-5"><CSpinner color="primary" /></div>

    <CCard v-else>
      <CCardBody class="p-0">
        <div v-if="filteredLevels.length === 0" class="text-center py-5">
          <p class="fs-1">🎓</p>
          <p class="fw-semibold">Aucun niveau disponible.</p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Niveau</CTableHeaderCell>
              <CTableHeaderCell>Filière</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(level, index) in filteredLevels" :key="level.id">
              <CTableDataCell>{{ index + 1 }}</CTableDataCell>
              <CTableDataCell class="fw-semibold">{{ level.name }}</CTableDataCell>
              <CTableDataCell>
                <CBadge color="info">{{ level.field?.name || '—' }}</CBadge>
              </CTableDataCell>
              <CTableDataCell v-if="role === 'admin'">
                <CButton color="warning" size="sm" class="me-2" @click="openEditModal(level)">
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton color="danger" size="sm" @click="deleteLevel(level.id)">
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
        <CModalTitle>{{ isEditing ? 'Modifier le niveau' : 'Ajouter un niveau' }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CAlert v-if="modalError" color="danger">{{ modalError }}</CAlert>
        <CRow class="g-3">
          <CCol :md="12">
            <CFormLabel>Nom du niveau</CFormLabel>
            <CFormInput v-model="form.name" placeholder="Ex: Licence 1" />
          </CCol>
          <CCol :md="12">
            <CFormLabel>Filière</CFormLabel>
            <CFormSelect v-model="form.field_id">
              <option value="">Sélectionner une filière</option>
              <option v-for="f in fields" :key="f.id" :value="f.id">{{ f.name }}</option>
            </CFormSelect>
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showModal = false" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveLevel" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>