import vue from "rollup-plugin-vue";
import babel from "@rollup/plugin-babel";
import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import cleanup from "rollup-plugin-cleanup";
import visualizer from "rollup-plugin-visualizer";
import styles from "rollup-plugin-styles";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

import packageJson from "./package.json";

const baseConfig = {
  input: "src/index.ts",
  external: [
    ...Object.keys(packageJson.dependencies),
    ...Object.keys(packageJson.peerDependencies),
    /^lodash\/.*/,
    "vuetify/lib",
    "@mdi/font",
    /^dayjs\/.*/,
  ],
};

const buildFormats = [
  {
    ...baseConfig,
    output: {
      file: packageJson.module,
      format: "esm",
      sourcemap: true,
      assetFileNames: "[name][extname]",
    },
    plugins: [
      resolve({
        extensions: [".js", ".jsx", ".ts", ".tsx", ".vue"],
      }),
      styles({
        mode: ["inject"],
      }),
      vue({
        css: false,
        template: {
          isProduction: true,
        },
        // rollup-plugin-vue can't handle Vue source maps in watch mode
        // https://github.com/vuejs/rollup-plugin-vue/issues/238
        needMap: !process.env.ROLLUP_WATCH,
      }),
      typescript({
        emitDeclarationOnly: true,
        tsconfig: "tsconfig.compile.json",
        noEmitOnError: true,
        abortOnError: false,
      }),
      babel({
        exclude: "node_modules/**",
        extensions: [".js", ".jsx", ".ts", ".tsx", ".vue"],
        babelHelpers: "bundled",
      }),
      cleanup({ extensions: ["js", "ts", "jsx", "tsx", "vue"] }),
      visualizer(),
      commonjs(),
      json(),
    ],
  },
  {
    ...baseConfig,
    output: {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
      assetFileNames: "[name][extname]",
    },
    plugins: [
      resolve({
        extensions: [".js", ".jsx", ".ts", ".tsx", ".vue"],
      }),
      styles({
        mode: ["inject"],
      }),
      vue({
        css: false,
        template: {
          isProduction: true,
        },
        // rollup-plugin-vue can't handle Vue source maps in watch mode
        // https://github.com/vuejs/rollup-plugin-vue/issues/238
        needMap: !process.env.ROLLUP_WATCH,
      }),
      typescript({
        emitDeclarationOnly: true,
        tsconfigOverride: {
          target: "ES5",
        },
        tsconfig: "tsconfig.compile.json",
        noEmitOnError: true,
        abortOnError: false,
      }),
      babel({
        exclude: "node_modules/**",
        extensions: [".js", ".jsx", ".ts", ".tsx", ".vue"],
        babelHelpers: "bundled",
      }),
      cleanup({ extensions: ["js", "ts", "jsx", "tsx", "vue"] }),
      commonjs(),
      json(),
    ],
  },
];

export default buildFormats;
