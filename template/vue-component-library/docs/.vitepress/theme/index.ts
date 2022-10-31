import DefaultTheme from 'vitepress/theme'
import UI from '../../../src/entry'
export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.use(UI)
  },
}