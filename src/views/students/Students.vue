<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuth()
const role = authStore.userRole


const students = ref([])
const levels = ref([])
const fields = ref([])
const loading = ref(false)
const error = ref('')


const filterLevel = ref('')
const filterField = ref('')
const filterSearch = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const saving = ref(false)

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  birthdate: '',
  gender: '',
  phone_number: '',
  address: '',
  level_id: '',
}
const form = ref({ ...emptyForm })
const editingId = ref(null)


onMounted(async () => {
  await fetchStudents()
  if (role === 'admin') {
    await fetchLevels()
    await fetchFields()
  }
})

async function fetchStudents() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('accounts/students/')
    students.value = response.data
  } catch (err) {
    error.value = 'Impossible de charger les étudiants.'
  } finally {
    loading.value = false
  }
}

async function fetchLevels() {
  try {
    const response = await api.get('academics/levels/')
    levels.value = response.data
  } catch {}
}

async function fetchFields() {
  try {
    const response = await api.get('academics/fields/')
    fields.value = response.data
  } catch {}
}


const filteredStudents = computed(() => {
  return students.value.filter(s => {
    const fullName = `${s.user.first_name} ${s.user.last_name}`.toLowerCase()
    const matchSearch = !filterSearch.value || fullName.includes(filterSearch.value.toLowerCase())
    const matchLevel = !filterLevel.value || s.level_id == filterLevel.value
    const matchField = !filterField.value || s.level?.field === fields.value.find(f => f.id == filterField.value)?.name
    return matchSearch && matchLevel && matchField
  })
})


function openAddModal() {
  isEditing.value = false
  form.value = { ...emptyForm }
  editingId.value = null
  modalError.value = ''
  showModal.value = true
}

function openEditModal(student) {
  isEditing.value = true
  editingId.value = student.id
  form.value = {
    first_name: student.user.first_name,
    last_name: student.user.last_name,
    email: student.user.email,
    password: '',
    birthdate: student.birthdate || '',
    gender: student.gender || '',
    phone_number: student.phone_number || '',
    address: student.address || '',
    level_id: student.level_id || '',
  }
  modalError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}


async function saveStudent() {
  saving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) {
      await api.put(`accounts/students/${editingId.value}/`, form.value)
    } else {
      await api.post('accounts/students/', form.value)
    }
    await fetchStudents()
    closeModal()
  } catch (err) {
    modalError.value = err.response?.data?.detail || 'Une erreur est survenue.'
  } finally {
    saving.value = false
  }
}

async function deleteStudent(id) {
  if (!confirm('Confirmer la suppression de cet étudiant ?')) return
  try {
    await api.delete(`accounts/students/${id}/`)
    await fetchStudents()
  } catch {
    error.value = 'Erreur lors de la suppression.'
  }
}

// Titre de la page selon le rôle
const pageTitle = computed(() => {
  if (role === 'admin') return 'Liste des étudiants'
  if (role === 'teacher') return 'Mes étudiants'
  if (role === 'parent') return 'Mon enfant'
  return 'Étudiants'
})
</script>

