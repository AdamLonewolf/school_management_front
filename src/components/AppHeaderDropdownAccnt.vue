<script setup>
import avatar from '@/assets/images/avatars/8.jpg'
import { useAuth } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const authStore = useAuth()
const router = useRouter()
const role = authStore.userRole
const fullName = authStore.fullName
const userId = authStore.user.id

async function handleLogout() {
  try {
    await api.post('accounts/auth/logout/', {
      refresh: authStore.user.refresh
    })
  } catch (err) {
    console.error('Erreur logout:', err)
  } finally {
    authStore.logout()
    router.push('/auth/login')
  }
}

async function goToProfile() {
  try {
    const response = await api.get('accounts/students/')
    console.log(response.data)
    if (response.data && response.data.length > 0) {
      const student = response.data[0]
      console.log('Student ID:', student.id)
      router.push({ name: 'StudentDetail', params: { id: student.id } })
    } else {
      alert('Profil introuvable.')
    }
  } catch (err) {
    console.error('Erreur:', err)
  }
}

</script>

<template>
  <CDropdown placement="bottom-end" variant="nav-item">
    <CDropdownToggle class="py-0 pe-0 d-flex align-items-center gap-2" :caret="false">
      <span class="text-body fw-semibold">{{ fullName }}</span>
      <CAvatar :src="avatar" size="md" />
    </CDropdownToggle>
    <CDropdownMenu class="pt-0">
      <CDropdownHeader
        component="h6"
        class="bg-body-secondary text-body-secondary fw-semibold mb-2 rounded-top"
      >
        Mon compte
      </CDropdownHeader>

      <!-- Profil visible seulement pour l'étudiant -->
      <CDropdownItem
        v-if="role === 'student'"
        @click="goToProfile"
        style="cursor: pointer"
      >
        <CIcon icon="cil-user" class="me-2" /> Mon profil
      </CDropdownItem>

      <CDropdownDivider v-if="role === 'student'" />

      <CDropdownItem @click="handleLogout" style="cursor: pointer" class="logout-item">
        <CIcon icon="cil-lock-locked" class="me-2" /> Logout
      </CDropdownItem>
    </CDropdownMenu>
  </CDropdown>
</template>