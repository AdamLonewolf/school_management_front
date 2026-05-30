<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const parents = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')

// Modal
const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)
const editingId = ref(null)

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone_number: '',
  address: '',
  parent_type: '',
}
const form = ref({ ...emptyForm })

onMounted(async () => {
  await fetchParents()
})

async function fetchParents() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('accounts/parents/')
    parents.value = response.data
  } catch {
    error.value = 'Impossible de charger les parents.'
  } finally {
    loading.value = false
  }
}

const filteredParents = computed(() => {
  return parents.value.filter(p => {
    const fullName = `${p.user.first_name} ${p.user.last_name}`.toLowerCase()
    return !filterSearch.value || fullName.includes(filterSearch.value.toLowerCase())
  })
})

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(parent) {
  isEditing.value = true
  editingId.value = parent.id
  form.value = {
    first_name: parent.user.first_name,
    last_name: parent.user.last_name,
    email: parent.user.email,
    password: '',
    phone_number: parent.phone_number || '',
    address: parent.address || '',
    parent_type: parent.parent_type || '',
  }
  modalError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveParent() {
  saving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) {
      await api.put(`accounts/parents/${editingId.value}/`, form.value)
    } else {
      await api.post('accounts/parents/', form.value)
    }
    await fetchParents()
    closeModal()
  } catch (err) {
    modalError.value = err.response?.data?.detail || 'Une erreur est survenue.'
  } finally {
    saving.value = false
  }
}

async function deleteParent(id) {
  if (!confirm('Confirmer la suppression de ce parent ?')) return
  try {
    await api.delete(`accounts/parents/${id}/`)
    await fetchParents()
  } catch {
    error.value = 'Erreur lors de la suppression.'
  }
}
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">Liste des parents</h3>
        <p class="text-body-secondary mb-0">{{ filteredParents.length }} parent(s) trouvé(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter un parent
        </CButton>
      </CCol>
    </CRow>

    <!-- Filtre recherche -->
    <CCard class="mb-4">
      <CCardBody>
        <CFormInput v-model="filterSearch" placeholder="Rechercher par nom..." />
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger" class="mb-4">{{ error }}</CAlert>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <p class="mt-2 text-body-secondary">Chargement...</p>
    </div>

    <CCard v-else>
      <CCardBody class="p-0">

        <div v-if="filteredParents.length === 0" class="text-center py-5">
          <p class="fs-1">👨‍👩‍👧</p>
          <p class="fw-semibold">Aucun parent pour l'instant.</p>
          <p class="text-body-secondary" v-if="role === 'admin'">
            Cliquez sur "Ajouter un parent" pour commencer.
          </p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Nom complet</CTableHeaderCell>
              <CTableHeaderCell>Email</CTableHeaderCell>
              <CTableHeaderCell>Type</CTableHeaderCell>
              <CTableHeaderCell>Téléphone</CTableHeaderCell>
              <CTableHeaderCell>Enfant(s)</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(parent, index) in filteredParents" :key="parent.id">
              <CTableDataCell class="text-body-secondary">{{ index + 1 }}</CTableDataCell>
              <CTableDataCell class="fw-semibold">
                {{ parent.user.first_name }} {{ parent.user.last_name }}
              </CTableDataCell>
              <CTableDataCell>{{ parent.user.email }}</CTableDataCell>
              <CTableDataCell>
                <CBadge :color="parent.parent_type === 'father' ? 'primary' : parent.parent_type === 'mother' ? 'danger' : 'secondary'">
                  {{ parent.parent_type === 'father' ? 'Père' : parent.parent_type === 'mother' ? 'Mère' : parent.parent_type || '—' }}
                </CBadge>
              </CTableDataCell>
              <CTableDataCell>{{ parent.phone_number || '—' }}</CTableDataCell>
              <CTableDataCell>
                <span v-if="parent.students && parent.students.length">
                  <CBadge color="info" class="me-1" v-for="s in parent.students" :key="s.id">
                    {{ s.first_name }} {{ s.last_name }}
                  </CBadge>
                </span>
                <span v-else class="text-body-secondary">—</span>
              </CTableDataCell>
              <CTableDataCell v-if="role === 'admin'">
                <CButton color="warning" size="sm" class="me-2" @click="openEditModal(parent)">
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton color="danger" size="sm" @click="deleteParent(parent.id)">
                  <CIcon icon="cil-trash" /> Supprimer
                </CButton>
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>

      </CCardBody>
    </CCard>

    <!-- Modal -->
    <CModal :visible="showModal" @close="closeModal" size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>{{ isEditing ? "Modifier le parent" : "Ajouter un parent" }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CAlert v-if="modalError" color="danger">{{ modalError }}</CAlert>
        <CRow class="g-3">
          <CCol :md="6">
            <CFormLabel>Prénom</CFormLabel>
            <CFormInput v-model="form.first_name" placeholder="Prénom" />
          </CCol>
          <CCol :md="6">
            <CFormLabel>Nom</CFormLabel>
            <CFormInput v-model="form.last_name" placeholder="Nom" />
          </CCol>
          <CCol :md="6">
            <CFormLabel>Email</CFormLabel>
            <CFormInput type="email" v-model="form.email" placeholder="email@exemple.com" />
          </CCol>
          <CCol :md="6">
            <CFormLabel>{{ isEditing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe' }}</CFormLabel>
            <CFormInput type="password" v-model="form.password" placeholder="••••••••" />
          </CCol>
          <CCol :md="6">
            <CFormLabel>Type de parent</CFormLabel>
            <CFormSelect v-model="form.parent_type">
              <option value="">Sélectionner</option>
              <option value="father">Père</option>
              <option value="mother">Mère</option>
              <option value="guardian">Tuteur</option>
            </CFormSelect>
          </CCol>
          <CCol :md="6">
            <CFormLabel>Téléphone</CFormLabel>
            <CFormInput v-model="form.phone_number" placeholder="+225 07 00 00 00" />
          </CCol>
          <CCol :md="12">
            <CFormLabel>Adresse</CFormLabel>
            <CFormInput v-model="form.address" placeholder="Adresse complète" />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeModal" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveParent" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>