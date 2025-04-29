# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Getting started
In your theme file, import the cznet-vue-core styles.

`theme.scss`
```
@use '@cznethub/cznet-vue-core/styles';
```


`your-component.vue`
```
...
<cz-form
   :schema="schema"
   :uischema="uischema"
   v-model="data"
   :errors.sync="errors"
   @update:errors="onUpdateErrors"
   :isValid.sync="isValid"
   :config="config"
   ref="form"
 />
...
import type { IFile, IFolder } from '@cznethub/cznet-vue-core/dist/types'   // For type annotation
import { CzFileExplorer, CzForm, Notifications } from '@cznethub/cznet-vue-core'

data = {};
errors: { title: string; message: string }[] = [];
isValid = false;
config = {
    restrict: true,
    trim: false,
    showUnfocusedDescription: false,
    hideRequiredAsterisk: false,
    collapseNewItems: false,
    breakHorizontal: false,
    initCollapsed: false,
    hideAvatar: false,
    hideArraySummaryValidation: false,
    vuetify: {
      commonAttrs: {
        density: 'compact',
        variant: 'outlined',
        'persistent-hint': true,
        'hide-details': false,
      },
    },
    isViewMode: false,
    isReadOnly: false,
    isDisabled: false,
  };

  onUpdateErrors(errors: { title: string; message: string }[]) {
    this.errors = errors;
  }
```

`App.vue`
```
...
<cz-notifications />
...

import { CzNotifications, Notifications } from '@cznethub/cznet-vue-core'

openDialog() {
 Notifications.openDialog({
   title: `Dialog Title`,
   content: 'Some message for the dialog',
   onConfirm: () => {},
 });
}

toast() {
 Notifications.toast({ message: 'Some toasty message', type: 'success' });
}
```

