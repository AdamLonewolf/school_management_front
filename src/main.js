

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// CoreUI Vue components and icons
import CoreuiVue from '@coreui/vue'
import CIcon from '@coreui/icons-vue'
import { iconsSet as icons } from '@/assets/icons'

// Documentation components (remove in production if not needed)
import DocsComponents from '@/components/DocsComponents'
import DocsExample from '@/components/DocsExample'
import DocsIcons from '@/components/DocsIcons'

// Create Vue application instance
const app = createApp(App)
const pinia = createPinia()

// Install plugins
app.use(pinia)// State management
app.use(router) // Router for SPA navigation
app.use(CoreuiVue) // CoreUI component library
pinia.use(piniaPluginPersistedstate)

// Provide icons globally
app.provide('icons', icons)

// Register global components
app.component('CIcon', CIcon)
app.component('DocsComponents', DocsComponents)
app.component('DocsExample', DocsExample)
app.component('DocsIcons', DocsIcons)

// Mount application to DOM
app.mount('#app')
