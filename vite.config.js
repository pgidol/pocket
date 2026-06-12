import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from '@vant/auto-import-resolver';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import pxToViewport from 'postcss-px-to-viewport-8-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Vite 配置
 * standard.md §2/§3: Unplugin 自动引入 + PostCSS px-to-viewport 排除规则
 */
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: false,
      },
    }),
    Components({
      resolvers: [VantResolver(), ElementPlusResolver()],
      dirs: ['src/components'],
      dts: 'src/components.d.ts',
    }),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;\n`,
        api: 'modern-compiler',
      },
    },
    postcss: {
      plugins: [
        pxToViewport({
          viewportWidth: 375,
          unitPrecision: 5,
          viewportUnit: 'vw',
          selectorBlackList: ['.ignore-vw'],
          minPixelValue: 1,
          mediaQuery: false,
          // standard.md §3: 排除 element-plus 和 PC 目录
          exclude: [/node_modules\/element-plus/, /src\/views\/pc/, /src\/components\/pc/],
        }),
      ],
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
});
