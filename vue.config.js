process.env.VUE_APP_VERSION = process.env.npm_package_version;

const configureWebpack = (config) => {
  if (process.env.NODE_ENV !== "development") {
    // prevent class name mangling
    config.optimization.minimizer[0].options.terserOptions.keep_classnames = true;
    // config.plugins.push(new ImageminPlugin())
  }

  // config.externals = {
  //   vuetify: 'Vuetify'
  // }
};

const chainWebpack = (config) => {
  config.plugins.delete("fork-ts-checker");

  config.module
    .rule("vuetify")
    .test("/.s(c|a)ss$/")
    .use(["vue-style-loader", "css-loader"])
    .loader("sass-loader")
    .options({
      implementation: require("sass"),
      indentedSyntax: true, // optional
    })
    .options({
      implementation: require("sass"),
      sassOptions: {
        indentedSyntax: true, // optional
      },
    });

  return config;
};

module.exports = {
  // css: {extract: false},
  chainWebpack,
  configureWebpack,
  devServer: {
    disableHostCheck: true,
  },
  transpileDependencies: ["vuetify", "@jsonforms/core", "@jsonforms/vue2"],
  publicPath: "/",
};
