import { createApp } from 'vue'
import UI from './entry'
import App from './App.vue'
const app = createApp(App)
app.use(UI)
app.mount('#app')
