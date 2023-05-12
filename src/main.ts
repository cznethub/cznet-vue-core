import "./assets/css/global.scss";

import Vuex from "vuex";
import VuexORM from "@vuex-orm/core";
import Vue from "vue";
import App from "./App.vue";
import vuetify from "@/plugins/vuetify";
import { orm } from "@/models/orm";

Vue.config.productionTip = false;
Vue.use(Vuex);

// Create Vuex Store and register database through Vuex ORM.
const store = new Vuex.Store({
  plugins: [VuexORM.install(orm)],
});

new Vue({
  store,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
