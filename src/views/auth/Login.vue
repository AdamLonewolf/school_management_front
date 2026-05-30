<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuth()

const email = ref('')       
const password = ref('')
const error = ref('')
const loading = ref(false) 

async function handleLogin(){

  error.value = ''
  loading.value = true
 
    try {
      //Request Api login
      const response = await api.post("accounts/auth/login/", {
        email : email.value,
        password: password.value
      })

      // response.data contient access, refresh, user

      authStore.login(response.data)

       router.push('/')

    } catch (err) {
      error.value = err.response?.data?.error || 'Identifiants incorrects'
    } finally {
      loading.value = false
    }
}

</script>


<template>
  <div class="wrapper min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol :md="8">
          <CCardGroup>
            <CCard class="p-4">
              <CCardBody>
                <CForm>
                  <h1>Login</h1>
                  <p class="text-body-secondary">Sign In to your account</p>
                  <CInputGroup class="mb-3">
                    <CInputGroupText>
                      <CIcon icon="cilEnvelopeOpen"/>
                    </CInputGroupText>
                    <CFormInput
                      type="email"
                      placeholder="Email"
                      autocomplete="email"
                      v-model="email"
                    />
                  </CInputGroup>
                  <CInputGroup class="mb-4">
                    <CInputGroupText>
                      <CIcon icon="cil-lock-locked" />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Password"
                      autocomplete="current-password"
                      v-model="password"
                    />
                  </CInputGroup>
                  <CAlert v-if="error" color="danger">{{ error }}</CAlert>
                  <CRow>
                    <CCol :xs="6">
                      <CButton
                        color="primary"
                        class="px-4"
                        @click="handleLogin"
                        :disabled="loading"
                      >
                        <CSpinner v-if="loading" size="sm" class="me-2"/>
                        {{ loading ? 'Connexion...' : 'Login' }}
                      </CButton>
                    </CCol>
                    <CCol :xs="6" class="text-right">
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
            <CCard class="text-white bg-primary py-5" style="width: 44%">
              <CCardBody class="text-center">
             
              </CCardBody>
            </CCard>
          </CCardGroup>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>
