import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: './', // Permite que los archivos se carguen usando rutas relativas en GitHub Pages
});