import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
// @ts-ignore
import { Upload } from 'buefy';

const app = createApp(App);

app.use(Upload);
app.use(vuetify);
app.mount('#app');
