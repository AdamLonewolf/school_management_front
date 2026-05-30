import { computed, ref } from 'vue'
import { defineStore } from 'pinia'


export const useAuth = defineStore('auth', () =>{


    const user = ref({
        token: null,
        refresh: null,
        role: null,
        first_name: null,
        last_name: null,
        id: null,
        email: null,
    })
    

    const isAuthenticated = computed(() => !!user.value.token)
    const userRole = computed(() => user.value.role)
    const fullName = computed(() => `${user.value.first_name} ${user.value.last_name}`)

      function login(data) {
    // data = response.data que Django renvoie
        user.value.token      = data.access
        user.value.refresh    = data.refresh
        user.value.role       = data.user.role
        user.value.first_name = data.user.first_name
        user.value.last_name  = data.user.last_name
        user.value.id         = data.user.id
        user.value.email      = data.user.email
    }

     function logout() {
        user.value.token      = null
        user.value.refresh    = null
        user.value.role       = null
        user.value.first_name = null
        user.value.last_name  = null
        user.value.id         = null
        user.value.email      = null
    }



     return { user, isAuthenticated, userRole, fullName, login, logout }

}, {
    persist : true //pinia-plugin-persistedstate
})