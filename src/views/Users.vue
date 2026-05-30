<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const users = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')
const filterRole = ref('')

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
  role: '',
  is_active: true,
}
const form = ref({ ...emptyForm })

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('accounts/users/')
    users.value = response.data
  } catch {
    error.value = 'Impossible de charger les utilisateurs.'
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase()
    const matchSearch = !filterSearch.value || fullName.includes(filterSearch.value.toLowerCase())
    const matchRole = !filterRole.value || u.role === filterRole.value
    return matchSearch && matchRole
  })
})

const roleLabel = (r) => {
  const map = { admin: 'Admin', teacher: 'Professeur', student: 'Étudiant', parent: 'Parent' }
  return map[r] || r
}
const roleColor = (r) => {
  const map = { admin: 'danger', teacher: 'primary', student: 'success', parent: 'warning' }
  return map[r] || 'secondary'
}

function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(user) {
  isEditing.value = true
  editingId.value = user.id
  form.value = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    password: '',
    role: user.role,
    is_active: user.is_active,
  }
  modalError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveUser() {
  saving.value = true
  modalError.value = ''
  try {
    const payload = { ...form.value }
    if (!payload.password) delete payload.password
    if (isEditing.value) {
      await api.put(`accounts/users/${editingId.value}/`, payload)
    } else {
      await api.post('accounts/users/', payload)
    }
    await fetchUsers()
    closeModal()
  } catch (err) {
    modalError.value = err.response?.data?.detail || 'Une erreur est survenue.'
  } finally {
    saving.value = false
  }
}

async function deleteUser(id) {
  if (!confirm('Confirmer la suppression de cet utilisateur ?')) return
  try {
    await api.delete(`accounts/users/${id}/`)
    await fetchUsers()
  } catch {
    error.value = 'Erreur lors de la suppression.'
  }
}
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">Gestion des utilisateurs</h3>
        <p class="text-body-secondary mb-0">{{ filteredUsers.length }} utilisateur(s) trouvé(s)</p>
      </CCol>
      <CCol xs="auto">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter un utilisateur
        </CButton>
      </CCol>
    </CRow>

    <!-- Filtres -->
    <CCard class="mb-4">
      <CCardBody>
        <CRow class="g-3">
          <CCol :md="6">
            <CFormInput v-model="filterSearch" placeholder="Rechercher par nom..." />
          </CCol>
          <CCol :md="6">
            <CFormSelect v-model="filterRole">
              <option value="">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Professeur</option>
              <option value="student">Étudiant</option>
              <option value="parent">Parent</option>
            </CFormSelect>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CAlert v-if="error" color="danger" class="mb-4">{{ error }}</CAlert>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <p class="mt-2 text-body-secondary">Chargement...</p>
    </div>

    <CCard v-else>
      <CCardBody class="p-0">

        <div v-if="filteredUsers.length === 0" class="text-center py-5">
          <p class="fs-1">👤</p>
          <p class="fw-semibold">Aucun utilisateur trouvé.</p>
          <p class="text-body-secondary">Cliquez sur "Ajouter un utilisateur" pour commencer.</p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Nom complet</CTableHeaderCell>
              <CTableHeaderCell>Email</CTableHeaderCell>
              <CTableHeaderCell>Rôle</CTableHeaderCell>
              <CTableHeaderCell>Statut</CTableHeaderCell>
              <CTableHeaderCell>Créé le</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(user, index) in filteredUsers" :key="user.id">
              <CTableDataCell class="text-body-secondary">{{ index + 1 }}</CTableDataCell>
              <CTableDataCell class="fw-semibold">
                {{ user.first_name }} {{ user.last_name }}
              </CTableDataCell>
              <CTableDataCell>{{ user.email }}</CTableDataCell>
              <CTableDataCell>
                <CBadge :color="roleColor(user.role)">{{ roleLabel(user.role) }}</CBadge>
              </CTableDataCell>
              <CTableDataCell>
                <CBadge :color="user.is_active ? 'success' : 'secondary'">
                  {{ user.is_active ? 'Actif' : 'Inactif' }}
                </CBadge>
              </CTableDataCell>
              <CTableDataCell>
                {{ user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—' }}
              </CTableDataCell>
              <CTableDataCell>
                <CButton color="warning" size="sm" class="me-2" @click="openEditModal(user)">
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton color="danger" size="sm" @click="deleteUser(user.id)">
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
        <CModalTitle>{{ isEditing ? "Modifier l'utilisateur" : "Ajouter un utilisateur" }}</CModalTitle>
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
            <CFormLabel>Rôle</CFormLabel>
            <CFormSelect v-model="form.role">
              <option value="">Sélectionner un rôle</option>
              <option value="admin">Admin</option>
              <option value="teacher">Professeur</option>
              <option value="student">Étudiant</option>
              <option value="parent">Parent</option>
            </CFormSelect>
          </CCol>
          <CCol :md="6" class="d-flex align-items-end">
            <CFormCheck
              v-model="form.is_active"
              label="Compte actif"
              id="isActive"
            />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeModal" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveUser" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>