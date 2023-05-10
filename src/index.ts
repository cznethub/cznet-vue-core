import Vue from "vue";
import Vuetify from "vuetify/lib";
import { default as Notifications } from "./models/notifications";

import CzNotifications from "./components/base/cz.notifications.vue";
import SubmissionForm from "./components/new-submission/submission-form.vue";

Vue.use(Vuetify);

const components = {
  CzNotifications,
  SubmissionForm,
};

Object.keys(components).forEach((name) => {
  Vue.component(name, components[name]);
});

export { CzNotifications, Notifications, SubmissionForm };
