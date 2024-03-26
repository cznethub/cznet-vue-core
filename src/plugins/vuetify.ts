import '@mdi/font/css/materialdesignicons.css';
import '@fortawesome/fontawesome-free/css/all.css';

// Vuetify
import 'vuetify/styles';
import { ThemeDefinition, createVuetify } from 'vuetify';
import { aliases as fa_aliases, fa } from 'vuetify/iconsets/fa';
import { aliases as md_aliases, mdi } from 'vuetify/iconsets/mdi';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    // primary: colors.blue.darken2,
    // secondary: colors.blueGrey,
    // accent: colors.blue,
    // error: colors.red.accent3,
    // success: colors.teal.accent4,
    // info: colors.blueGrey,
    // navbar: colors.blueGrey.lighten4,
  },
};

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // primary: colors.blueGrey,
    // secondary: colors.teal.darken1,
    // accent: colors.amber,
    // error: colors.red.accent3,
    // success: colors.teal.accent4,
    // info: colors.blueGrey,
  },
};

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'lightTheme',
    themes: {
      lightTheme,
      darkTheme,
    },
    variations: {
      colors: ['primary', 'secondary'],
      lighten: 4,
      darken: 4,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...fa_aliases,
      ...md_aliases,
    },
    sets: {
      mdi,
      fa,
    },
  },
});

export default vuetify;
