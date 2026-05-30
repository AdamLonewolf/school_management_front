<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()

const student = ref(null)
const marks = ref([])
const absences = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  await fetchStudent()
})

async function fetchStudent() {
  loading.value = true
  error.value = ''
  try {
    const [studentRes, marksRes, absencesRes] = await Promise.all([
      api.get(`accounts/students/${route.params.id}/`),
      api.get('academics/marks/'),
      api.get('academics/absences/'),
    ])
    student.value = studentRes.data
    // Filtre les notes et absences de cet étudiant
    marks.value = marksRes.data.filter(m => m.enrollment.student.includes(
      studentRes.data.user.first_name
    ))
    absences.value = absencesRes.data.filter(a => a.student_id === studentRes.data.id)
  } catch { error.value = 'Impossible de charger le profil.' }
  finally { loading.value = false }
}

const markColor = (m) => {
  if (m >= 16) return 'success'
  if (m >= 12) return 'primary'
  if (m >= 10) return 'warning'
  return 'danger'
}

const average = () => {
  if (!marks.value.length) return '—'
  const avg = marks.value.reduce((sum, m) => sum + parseFloat(m.mark), 0) / marks.value.length
  return avg.toFixed(2)
}
</script>

<template>
  <div>
    <!-- Bouton retour -->
    <CButton color="secondary" variant="outline" class="mb-4" @click="router.back()">
      <CIcon icon="cil-arrow-left" class="me-2" /> Retour
    </CButton>

    <CAlert v-if="error" color="danger">{{ error }}</CAlert>

    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <p class="mt-2 text-body-secondary">Chargement du profil...</p>
    </div>

    <div v-else-if="student">
      <!-- Carte profil -->
      <CCard class="mb-4">
        <CCardBody>
          <CRow class="align-items-center">
            <CCol xs="auto">
              <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-3"
                style="width: 80px; height: 80px;">
                {{ student.user.first_name[0] }}{{ student.user.last_name[0] }}
              </div>
            </CCol>
            <CCol>
              <h4 class="fw-bold mb-1">{{ student.user.first_name }} {{ student.user.last_name }}</h4>
              <p class="text-body-secondary mb-1">{{ student.user.email }}</p>
              <CBadge color="info" class="me-2">{{ student.student_number || 'N° non défini' }}</CBadge>
              <CBadge color="primary">{{ student.level?.name || 'Niveau non défini' }}</CBadge>
            </CCol>
            <CCol xs="auto" class="text-end">
              <div class="fs-1 fw-bold text-primary">{{ average() }}</div>
              <small class="text-body-secondary">Moyenne générale</small>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <!-- Infos détaillées -->
      <CRow class="mb-4">
        <CCol :md="6">
          <CCard class="h-100">
            <CCardHeader><strong>Informations personnelles</strong></CCardHeader>
            <CCardBody>
              <table class="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td class="text-body-secondary">Genre</td>
                    <td>{{ student.gender === 'M' ? 'Masculin' : student.gender === 'F' ? 'Féminin' : '—' }}</td>
                  </tr>
                  <tr>
                    <td class="text-body-secondary">Date de naissance</td>
                    <td>{{ student.birthdate ? new Date(student.birthdate).toLocaleDateString('fr-FR') : '—' }}</td>
                  </tr>
                  <tr>
                    <td class="text-body-secondary">Téléphone</td>
                    <td>{{ student.phone_number || '—' }}</td>
                  </tr>
                  <tr>
                    <td class="text-body-secondary">Adresse</td>
                    <td>{{ student.address || '—' }}</td>
                  </tr>
                  <tr>
                    <td class="text-body-secondary">Filière</td>
                    <td>{{ student.level?.field || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol :md="6">
          <CCard class="h-100">
            <CCardHeader><strong>Statistiques</strong></CCardHeader>
            <CCardBody>
              <CRow class="text-center">
                <CCol>
                  <div class="fs-3 fw-bold text-primary">{{ marks.length }}</div>
                  <small class="text-body-secondary">Notes</small>
                </CCol>
                <CCol>
                  <div class="fs-3 fw-bold text-danger">{{ absences.filter(a => !a.justified).length }}</div>
                  <small class="text-body-secondary">Absences non justifiées</small>
                </CCol>
                <CCol>
                  <div class="fs-3 fw-bold text-warning">{{ absences.filter(a => a.justified).length }}</div>
                  <small class="text-body-secondary">Absences justifiées</small>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <!-- Notes -->
      <CCard class="mb-4">
        <CCardHeader><strong>📝 Notes</strong></CCardHeader>
        <CCardBody class="p-0">
          <div v-if="marks.length === 0" class="text-center py-4 text-body-secondary">
            Aucune note disponible.
          </div>
          <CTable v-else hover responsive class="mb-0">
            <CTableHead class="bg-body-secondary">
              <CTableRow>
                <CTableHeaderCell>Cours</CTableHeaderCell>
                <CTableHeaderCell>Note</CTableHeaderCell>
                <CTableHeaderCell>Appréciation</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="mark in marks" :key="mark.id">
                <CTableDataCell>{{ mark.enrollment.course }}</CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="markColor(mark.mark)">{{ mark.mark }}/20</CBadge>
                </CTableDataCell>
                <CTableDataCell>{{ mark.remark || '—' }}</CTableDataCell>
                <CTableDataCell>{{ mark.graded_at ? new Date(mark.graded_at).toLocaleDateString('fr-FR') : '—' }}</CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <!-- Absences -->
      <CCard>
        <CCardHeader><strong>📋 Absences</strong></CCardHeader>
        <CCardBody class="p-0">
          <div v-if="absences.length === 0" class="text-center py-4 text-body-secondary">
            Aucune absence enregistrée.
          </div>
          <CTable v-else hover responsive class="mb-0">
            <CTableHead class="bg-body-secondary">
              <CTableRow>
                <CTableHeaderCell>Cours</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell>Statut</CTableHeaderCell>
                <CTableHeaderCell>Motif</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="absence in absences" :key="absence.id">
                <CTableDataCell>{{ absence.course.name }}</CTableDataCell>
                <CTableDataCell>{{ new Date(absence.date).toLocaleDateString('fr-FR') }}</CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="absence.justified ? 'success' : 'danger'">
                    {{ absence.justified ? 'Justifiée' : 'Non justifiée' }}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>{{ absence.reason || '—' }}</CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </div>
  </div>
</template>