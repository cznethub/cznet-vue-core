import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import packageJson from './package.json';
import { visualizer } from 'rollup-plugin-visualizer';

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
          /^vuetify\/.*/,
          'lodash-es',
        ],
        output: {
          /**
           * Global names for externals in the UMD build. Real names for the
           * common browser globals; the rest derive a name from the module id
           * (matching Rollup's own fallback) so every external is covered and
           * no "missing global name" warnings are emitted.
           */
          globals: (id: string) => {
            const known: Record<string, string> = {
              vue: 'Vue',
              vuetify: 'Vuetify',
            };
            return known[id] ?? id.replace(/[^a-zA-Z0-9_$]/g, '_');
          },
        },
      },
    };
  }

  let optimizeDeps = {
    include: ['@jsonforms/core', '@jsonforms/vue', 'ajv'],
  };
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
      visualizer(),
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
