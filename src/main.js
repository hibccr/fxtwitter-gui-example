import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import 'element-plus/dist/index.css'
import {createWebHashHistory, createRouter} from 'vue-router'
import Main from './components/Main.vue'
import Bulk from './components/Bulk.vue'
import AppendOrigParam from './components/AppendOrigParam.vue'
import FxJsonParser from './components/FxJsonParser.vue'

//createApp(App).mount('#app')

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)

// define route
const routes = [
    {path: '/', component: Main},
    {path: '/bulk', component: Bulk},
    {path: '/append-orig-param', component: AppendOrigParam},
    {path: '/fxjson-parser', component: FxJsonParser}
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

app.use(pinia)
app.use(router)
app.mount('#app')
