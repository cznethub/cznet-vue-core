import Vue from "vue";
import Vuetify from "vuetify/lib";
import CzNotifications from "./components/base/cz.notifications.vue";
import SubmissionForm from "./components/new-submission/submission-form.vue";
import { default as Notifications } from "./models/notifications";

Vue.use(Vuetify);

const components = {
  CzNotifications,
};

Object.keys(components).forEach((name) => {
  Vue.component(name, components[name]);
});

export { CzNotifications, Notifications, SubmissionForm };
