import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import 'element-plus/dist/index.css'
import {createWebHashHistory, createRouter} from 'vue-router'
import Main from './components/Main.vue'
import Bulk from './components/Bulk.vue'

//createApp(App).mount('#app')

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)

// define route
const routes = [
    {path: '/', component: Main},
    {path: '/bulk', component: Bulk}
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

app.use(pinia)
app.use(router)
app.mount('#app')
