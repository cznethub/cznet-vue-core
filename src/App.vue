<template>
  <v-app>
    <v-container>
      <div class="text-h5 text-center">CZNet Vue 3 core components</div>

      <v-card class="my-5">
        <v-card-title>Notifications</v-card-title>
        <v-divider />
        <v-card-text>
          <v-btn class="mr-2" color="primary" @click="toast">Toast</v-btn>
          <v-btn color="primary" @click="openDialog">Open Dialog</v-btn>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-title>CzFileExplorer</v-card-title>
        <v-divider />
        <v-card-text class="d-flex">
          <v-checkbox
            label="isReadOnly"
            v-model="fileExplorerConfig.isReadOnly"
            class="mr-4"
            hide-details
          />
          <v-checkbox
            v-if="!fileExplorerConfig.isReadOnly"
            label="hasFolders"
            v-model="fileExplorerConfig.hasFolders"
            class="mr-4"
            hide-details
          />
        </v-card-text>
        <v-divider />
        <v-card-text>
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="text-overline">File Explorer Data</div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre>{{ JSON.parse(stringify(rootDirectory)) }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-divider />
        <v-card-text>
          <cz-file-explorer
            :rootDirectory="rootDirectory"
            :hasFolders="fileExplorerConfig.hasFolders"
            :isReadOnly="fileExplorerConfig.isReadOnly"
            :hasFileMetadata="() => true"
            @showMetadata="onShowMetadata($event)"
            :renameFileOrFolder="renameFileOrFolderMock"
            :deleteFileOrFolder="deleteFileOrFolderMock"
            :upload="uploadMock"
          >
            <template v-slot:prepend>
              <v-alert
                class="text-subtitle-1 mb-4"
                border="start"
                colored-border
                type="info"
                elevation="1"
              >
                You can prepend content to this area
              </v-alert>
            </template>
          </cz-file-explorer>
        </v-card-text>
      </v-card>

      <v-card class="my-5">
        <v-card-title>CzForm</v-card-title>
        <v-divider />
        <v-card-text class="d-flex">
          <v-checkbox
            label="ReadOnly"
            v-model="config.isReadOnly"
            class="mr-4"
            hide-details
          />
          <v-checkbox
            label="View mode"
            v-model="config.isViewMode"
            class="mr-4"
            hide-details
          />
          <v-checkbox
            label="Disabled"
            v-model="config.isDisabled"
            class="mr-4"
            hide-details
          />
        </v-card-text>

        <v-divider />
        <v-card-text>
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="text-overline">Form Data</div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre>{{ data }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-divider />
        <v-card-text>
          <cz-form
            :schema="schema"
            :uischema="uischema"
            :errors.sync="errors"
            @update:errors="onUpdateErrors"
            :isValid.sync="isValid"
            v-model="data"
            :config="config"
            ref="form"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-menu open-on-hover bottom left offset-y transition="fade">
            <template v-slot:activator="{ props }">
              <div
                v-bind="props"
                class="d-flex form-controls flex-column flex-sm-row"
              >
                <v-badge
                  bordered
                  color="error"
                  icon="mdi-exclamation-thick"
                  overlap
                >
                  <v-btn
                    color="primary"
                    depressed
                    @click="submit"
                    :disabled="
                      config.isReadOnly || config.isViewMode || !isValid
                    "
                  >
                    Submit
                  </v-btn>
                </v-badge>
              </div>
            </template>

            <v-card>
              <v-card-text>
                <ul class="text-subtitle-1 ml-4">
                  <li v-for="(error, index) of errors" :key="index">
                    <b>{{ error.title }}</b>
                    {{ error.message }}.
                  </li>
                </ul>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-card-actions>
      </v-card>
    </v-container>
    <cz-notifications />
  </v-app>
  <link
    href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900"
    rel="stylesheet"
  />
</template>

<script lang="ts">
import CzDragSelect from './components/cz.drag-select.vue';
import { Component, Vue, toNative, Ref } from 'vue-facing-decorator';
import czNotifications from './components/cz.notifications.vue';
import Notifications from './models/notifications';
import { Config, IFolder, IFile } from '@/types';
import { stringify } from '@/utils';
import CzFileExplorer from './components/cz.file-explorer.vue';

import schema from './schemas/schema.json';
import uischema from './schemas/uischema.json';
import initialData from './schemas/test-dataset.json';
import czForm from './components/cz.form.vue';

// const initialData = {};

@Component({
  components: { CzDragSelect, czNotifications, CzFileExplorer, czForm },
  name: 'App',
})
class App extends Vue {
  @Ref('form') form!: InstanceType<typeof czForm>;

  schema: { [key: string]: any } = schema;
  uischema: { [key: string]: any } = uischema;
  isValid = false;
  errors: { title: string; message: string }[] = [];
  data = initialData;
  stringify = stringify;
  selectedMetadata: any = false;

  /** Example folder/file tree structure */
  rootDirectory: IFolder = {
    name: 'root',
    /** Folders have a `children` property */
    children: [
      {
        name: 'Some Folder',
        children: [
          {
            name: 'Nested folder',
            children: [
              {
                name: 'Deeply nested folder',
                children: [
                  {
                    name: 'deeply nested file.txt',
                    file: { size: 2637468 },
                  } as IFile,
                ],
              },
            ],
          },
          {
            name: 'readme.txt',
            file: { size: 12000 },
          } as IFile,
          {
            name: 'presentation.ppt',
            file: { size: 1237468 },
          } as IFile,
        ],
      },
      {
        name: 'An empty folder',
        children: [],
      },
      {
        name: 'logs.txt',
        isUploaded: true, // IMPORTANT: indicates that asynchronous operations will run on this file
        file: { size: 8421 },
      } as IFile,
      {
        name: 'landscape.png',
        file: { size: 2637468 },
      } as IFile,
    ],
  };

  config: Config = {
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

  fileExplorerConfig = {
    isReadOnly: false,
    hasFolders: true,
  };

  async beforeCreate() {
    this.schema = schema;
    this.uischema = uischema;
  }

  openDialog() {
    Notifications.openDialog({
      title: `Dialog Title`,
      content: 'Some message for the dialog',
      onConfirm: () => {},
    });
  }

  onShowMetadata(item: any) {
    this.selectedMetadata = item;
  }

  toast() {
    Notifications.toast({ message: 'Some toasty message', type: 'success' });
  }

  submit() {
    console.log(this.data);
  }

  onUpdateErrors(errors: { title: string; message: string }[]) {
    this.errors = errors;
  }

  // =======================
  // MOCK FUNCTIONS
  // =======================

  async uploadMock(_items: (IFile | IFolder)[]) {
    return new Promise((_resolve, _reject) => {
      setTimeout(() => {
        _resolve(_items.map(_i => true));
        // _reject(_items.map((_i) => false));
      }, 2000);
    });
  }

  async deleteFileOrFolderMock(_item: IFile | IFolder) {
    return new Promise((_resolve, _reject) => {
      setTimeout(() => {
        _resolve(true);
        // _reject(false);
      }, 2000);
    });
  }

  async renameFileOrFolderMock(_item: IFile | IFolder) {
    return new Promise((_resolve, _reject) => {
      setTimeout(() => {
        _resolve(true);
        // _reject(false);
      }, 2000);
    });
  }
}

export default toNative(App);
</script>
