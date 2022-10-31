import type { App } from 'vue'
import ButtonTSX from './components/ButtonTSX'
import ButtonSFC from './components/ButtonSFC.vue'

export {
  ButtonTSX,
  ButtonSFC,
}

export default {
  install(app: App): void {
    app.component(ButtonSFC.name, ButtonSFC)
    app.component(ButtonTSX.name, ButtonTSX)
  },
}