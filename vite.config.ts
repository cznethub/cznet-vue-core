const { createVuePlugin } = require("vite-plugin-vue2");
const path = require("path");

// https://vitejs.dev/config/
module.exports = {
  plugins: [createVuePlugin()], // Enabled by default],
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
