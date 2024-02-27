const { createVuePlugin } = require("vite-plugin-vue2");
const path = require("path");
import dts from "vite-plugin-dts";
import { resolve } from "path";

// https://vitejs.dev/config/
module.exports = {
  plugins: [createVuePlugin(), dts({ include: ["lib"] })],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@cznethub/cznet-vue-core",
      fileName: (format) => `cznet-vue-core.${format}.js`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        "vue",
        "vuetify",
        "vuetify/lib",
        "vue-class-component",
        "vue-property-decorator",
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: "Vue",
          vuetify: "Vuetify",
          "vuetify/lib": "Vuetify",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.s(c|a)ss$/,
        use: [
          "vue-style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            // Requires sass-loader@^7.0.0
            options: {
              implementation: require("sass"),
              indentedSyntax: true, // optional
            },
          },
        ],
      },
    ],
  },
};
