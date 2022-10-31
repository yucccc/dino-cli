import { defineConfig } from 'vite'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { props2table } from './plugins/props2md'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    open: true,
  },
  plugins: [
    props2table(),
    // 添加JSX插件
    vueJsx(),
  ],
})
