import Notifications from './models/notifications';
import CzNotifications from './components/cz.notifications.vue';
import CzDragSelect from './components/cz.drag-select.vue';
import CzForm from './components/cz.form.vue';
import CzFileExplorer from './components/cz.file-explorer.vue';

const components: Record<string, any> = {
  CzNotifications,
  CzDragSelect,
  CzForm,
  CzFileExplorer,
};

const CzNet = {
  install: (app: any) => {
    Object.keys(components).forEach(name => {
      // app.component(name, components[name]);
      app.use(components[name]);
    });
  },
};

export {
  CzNet,
  Notifications,
  CzNotifications,
  CzDragSelect,
  CzForm,
  CzFileExplorer,
};
