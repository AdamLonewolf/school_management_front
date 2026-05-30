<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const fields = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)
const editingId = ref(null)

const emptyForm = { name: '', description: '' }
const form = ref({ ...emptyForm })

onMounted(async () => { await fetchFields() })

async function fetchFields() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('academics/fields/')
    fields.value = res.data
  } catch { error.value = 'Impossible de charger les filières.' }
  finally { loading.value = false }
}

const filteredFields = computed(() => {
  if (!filterSearch.value) return fields.value
  return fields.value.filter(f => f.name.toLowerCase().includes(filterSearch.value.toLowerCase()))
})

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(field) {
  isEditing.value = true
  editingId.value = field.id
  form.value = { name: field.name, description: field.description || '' }
  modalError.value = ''
  showModal.value = true
}

async function saveField() {
  saving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) await api.put(`academics/fields/${editingId.value}/`, form.value)
    else await api.post('academics/fields/', form.value)
    await fetchFields()
    showModal.value = false
  } catch (err) { modalError.value = err.response?.data?.detail || 'Erreur.' }
  finally { saving.value = false }
}

async function deleteField(id) {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await api.delete(`academics/fields/${id}/`)
    await fetchFields()
  } catch { error.value = 'Erreur lors de la suppression.' }
}
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">Filières</h3>
        <p class="text-body-secondary mb-0">{{ filteredFields.length }} filière(s) trouvée(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter une filière
        </CButton>
      </CCol>
    </CRow>

    <CCard class="mb-4">
      <CCardBody>
        <CFormInput v-model="filterSearch" placeholder="Rechercher une filière..." />
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>
    <div v-if="loading" class="text-center py-5"><CSpinner color="primary" /></div>

    <CCard v-else>
      <CCardBody class="p-0">
        <div v-if="filteredFields.length === 0" class="text-center py-5">
          <p class="fs-1">🗂️</p>
          <p class="fw-semibold">Aucune filière disponible.</p>
          <p class="text-body-secondary" v-if="role === 'admin'">Cliquez sur "Ajouter une filière" pour commencer.</p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Nom</CTableHeaderCell>
              <CTableHeaderCell>Description</CTableHeaderCell>
              <CTableHeaderCell>Créée le</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(field, index) in filteredFields" :key="field.id">
              <CTableDataCell>{{ index + 1 }}</CTableDataCell>
              <CTableDataCell class="fw-semibold">{{ field.name }}</CTableDataCell>
              <CTableDataCell>{{ field.description || '—' }}</CTableDataCell>
              <CTableDataCell>{{ new Date(field.created_at).toLocaleDateString('fr-FR') }}</CTableDataCell>
              <CTableDataCell v-if="role === 'admin'">
                <CButton color="warning" size="sm" class="me-2" @click="openEditModal(field)">
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton color="danger" size="sm" @click="deleteField(field.id)">
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
        <CModalTitle>{{ isEditing ? 'Modifier la filière' : 'Ajouter une filière' }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CAlert v-if="modalError" color="danger">{{ modalError }}</CAlert>
        <CRow class="g-3">
          <CCol :md="12">
            <CFormLabel>Nom de la filière</CFormLabel>
            <CFormInput v-model="form.name" placeholder="Ex: Informatique" />
          </CCol>
          <CCol :md="12">
            <CFormLabel>Description</CFormLabel>
            <CFormTextarea v-model="form.description" rows="3" placeholder="Description de la filière..." />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showModal = false" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveField" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>