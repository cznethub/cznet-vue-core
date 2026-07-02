import Notifications from './models/notifications';
import CzNotifications from './components/cz.notifications.vue';
import CzDragSelect from './components/cz.drag-select.vue';
import CzForm from './components/cz.form.vue';
import CzFormComposed from './components/cz.form-composed.vue';
import CzField from './components/cz.field.vue';
import CzFieldTeleport from './components/cz.field-teleport.vue';
import CzFieldModal from './components/cz.field-modal.vue';
import CzFileExplorer from './components/cz.file-explorer.vue';
import CzFilePreview from './components/cz.file-preview.vue';

const components: Record<string, any> = {
  CzNotifications,
  CzDragSelect,
  CzForm,
  CzFormComposed,
  CzField,
  CzFieldTeleport,
  CzFieldModal,
  CzFileExplorer,
  CzFilePreview,
};

const CzNet = {
  install: (app: any) => {
    Object.keys(components).forEach(name => {
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
  CzFormComposed,
  CzField,
  CzFieldTeleport,
  CzFieldModal,
  CzFileExplorer,
  CzFilePreview,
};
export type { PreviewRenderer } from './components/cz.file-preview.vue';
