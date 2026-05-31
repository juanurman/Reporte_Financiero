import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/Reporte_Financiero/', // Usamos el nombre exacto de tu repositorio
});