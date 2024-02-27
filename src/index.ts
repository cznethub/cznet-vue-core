import Vue from "vue";
import Vuetify from "vuetify/lib";
import { default as Notifications } from "./models/notifications";

import CzNotifications from "./components/base/cz.notifications.vue";
import CzForm from "./components/cz.form.vue";
import CzFileExplorer from "./components/cz.file-explorer.vue";

Vue.use(Vuetify);

const components = {
  CzNotifications,
  CzForm,
  CzFileExplorer,
};

Object.keys(components).forEach((name) => {
  Vue.component(name, components[name]);
});

export { CzNotifications, Notifications, CzForm, CzFileExplorer };
