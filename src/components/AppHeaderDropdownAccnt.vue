<script setup>
import avatar from '@/assets/images/avatars/8.jpg'
import { useAuth } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const authStore = useAuth()
const router = useRouter()

const fullName = authStore.fullName

async function handleLogout() {
    try {
       const response = await api.post('accounts/auth/logout/', {
        refresh : authStore.user.refresh
       })
    } catch (err) {
      console.error('Erreur Logout: ', err)
    } finally {
        authStore.logout()
        router.push('/auth/login')
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
      <CDropdownItem>
        <CIcon icon="cil-user" /> Profil
      </CDropdownItem>
      <CDropdownDivider />
     <CDropdownItem @click="handleLogout" class="logout-item" style="cursor: pointer">
     <CIcon icon="cil-lock-locked" /> Logout
    </CDropdownItem>
    </CDropdownMenu>
  </CDropdown>
</template>