<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole

const teachers = ref([])
const loading = ref(false)
const error = ref('')
const filterSearch = ref('')

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
  speciality: '',
  phone_number: '',
  gender: '',
  address: '',
}
const form = ref({ ...emptyForm })

onMounted(async () => {
  await fetchTeachers()
})

async function fetchTeachers() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('accounts/teachers/')
    teachers.value = response.data
  } catch {
    error.value = 'Impossible de charger les professeurs.'
  } finally {
    loading.value = false
  }
}

const filteredTeachers = computed(() => {
  return teachers.value.filter(t => {
    const fullName = `${t.user.first_name} ${t.user.last_name}`.toLowerCase()
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

function openEditModal(teacher) {
  isEditing.value = true
  editingId.value = teacher.id
  form.value = {
    first_name: teacher.user.first_name,
    last_name: teacher.user.last_name,
    email: teacher.user.email,
    password: '',
    speciality: teacher.speciality || '',
    phone_number: teacher.phone_number || '',
    gender: teacher.gender || '',
    address: teacher.address || '',
  }
  modalError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveTeacher() {
  saving.value = true
  modalError.value = ''
  try {
    const payload = { ...form.value }
    if (!payload.password) delete payload.password
    if (isEditing.value) {
      await api.put(`accounts/teachers/${editingId.value}/`, payload)
    } else {
      await api.post('accounts/teachers/', payload)
    }
    await fetchTeachers()
    closeModal()
  } catch (err) {
    modalError.value = err.response?.data?.detail || 'Une erreur est survenue.'
  } finally {
    saving.value = false
  }
}

async function deleteTeacher(id) {
  if (!confirm('Confirmer la suppression de ce professeur ?')) return
  try {
    await api.delete(`accounts/teachers/${id}/`)
    await fetchTeachers()
  } catch {
    error.value = 'Erreur lors de la suppression.'
  }
}
</script>

<template>
  <div>
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">Liste des professeurs</h3>
        <p class="text-body-secondary mb-0">{{ filteredTeachers.length }} professeur(s) trouvé(s)</p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter un professeur
        </CButton>
      </CCol>
    </CRow>

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

        <div v-if="filteredTeachers.length === 0" class="text-center py-5">
          <p class="fs-1">👨‍🏫</p>
          <p class="fw-semibold">Aucun professeur pour l'instant.</p>
          <p class="text-body-secondary" v-if="role === 'admin'">
            Cliquez sur "Ajouter un professeur" pour commencer.
          </p>
        </div>

        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Nom complet</CTableHeaderCell>
              <CTableHeaderCell>Email</CTableHeaderCell>
              <CTableHeaderCell>Spécialité</CTableHeaderCell>
              <CTableHeaderCell>Genre</CTableHeaderCell>
              <CTableHeaderCell>Téléphone</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(teacher, index) in filteredTeachers" :key="teacher.id">
              <CTableDataCell class="text-body-secondary">{{ index + 1 }}</CTableDataCell>
              <CTableDataCell class="fw-semibold">
                {{ teacher.user.first_name }} {{ teacher.user.last_name }}
              </CTableDataCell>
              <CTableDataCell>{{ teacher.user.email }}</CTableDataCell>
              <CTableDataCell>
                <CBadge color="info">{{ teacher.speciality || '—' }}</CBadge>
              </CTableDataCell>
              <CTableDataCell>
                <CBadge :color="teacher.gender === 'M' ? 'primary' : 'danger'">
                  {{ teacher.gender === 'M' ? 'Masculin' : teacher.gender === 'F' ? 'Féminin' : '—' }}
                </CBadge>
              </CTableDataCell>
              <CTableDataCell>{{ teacher.phone_number || '—' }}</CTableDataCell>
              <CTableDataCell v-if="role === 'admin'">
                <CButton color="warning" size="sm" class="me-2" @click="openEditModal(teacher)">
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton color="danger" size="sm" @click="deleteTeacher(teacher.id)">
                  <CIcon icon="cil-trash" /> Supprimer
                </CButton>
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>

      </CCardBody>
    </CCard>

    <CModal :visible="showModal" @close="closeModal" size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>{{ isEditing ? "Modifier le professeur" : "Ajouter un professeur" }}</CModalTitle>
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
            <CFormLabel>Spécialité</CFormLabel>
            <CFormInput v-model="form.speciality" placeholder="Ex: Mathématiques" />
          </CCol>
          <CCol :md="6">
            <CFormLabel>Genre</CFormLabel>
            <CFormSelect v-model="form.gender">
              <option value="">Sélectionner</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </CFormSelect>
          </CCol>
          <CCol :md="6">
            <CFormLabel>Téléphone</CFormLabel>
            <CFormInput v-model="form.phone_number" placeholder="+225 07 00 00 00" />
          </CCol>
          <CCol :md="6">
            <CFormLabel>Adresse</CFormLabel>
            <CFormInput v-model="form.address" placeholder="Adresse complète" />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeModal" :disabled="saving">Annuler</CButton>
        <CButton color="primary" @click="saveTeacher" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>