<template>
  <v-app class="bg-grey-lighten-4">
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
              <v-expansion-panel-title class="bg-grey-lighten-4">
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
            :supportedFileTypes="supportedFileTypes"
            :fileNameRegex="fileNameRegex"
            :folderNameRegex="folderNameRegex"
            v-model:valid-items="validItems"
            :hasFileMetadata="() => true"
            @showMetadata="onShowMetadata($event)"
            :renameFileOrFolder="renameFileOrFolderMock"
            :deleteFileOrFolder="deleteFileOrFolderMock"
          >
            <template #prepend>
              <v-alert
                class="text-subtitle-1 mb-4"
                border="start"
                colored-border
              >
                You can prepend content to this area.
              </v-alert>
            </template>
          </cz-file-explorer>
        </v-card-text>
      </v-card>

      <v-card class="my-5">
        <v-card-title
          class="d-flex justify-space-between align-center flex-column flex-md-row"
        >
          <span>CzForm</span>

          <v-select
            v-if="selectedSchema >= 0"
            class="my-2"
            label="Schema"
            :items="schemaCollection"
            v-model="selectedSchema"
            @update:model-value="data = defaults"
            item-value="index"
            item-title="name"
            max-width="200px"
            variant="outlined"
            hide-details
            density="compact"
          ></v-select>
        </v-card-title>
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
          <v-expansion-panels :model-value="0">
            <v-expansion-panel>
              <v-expansion-panel-title class="bg-grey-lighten-4">
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
            v-model="data"
            :errors.sync="errors"
            @update:errors="onUpdateErrors"
            :isValid.sync="isValid"
            :config="config"
            ref="form"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-menu open-on-hover bottom left offset-y transition="fade">
            <template #activator="{ props }">
              <div
                v-bind="props"
                class="d-flex form-controls flex-column flex-sm-row"
              >
                <v-badge
                  :model-value="!isValid"
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
import { Component, Vue, toNative, Ref } from 'vue-facing-decorator';
import CzNotifications from './components/cz.notifications.vue';
import Notifications from './models/notifications';
import { Config, IFolder, IFile } from '@/types';
import { stringify } from '@/utils';
import CzFileExplorer from './components/cz.file-explorer.vue';
import CzForm from './components/cz.form.vue';

const schemaPaths = [
  { name: 'HydroShare', path: './schemas/hydroshare' },
  { name: 'EarthChem', path: './schemas/earthchem' },
  { name: 'Zenodo', path: './schemas/zenodo' },
  { name: 'External', path: './schemas/external' },
];

@Component({
  components: { CzNotifications, CzFileExplorer, CzForm },
  name: 'App',
})
class App extends Vue {
  @Ref('form') form!: InstanceType<typeof CzForm>;

  isValid = false;
  errors: { title: string; message: string }[] = [];
  data = {};
  stringify = stringify;
  selectedMetadata: any = false;
  validItems = [];
  schemaCollection: any = [];
  selectedSchema: number = -1;
  supportedFileTypes = [
    '.csv',
    '.doc',
    '.kml',
    '.pdf',
    '.asc',
    '.txt',
    '.bin',
    '.xls',
    '.xlsx',
    '.bmp',
    '.xlsm',
    '.xml',
    '.jpg',
    '.zip',
    '.jgw',
    '.f',
    '.gif',
    '.h5',
    '.tar.gz',
    '.docx',
    '.html',
    '.ipynb',
    '.png',
    '.m',
    '.nc',
    '.ppt',
    '.ps',
    '.tiff',
    '.tsv',
    '.md',
    '.jpeg',
    '.js',
    '.json',
    '.HEIC',
    '.pptx',
    '.tif',
    '.geojson',
    '.rdf',
    '.hdf',
  ];
  fileNameRegex = /^[^\\/:*?"<>|]+$/;
  folderNameRegex = /^[^\\/:*?"<>|]+$/;

  /** Example folder/file tree structure */
  rootDirectory = {
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
                  },
                ],
              },
            ],
          },
          {
            name: 'readme.txt',
            file: { size: 12000 },
          },
          {
            name: 'presentation.ppt',
            file: { size: 1237468 },
          },
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
      },
      {
        name: 'landscape.png',
        file: { size: 2637468 },
      },
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

  async created() {
    for (let i = 0; i < schemaPaths.length; i++) {
      const path = schemaPaths[i].path;
      const name = schemaPaths[i].name;
      const { default: schema } = await import(
        /* @vite-ignore */ `${path}/schema.json`
      );
      const { default: uischema } = await import(
        /* @vite-ignore */
        `${path}/uischema.json`
      );
      const { default: defaults } = await import(
        /* @vite-ignore */
        `${path}/defaults.json`
      );

      this.schemaCollection.push({
        index: i,
        name,
        schema,
        uischema,
        defaults,
      });
    }
    this.selectedSchema = 0; // Initial repository schema to render
    this.data = { ...this.data, ...this.defaults };
  }

  get schema() {
    return this.schemaCollection[this.selectedSchema]?.schema;
  }

  get uischema() {
    return this.schemaCollection[this.selectedSchema]?.uischema;
  }

  get defaults() {
    return this.schemaCollection[this.selectedSchema]?.defaults;
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
    Notifications.toast({
      title: 'Important Note: drink water.',
      message: `Stay hydrated.`,
      type: 'info',
      location: 'top center',
      isInfinite: true,
      hasDoNotShowAgain: true,
      onDismissed: (doNotShowAgain: boolean) => {
        // Use in your app to not show the notification again
        console.log(doNotShowAgain);
      },
    });
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
        // _reject(_items.map(_i => false));
      }, 500);
    });
  }

  async deleteFileOrFolderMock(_item: IFile | IFolder) {
    return new Promise((_resolve, _reject) => {
      setTimeout(() => {
        _resolve(true);
        // _reject(false);
      }, 500);
    });
  }

  async renameFileOrFolderMock(_item: IFile | IFolder) {
    return new Promise((_resolve, _reject) => {
      setTimeout(() => {
        _resolve(true);
        // _reject(false);
      }, 500);
    });
  }
}

export default toNative(App);
</script>

<style lang="scss" scoped>
pre {
  white-space: pre-wrap;
}
</style>