<template>
  <div>
    
    <CRow class="mb-4 align-items-center">
      <CCol>
        <h3 class="fw-bold mb-0">{{ pageTitle }}</h3>
        <p class="text-body-secondary mb-0">
          {{ filteredStudents.length }} étudiant(s) trouvé(s)
        </p>
      </CCol>
      <CCol xs="auto" v-if="role === 'admin'">
        <CButton color="primary" @click="openAddModal">
          <CIcon icon="cil-plus" class="me-2" /> Ajouter un étudiant
        </CButton>
      </CCol>
    </CRow>


    <CCard class="mb-4" v-if="role === 'admin'">
      <CCardBody>
        <CRow class="g-3">
          <CCol :md="4">
            <CFormInput
              v-model="filterSearch"
              placeholder="Rechercher par nom..."
              prepend="🔍"
            />
          </CCol>
          <CCol :md="4">
            <CFormSelect v-model="filterLevel">
              <option value="">Tous les niveaux</option>
             <option v-for="level in levels" :key="level.id" :value="level.id">
                {{ level.name }} — {{ level.field?.name || '' }}
              </option>
            </CFormSelect>
          </CCol>
          <CCol :md="4">
            <CFormSelect v-model="filterField">
              <option value="">Toutes les filières</option>
              <option v-for="field in fields" :key="field.id" :value="field.id">
                {{ field.name }}
              </option>
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

        <div v-if="filteredStudents.length === 0" class="text-center py-5">
          <p class="fs-1">🎓</p>
          <p class="fw-semibold">Aucun étudiant pour l'instant.</p>
          <p class="text-body-secondary">
            {{ role === 'admin' ? 'Cliquez sur "Ajouter un étudiant" pour commencer.' : 'Aucun étudiant ne vous est associé.' }}
          </p>
        </div>

        <!-- Tableau rempli -->
        <CTable v-else hover responsive class="mb-0">
          <CTableHead class="bg-body-secondary">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Nom complet</CTableHeaderCell>
              <CTableHeaderCell>Email</CTableHeaderCell>
              <CTableHeaderCell>N° Étudiant</CTableHeaderCell>
              <CTableHeaderCell>Niveau</CTableHeaderCell>
              <CTableHeaderCell>Filière</CTableHeaderCell>
              <CTableHeaderCell>Genre</CTableHeaderCell>
              <CTableHeaderCell>Téléphone</CTableHeaderCell>
              <CTableHeaderCell v-if="role === 'admin'">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(student, index) in filteredStudents" :key="student.id">
              <CTableDataCell class="text-body-secondary">{{ index + 1 }}</CTableDataCell>
              <CTableDataCell class="fw-semibold">
                {{ student.user.first_name }} {{ student.user.last_name }}
              </CTableDataCell>
              <CTableDataCell>{{ student.user.email }}</CTableDataCell>
              <CTableDataCell>
                <CBadge color="info">{{ student.student_number || '—' }}</CBadge>
              </CTableDataCell>
              <CTableDataCell>{{ student.level?.name || '—' }}</CTableDataCell>
              <CTableDataCell>{{ student.level?.field || '—' }}</CTableDataCell>
              <CTableDataCell>
                <CBadge :color="student.gender === 'M' ? 'primary' : 'danger'">
                  {{ student.gender === 'M' ? 'Masculin' : student.gender === 'F' ? 'Féminin' : '—' }}
                </CBadge>
              </CTableDataCell>
              <CTableDataCell>{{ student.phone_number || '—' }}</CTableDataCell>
              <CTableDataCell v-if="role === 'admin'">
                <CButton
                  color="warning"
                  size="sm"
                  class="me-2"
                  @click="openEditModal(student)"
                >
                  <CIcon icon="cil-pencil" /> Modifier
                </CButton>
                <CButton
                  color="danger"
                  size="sm"
                  @click="deleteStudent(student.id)"
                >
                  <CIcon icon="cil-trash" /> Supprimer
                </CButton>
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>

      </CCardBody>
    </CCard>

    <!-- Modal Ajouter / Modifier -->
    <CModal :visible="showModal" @close="closeModal" size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>
          {{ isEditing ? 'Modifier l\'étudiant' : 'Ajouter un étudiant' }}
        </CModalTitle>
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
            <CFormLabel>{{ isEditing ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe' }}</CFormLabel>
            <CFormInput type="password" v-model="form.password" placeholder="••••••••" />
          </CCol>
          <CCol :md="6">
            <CFormLabel>Date de naissance</CFormLabel>
            <CFormInput type="date" v-model="form.birthdate" />
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
            <CFormLabel>Niveau</CFormLabel>
            <CFormSelect v-model="form.level_id">
              <option value="">Sélectionner un niveau</option>
              <option v-for="level in levels" :key="level.id" :value="level.id">
                {{ level.name }} — {{ level.field?.name || '' }}
              </option>
            </CFormSelect>
          </CCol>
          <CCol :md="12">
            <CFormLabel>Adresse</CFormLabel>
            <CFormInput v-model="form.address" placeholder="Adresse complète" />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeModal" :disabled="saving">
          Annuler
        </CButton>
        <CButton color="primary" @click="saveStudent" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-2" />
          {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
        </CButton>
      </CModalFooter>
    </CModal>

  </div>
</template>