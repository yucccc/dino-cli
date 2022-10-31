import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vueJsx(),
    vue(),
  ],

  server: {
    open: true,
    host: true,
  },
  build: {
    rollupOptions: {
      external: ['vue', 'vue-router'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    lib: {
      entry: './src/entry.ts',
      name: 'VueUI',
      fileName: 'vue-ui',
      // 导出模块格式
      formats: ['umd', 'es'],
    },
  },
})
