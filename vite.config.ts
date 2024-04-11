import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import packageJson from './package.json';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'prod';
  const isDev = mode === 'dev';
  const isTest = mode === 'test';

  let build = {};
  if (isProd) {
    build = {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: '@cznethub/cznet-vue-core',
        fileName: 'index',
        formats: [
          'esm',
          // 'es',
          'cjs',
          // 'umd',
        ],
      },
      sourcemap: true,
      rollupOptions: {
        /**
         * DESC:
         * make sure to externalize deps that shouldn't be bundled
         * into your library
         */
        external: [
          ...Object.keys(packageJson.dependencies),
          ...Object.keys(packageJson.peerDependencies),
          'vue',
          'vuetify/components',
          '@mdi/font',
          'vue-facing-decorator',
          /^dayjs\/.*/,
        ],
        output: {
          /**
           * DESC:
           * Provide global variables to use in the UMD build
           * for externalized deps
           */
          globals: {
            vue: 'Vue',
            vuetify: 'Vuetify',
            'vuetify/components': 'Vuetify',
            'vue-facing-decorator': 'vueFacingDecorator',
          },
        },
      },
    };
  }

  let optimizeDeps = {};
  if (isDev) {
    /**
     * DESC:
     * dependency pre-bundling
     */
  }

  let test = {};
  if (isTest) {
    /**
     * DESC:
     * vitest config
     */
    test = {
      include: ['test/**/*.test.ts'],
      environment: 'happy-dom',
      deps: {
        inline: ['@vue'],
      },
      coverage: {
        reporter: ['text', 'text-summary', 'lcov'],
      },
    };
  }

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // ...
          },
          transformAssetUrls: {
            // ...
          },
        },
      }),
    ],
    optimizeDeps,
    build,
    test,

    /**
     * DESC:
     * defining aliases
     */
    resolve: {
      alias: [
        {
          find: '@',
          replacement: resolve(__dirname, './src'),
        },
      ],
    },
  };
});
