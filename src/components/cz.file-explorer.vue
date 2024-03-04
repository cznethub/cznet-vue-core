<template>
  <v-card class="mb-8">
    <v-sheet
      class="pa-4 d-flex align-center has-bg-light-gray primary lighten-4 files-container--included flex-wrap gap-1"
    >
      <v-tooltip v-if="hasFolders && !isReadOnly" bottom transition="fade">
        <template v-slot:activator="{ props }">
          <v-btn
            @click="newFolder"
            icon="mdi-folder"
            class="mr-4"
            small
            v-bind="props"
          ></v-btn>
        </template>
        New Folder
      </v-tooltip>

      <div v-else class="text-subtitle-1 mr-4">Files</div>

      <div v-if="!isReadOnly">
        <template>
          <v-tooltip bottom transition="fade">
            <template v-slot:activator="{ props }">
              <v-btn
                @click="selectAll"
                :disabled="!rootDirectory.children.length"
                class="mr-1"
                icon="mdi-select"
                small
                v-bind="props"
              ></v-btn>
            </template>
            <span>Select All</span>
          </v-tooltip>
        </template>

        <!-- <template>
          <v-tooltip bottom transition="fade">
            <template v-slot:activator="{ props }">
              <v-btn
                @click="unselectAll"
                icon
                small
                :disabled="!selected.length"
                v-bind="props"
                v-bind="attrs"
              >
                <v-icon>mdi-checkbox-blank-off-outline</v-icon>
              </v-btn>
            </template>
            <span>Unselect All</span>
          </v-tooltip>
          <v-divider class="mx-4" vertical></v-divider>
        </template> -->

        <template v-if="hasFolders">
          <v-tooltip bottom transition="fade">
            <template v-slot:activator="{ props }">
              <v-btn
                @click="cut"
                :disabled="!canCutSelected"
                class="mr-1"
                icon="mdi-content-cut"
                small
                v-bind="props"
              ></v-btn>
            </template>
            Cut
          </v-tooltip>

          <v-tooltip bottom transition="fade">
            <template v-slot:activator="{ props }">
              <v-btn
                @click="onPaste"
                :disabled="!canPaste"
                icon="mdi-content-paste"
                small
                v-bind="props"
              ></v-btn>
            </template>
            Paste
          </v-tooltip>
          <v-divider class="mx-4" vertical></v-divider>
        </template>

        <template v-if="!isReadOnly">
          <v-tooltip bottom transition="fade">
            <template v-slot:activator="{ props }">
              <v-btn
                @click="deleteSelected"
                icon="mdi-delete"
                small
                :disabled="isDeleting || !selected.length"
                v-bind="props"
              ></v-btn>
            </template>
            <span>Discard</span>
          </v-tooltip>
        </template>
      </div>

      <v-spacer></v-spacer>

      <v-text-field
        v-model="search"
        rounded
        label="Search by file or folder name..."
        dense
        solo
        flat
        hide-details
        clearable
        clear-icon="mdi-close-circle-outline"
        prepend-inner-icon="mdi-magnify"
      />

      <template v-if="rootDirectory.children.length && !isReadOnly">
        <v-spacer></v-spacer>
        <v-btn
          @click="discardAll"
          :disabled="!isSomeNotUploaded"
          small
          depressed
          class="default"
        >
          <v-icon class="mr-2" small color="error">
            mdi-cloud-cancel-outline
          </v-icon>
          Discard All
        </v-btn>
      </template>
    </v-sheet>

    <v-card-text style="min-height: 10rem">
      <slot name="prepend"></slot>

      <v-menu v-model="showMenu" v-bind="menuAttrs" absolute offset-y>
        <v-list
          v-if="showMenuItem"
          width="auto"
          class="files-container--included"
        >
          <template v-if="!isReadOnly">
            <!-- CREATE NEW FOLDER -->
            <v-list-item
              v-if="isFolder(showMenuItem) && hasFolders"
              @click.stop="newFolder"
            >
              <v-list-item-title>
                <v-icon color="primary" class="mr-2">mdi-folder-outline</v-icon>
                Create new folder
              </v-list-item-title>
            </v-list-item>

            <!-- RENAME -->
            <v-list-item
              v-if="canRenameItem(showMenuItem)"
              @click.stop="renameItem(showMenuItem)"
              :disabled="showMenuItem.isRenaming"
            >
              <v-list-item-title>
                <v-icon
                  class="mr-2"
                  :class="{ 'text--disabled': showMenuItem.isRenaming }"
                >
                  mdi-pencil-outline
                </v-icon>
                Rename
              </v-list-item-title>
            </v-list-item>

            <template v-if="hasFolders">
              <!-- CUT -->
              <v-list-item @click="cut" :disabled="!canCutItem(showMenuItem)">
                <v-list-item-title>
                  <v-icon
                    class="mr-2"
                    :class="{ 'text--disabled': !canCutItem(showMenuItem) }"
                  >
                    mdi-content-cut
                  </v-icon>
                  Cut
                </v-list-item-title>
              </v-list-item>

              <!-- PASTE -->
              <v-list-item
                v-if="isFolder(showMenuItem)"
                @click="onPaste"
                :disabled="!canPasteOnFolder(showMenuItem)"
              >
                <v-list-item-title>
                  <v-icon
                    class="mr-2"
                    :class="{
                      'text--disabled': !canPasteOnFolder(showMenuItem),
                    }"
                  >
                    mdi-content-paste
                  </v-icon>
                  Paste
                </v-list-item-title>
              </v-list-item>
            </template>

            <!-- DISCARD -->
            <v-list-item @click="deleteSelected" :disabled="isDeleting">
              <v-list-item-title v-if="showMenuItem.isUploaded">
                <v-icon
                  class="mr-2"
                  color="error lighten-2"
                  :class="{ 'text--disabled': isDeleting }"
                >
                  mdi-cloud-remove-outline
                </v-icon>
                Delete
              </v-list-item-title>
              <v-list-item-title v-else>
                <v-icon
                  class="mr-2"
                  color="error lighten-2"
                  :class="{ 'text--disabled': isDeleting }"
                >
                  mdi-delete-outline
                </v-icon>
                Discard
              </v-list-item-title>
            </v-list-item>
          </template>

          <!-- VIEW METADATA -->
          <template v-if="hasFileMetadata?.(showMenuItem)">
            <v-divider v-if="!isReadOnly"></v-divider>

            <v-list-item @click.stop="$emit('showMetadata', showMenuItem)">
              <v-list-item-title>
                <v-icon class="mr-2" color="orange">
                  mdi-text-box-search-outline
                </v-icon>
                View metadata
              </v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>

      <v-card
        flat
        outlined
        v-if="rootDirectory.children.length"
        class="mb-4 files-container-card"
        :class="isRootDragging && isDragMoving ? 'border-dash' : ''"
      >
        <v-card-text class="files-container">
          <drop
            @drop="onDropMove($event, rootDirectory)"
            @dragenter.exact="isRootDragging = true"
            @dragleave.exact="isRootDragging = false"
            class="full-height"
          >
            <cz-drag-select
              attribute="customAttribute"
              @change="onDragSelect"
              @endDrag="onDragEnd"
              @startDrag="onDragStart"
              class="root-drag-select"
            >
              <v-row class="flex-grow-1">
                <!-- TODO: find a way to have a context menu in the empty area -->
                <!-- @contextmenu="show($event, null)" -->

                <v-col
                  :cols="11"
                  v-click-outside="{ handler: onClickOutside, include }"
                >
                  <v-treeview
                    item-disabled="isDisabled"
                    :items="rootDirectory.children"
                    :open.sync="open"
                    :active.sync="selected"
                    :search="search"
                    :filter="filter"
                    return-object
                    multiple-active
                    transition
                    item-key="key"
                    dense
                    tag="span"
                    open-on-click
                    class="files-container--included"
                    ref="tree"
                  >
                    <template v-slot:prepend="{ item, open }">
                      <v-icon
                        v-if="isFolder(item)"
                        @click.exact="onItemClick($event, item)"
                        @click.ctrl.exact="onItemCtrlClick($event, item)"
                        @click.meta.exact="onItemCtrlClick($event, item)"
                        @click.shift.exact="onItemShiftClick($event, item)"
                        :disabled="item.isDisabled"
                        :color="item.isCutting ? 'grey' : folderColor"
                      >
                        {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
                      </v-icon>
                      <v-icon
                        v-else
                        @click.ctrl.exact="onItemCtrlClick($event, item)"
                        :disabled="item.isDisabled"
                        :color="item.isCutting ? 'grey' : ''"
                      >
                        {{
                          fileIcons[item.name.split('.').pop()] ||
                          fileIcons['default']
                        }}
                      </v-icon>
                    </template>
                    <template v-slot:label="{ item }">
                      <drop
                        :key="item.key"
                        @drop="onDropMove($event, item)"
                        :customAttribute="item.key"
                      >
                        <drag
                          :key="item.key"
                          :disabled="
                            !hasFolders || item.isRenaming || isReadOnly
                          "
                          :data="item"
                          @dragstart="
                            isDragMoving = true;
                            isRootDragging = false;
                          "
                          @dragend="isDragMoving = false"
                          drag-class="drag-ghost"
                          go-back
                        >
                          <v-text-field
                            v-if="item.isRenaming"
                            class="ml-3"
                            @update:model-value="onRenamed(item, $event)"
                            @keydown.enter="item.isRenaming = false"
                            @click.exact="onItemClick($event, item)"
                            @click.ctrl.exact="onItemCtrlClick($event, item)"
                            @click.meta.exact="onItemCtrlClick($event, item)"
                            @click.shift.exact="onItemShiftClick($event, item)"
                            @click:append="item.isRenaming = false"
                            :model-value="item.name"
                            v-click-outside="onClickOutside"
                            append-icon="mdi-cancel"
                            dense
                            outlined
                            hide-details="auto"
                            autofocus
                          ></v-text-field>

                          <v-row
                            v-else
                            @contextmenu.prevent="show($event, item)"
                            @click.exact="onItemClick($event, item)"
                            @click.ctrl.exact="onItemCtrlClick($event, item)"
                            @click.meta.exact="onItemCtrlClick($event, item)"
                            @click.shift.exact="onItemShiftClick($event, item)"
                            :class="{ 'text-medium-emphasis': item.isCutting }"
                            class="item-row flex-wrap flex-sm-nowrap ma-0 flex-sm-row flex-column"
                          >
                            <v-col
                              class="d-flex flex-column flex-sm-row align-start align-sm-center"
                            >
                              <div class="item-name flex-grow-1 flex-shrink-1">
                                <span :title="item.name">{{ item.name }}</span>
                              </div>
                              <div
                                v-if="item.file"
                                class="flex-grow-0 flex-shrink-0 mx-0 mx-sm-3 pa-0 text-caption text-medium-emphasis"
                              >
                                {{ prettyBytes(item.file.size) }}
                              </div>
                              <div
                                v-else-if="item.uploadedSize"
                                class="flex-grow-0 flex-shrink-0 mx-0 mx-sm-3 pa-0 text-caption text-medium-emphasis"
                              >
                                {{ prettyBytes(item.uploadedSize) }}
                              </div>
                            </v-col>
                          </v-row>
                        </drag>
                      </drop>
                    </template>
                    <template v-slot:append="{ item }">
                      <v-row v-if="!item.isRenaming">
                        <v-col
                          v-if="item.isUploaded"
                          class="d-flex flex-grow-0 flex-shrink-0 ma-3 ml-2 pa-0 align-center"
                        >
                          <v-icon class="text--disabled" title="uploaded" small>
                            mdi-cloud-check
                          </v-icon>
                        </v-col>
                        <v-col
                          v-if="canRetryUpload(item)"
                          class="d-flex flex-grow-0 flex-shrink-0 ma-3 ml-2 pa-0 align-center"
                        >
                          <v-btn
                            color="info"
                            @click="retryUpload(item)"
                            :disabled="item.isDisabled"
                            small
                            depressed
                          >
                            <v-icon left>mdi-cloud-upload</v-icon>
                            Retry
                          </v-btn>
                        </v-col>
                        <v-col
                          v-if="showFileWarnings(item)"
                          class="d-flex flex-grow-0 flex-shrink-0 ma-3 ml-2 pa-0 text-caption text-medium-emphasis align-center"
                        >
                          <v-menu open-on-hover bottom left offset-y>
                            <template v-slot:activator="{ props }">
                              <div v-bind="props">
                                <v-icon
                                  :color="
                                    isFileInvalid(item) ||
                                    couldNotUploadFile(item)
                                      ? 'error'
                                      : 'warning'
                                  "
                                >
                                  mdi-alert-circle
                                </v-icon>
                              </div>
                            </template>
                            <div class="pa-4 has-bg-white">
                              <div
                                v-if="
                                  isFileInvalid(item) ||
                                  couldNotUploadFile(item)
                                "
                                class="text-body-2 mb-4"
                              >
                                <b>This file cannot be uploaded</b>
                              </div>
                              <ul class="text-subtitle-1">
                                <li v-if="couldNotUploadFile(item)">
                                  Maximum number of files exceeded.
                                </li>
                                <li v-if="!isFileExtensionValid(item)">
                                  This file extension is not allowed for upload.
                                </li>
                                <li v-if="!isFileNameValid(item)">
                                  This file name contains invalid characters.
                                </li>
                                <li v-if="isFileTooBig(item)">
                                  Files cannot be larger than
                                  <b>{{ prettyBytes(maxUploadSizePerFile) }}</b>
                                  .
                                </li>
                              </ul>
                            </div>
                          </v-menu>
                        </v-col>
                        <v-col v-if="item.isDisabled">
                          <v-icon color="primary lighten-2" small>
                            fas fa-circle-notch fa-spin
                          </v-icon>
                        </v-col>
                      </v-row>
                    </template>
                  </v-treeview>
                </v-col>
                <v-col v-if="breakpoints.smAndUp"></v-col>
              </v-row>
            </cz-drag-select>
          </drop>
        </v-card-text>
        <v-divider />

        <div class="py-2 px-4" v-if="rootDirectory.children.length">
          <span>
            {{ allFiles.length }} file{{ allFiles.length === 1 ? '' : 's' }}
          </span>
          <v-divider class="mx-4" vertical></v-divider>
          <span
            v-if="totalUploadSize"
            :class="
              isTotalUploadSizeTooBig
                ? 'red--text text--lighten-1 font-weight-bold'
                : ''
            "
          >
            {{ prettyBytes(totalUploadSize) }}
          </span>

          <template v-if="selected.length">
            <v-divider class="mx-4" vertical></v-divider>
            <span class="text-subtitle-2">
              {{ selected.length }} item{{ selected.length !== 1 ? 's' : '' }}
              selected
            </span>
          </template>

          <v-menu
            v-if="isTotalUploadSizeTooBig"
            open-on-hover
            top
            right
            offset-y
          >
            <template v-slot:activator="{ props }">
              <div class="ml-4 d-inline-block" v-bind="props">
                <v-icon color="error">mdi-alert-circle</v-icon>
              </div>
            </template>

            <div class="pa-4 has-bg-white text-subtitle-1">
              The total upload size cannot exceed
              <b>{{ prettyBytes(maxTotalUploadSize) }}</b>
            </div>
          </v-menu>
        </div>
      </v-card>

      <v-card
        flat
        outlined
        v-else-if="!rootDirectory.children.length"
        class="pa-2 text-body-1 text-medium-emphasis mb-2"
      >
        <v-card-text class="text-center">
          No files have been included in this submission.
        </v-card-text>
      </v-card>

      <v-alert
        v-if="hasTooManyFiles"
        class="text-subtitle-1"
        border="start"
        type="error"
        elevation="1"
      >
        The maximum number of files cannot exceed
        <b>{{ maxNumberOfFiles }}</b>
      </v-alert>

      <drop
        @drop="onDropDiscard($event)"
        v-if="isDragMoving && !isReadOnly"
        class="discard-area d-flex align-center justify-center error lighten-5 files-container--included transition-swing"
      >
        <v-icon class="mr-2" x-large>mdi-delete-outline</v-icon>
      </drop>
      <div
        v-else-if="!isReadOnly"
        class="upload-drop-area files-container--included"
      >
        <!-- <b-upload
          type="file"
          multiple
          drag-drop
          expanded
          v-model="dropFiles"
          class="has-bg-light-gray"
        >
          <v-alert
            class="ma-4 has-cursor-pointer transparent"
            type="info"
            prominent
            colored-border
            icon="mdi-paperclip"
          >
            <span class="text-body-1">
              Drop your files here or click to upload.
            </span>
          </v-alert>
        </b-upload> -->
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {
  Component,
  Vue,
  toNative,
  Prop,
  Ref,
  Watch,
} from 'vue-facing-decorator';
import { IFolder, IFile } from '@/types';
import { default as Notifications } from '@/models/notifications';
import { FILE_ICONS } from '@/constants';
// @ts-ignore
import { DnDEvent, Drag, Drop, DropMask } from 'vue-easy-dnd';
import CzDragSelect from '@/components/cz.drag-select.vue';

import {
  VCard,
  VCardText,
  VCardTitle,
  VDivider,
  VSheet,
  VTooltip,
  VSpacer,
  VTextField,
  VMenu,
  VRow,
  VCol,
  // VTreeview,
  VBtn,
  VIcon,
  VList,
  VListItem,
  VListItemTitle,
  VAlert,
} from 'vuetify/components';
import { useDisplay } from 'vuetify';

import { ClickOutside } from 'vuetify/directives';

import prettyBytes from 'pretty-bytes';

@Component({
  name: 'cz-file-explorer',
  components: {
    VCard,
    VCardText,
    VCardTitle,
    VDivider,
    VSheet,
    VTooltip,
    VSpacer,
    VTextField,
    VMenu,
    VRow,
    VCol,
    // VTreeview,
    VBtn,
    VIcon,
    VList,
    VListItem,
    VListItemTitle,
    Drag,
    Drop,
    DropMask,
    CzDragSelect,
    VAlert,
  },
  directives: { ClickOutside },
  emits: ['showMetadata', 'input'],
})
class CzFileExplorer extends Vue {
  /** The `IFolder` instance representing the root of the file structure */
  @Prop({ required: true }) rootDirectory!: IFolder;
  @Prop() maxNumberOfFiles!: number;
  @Prop() maxTotalUploadSize!: number;
  @Prop() maxUploadSizePerFile!: number;
  @Prop({ default: 'primary lighten-2' }) folderColor!: string;
  /** If specified, will only allow upload of listed file types */
  @Prop() supportedFileTypes!: string[];
  /** A regular expression to test validity of file names */
  @Prop() fileNameRegex!: RegExp;
  /** If `true`, allow folder operations */
  @Prop({ default: false }) hasFolders!: boolean;
  /** If `true`, render the file browser in read-only state. Files and folders cannot be edited. */
  @Prop({ default: false }) isReadOnly!: boolean;

  /** A function to check if an item has metadata that can be displayed using the
   * 'View file metadata' context menu item
   * */
  @Prop()
  hasFileMetadata?: (_item: IFile | IFolder) => Promise<boolean>;

  /** Asynchronous function to run when renaming files or folders */
  @Prop() renameFileOrFolder?: (
    _item: IFile | IFolder,
    _newPath: string
  ) => Promise<boolean>;

  /** Asynchronous function to run when deleting files or folders */
  @Prop() deleteFileOrFolder?: (item: IFile | IFolder) => Promise<boolean>;

  /** Asynchronous function to run when uploading files or creating folders
   * @returns An boolean array indicating if the file was uploaded successfully
   */
  @Prop() upload?: (_items: IFile[] | IFolder[]) => Promise<boolean[]>;

  @Ref('tree') tree!: InstanceType<typeof VTreeview> & any;

  breakpoints: any = useDisplay();

  fileIcons = FILE_ICONS;
  open: (IFolder | IFile)[] = [];
  selected: (IFolder | IFile)[] = [];
  dropFiles: File[] = [];
  isDeleting = false;
  fileReleaseDate = null;
  shiftAnchor: IFolder | IFile | null = null;
  search = '';
  showMenu = false;
  showMenuItem: IFolder | IFile | null = null;
  keyCounter = 0;
  ignoreNextClick = false;
  isDragMoving = false;
  isRootDragging = false;
  prettyBytes = prettyBytes;

  menuAttrs = {
    'position-x': 0,
    'position-y': 0,
  };

  public get hasInvalidFilesToUpload() {
    return this.allItems.some((item: IFile | IFolder) => {
      return (
        !this.isFolder(item) &&
        !(item as IFile).isUploaded &&
        this.isFileInvalid(item as IFile)
      );
    });
  }

  get isSomeNotUploaded() {
    return this.allFiles.some(i => !i.isUploaded);
  }

  get allFiles(): IFile[] {
    return this.allItems.filter((item: IFile | IFolder) => {
      return !this.isFolder(item);
    });
  }

  get hasTooManyFiles() {
    if (!this.maxNumberOfFiles) {
      return false;
    }

    const validFiles = this.allItems.filter(
      item => !this.isFileInvalid(item as IFile)
    );
    return validFiles.length > this.maxNumberOfFiles;
  }

  get isTotalUploadSizeTooBig() {
    if (!this.maxTotalUploadSize) {
      return false;
    }
    return this.totalUploadSize > this.maxTotalUploadSize;
  }

  get itemsToCut(): (IFile | IFolder)[] {
    return this._itemsToCutRecursive(this.rootDirectory);
  }

  get activeDirectoryItem(): IFolder | IFile {
    if (this.selected.length !== 1) {
      return this.rootDirectory;
    } else {
      return this.selected[0];
    }
  }

  get canPaste() {
    const isValidTarget = this.selected.length <= 1;
    const areItemsValid =
      this.itemsToCut.length > 0 &&
      !this.itemsToCut.includes(this.activeDirectoryItem);

    return isValidTarget && areItemsValid;
  }

  onDragSelect(selectedKeys: number[]) {
    this.unselectAll();
    const selectedItems = selectedKeys.map(key => {
      return this.tree.nodes[key].item;
    });
    this.select(selectedItems);
  }

  onDragEnd() {
    this.ignoreNextClick = true;
  }

  onDragStart() {
    this.unselectAll();
  }

  canPasteOnFolder(item: IFile | IFolder) {
    return (
      this.itemsToCut.length > 0 &&
      !this.itemsToCut.includes(item) &&
      this.itemsToCut.some(i => this.getParent(i) !== item)
    );
  }

  get canCutSelected() {
    return this.selected.length;
  }

  canCutItem(item: IFile | IFolder) {
    return this.hasFolders && !item.isCutting;
  }

  get allItems(): IFile[] {
    return this._getDirectoryItems(this.rootDirectory);
  }

  get filter() {
    return (item: any, search: string, textKey: string) => {
      return (
        item[textKey]
          .trim()
          .toLowerCase()
          .indexOf(search.trim().toLowerCase()) > -1
      );
    };
  }

  /** @return total size of files uploaded and valid files pending to upload */
  get totalUploadSize(): number {
    const validFiles = this.allItems.filter(
      item => !this.isFileInvalid(item as IFile)
    );

    return validFiles.reduce((acc: number, file: IFile) => {
      const currentFileSize = file.file?.size || file.uploadedSize || 0;
      return acc + currentFileSize;
    }, 0);
  }

  created() {
    // Add keys
    this._annotateDirectory(this.rootDirectory);
  }

  generateNewKey(): number {
    const newKey = this.keyCounter++;
    if (this.tree && this.tree.nodes[newKey]) {
      // This key already exists, try the next one.
      return this.generateNewKey();
    }
    return newKey;
  }

  show(event: MouseEvent, item: IFile | IFolder | null) {
    // TODO: right click will erase the previous selection and only select the current item
    // Find a way to prevent this behaviour
    if (item && this.isReadOnly && !this.hasFileMetadata?.(item)) {
      return false;
    }

    if (item && !this.isSelected(item)) {
      this.unselectAll();
      this.select([item]);
    }
    this.shiftAnchor = item;
    this.showMenu = false;
    this.menuAttrs['position-x'] = event.clientX;
    this.menuAttrs['position-y'] = event.clientY;
    this.$nextTick(() => {
      this.showMenu = true;
      this.showMenuItem = item;
    });
  }

  /** Traverse the file structure and annotate keys. */
  private _annotateDirectory(item: IFolder) {
    const childFolders = item.children.filter((i, _index) => {
      i.key = i.key ?? this.generateNewKey();
      return this.isFolder(i);
    }) as IFolder[];

    for (let i = 0; i < childFolders.length; i++) {
      this._annotateDirectory(childFolders[i]);
    }
  }

  @Watch('rootDirectory.children', { deep: true })
  onInput() {
    const updatedItems = this._getDirectoryItems(this.rootDirectory);
    const validItems = updatedItems.filter(
      item => !this.isFileInvalid(item as IFile)
    );
    this.$emit('input', validItems);
  }

  retryUpload(item: IFile) {
    this.select([this.getParent(item)]);
    this.onDeleteFileOrFolder(item);

    const nameOverrides: { [index: number]: string } = {};

    // If the file that failed to upload was renamed after, use the new file name
    if (item.file && item.file.name !== item.name) {
      nameOverrides[0] = item.name;
    }

    if (item.file) {
      this.onFilesDropped([item.file], [], nameOverrides);
    }
  }

  /**
   * @param nameOverrides A key - value dictionary where the key is the index of the file in the `newFiles` array and the value is the new file name.
   * */
  @Watch('dropFiles')
  async onFilesDropped(
    newFiles: File[],
    _oldFiles: File[],
    nameOverrides?: { [index: string]: string }
  ) {
    if (!newFiles.length) {
      return;
    }
    const targetFolder: IFolder = this.activeDirectoryItem.hasOwnProperty(
      'children'
    )
      ? (this.activeDirectoryItem as IFolder)
      : this.getParent(this.activeDirectoryItem);

    const addedFiles = newFiles.map((file, index) => {
      const newItem = {
        name: this._getAvailableName(
          nameOverrides?.[index] || file.name,
          targetFolder
        ),
        key: this.generateNewKey(),
        file: file,
      } as IFile;

      targetFolder.children.push(newItem);
      return newItem;
    });

    this._openRecursive(targetFolder);

    const validFiles = addedFiles.filter(f => !this.isFileInvalid(f));
    if (
      this.upload &&
      validFiles.length &&
      !this.hasTooManyFiles &&
      !this.isTotalUploadSizeTooBig
    ) {
      validFiles.map(f => this._toggleItemDisabled(f, true));
      try {
        const responses = await this.upload(validFiles);
        responses.map((wasUploaded, index) => {
          validFiles[index].isUploaded = wasUploaded;
        });
      } catch (e: any) {
        e.map((wasUploaded: boolean, index: number) => {
          validFiles[index].isUploaded = wasUploaded;
        });
      } finally {
        validFiles.map(f => this._toggleItemDisabled(f, false));
      }
    }
    this.dropFiles = [];
  }

  selectAll() {
    this.select(this.allItems);
  }

  /** Returns an item path string. I.e: "Some Folder/readme.txt" */
  getPathString(item: IFolder | IFile) {
    if (item === this.rootDirectory) {
      return '';
    }

    const parentKeys = this.tree.getParents(item.key);
    const parentNames = parentKeys.map(
      (p: string) => this.tree.nodes[p].item.name
    );
    return [...parentNames.reverse(), item.name].join('/');
  }

  isFolder(item: IFile | IFolder) {
    return item.hasOwnProperty('children');
  }

  isSelected(item: IFolder | IFile) {
    return this.selected.includes(item);
  }

  select(items: (IFolder | IFile)[]) {
    this.selected = [...new Set([...this.selected, ...items])];
  }

  unselect(item: IFolder | IFile) {
    const index = this.selected.indexOf(item);
    if (index >= 0) {
      this.selected.splice(index, 1);
    }
  }

  unselectAll() {
    this.selected = [];
  }

  cut() {
    this.uncutAll();

    this.selected.map(item => {
      if (item) {
        item.isCutting = true;
      }
    });
  }

  uncutAll() {
    this.itemsToCut.map(item => {
      item.isCutting = false;
    });
  }

  /** Paste the selected files inside the directory where the file was dropped */
  async onDropMove(event: DnDEvent, dropTarget: IFolder) {
    const targetFolder = this.isFolder(dropTarget)
      ? dropTarget
      : this.getParent(dropTarget);
    if (!this.isSelected(event.data)) {
      this.unselectAll();
      this.select([event.data]);
    }

    await this._handlePaste(targetFolder, this.selected);
  }

  onDropDiscard(event: DnDEvent) {
    if (!this.isSelected(event.data)) {
      this.unselectAll();
      this.select([event.data]);
    }
    this.deleteSelected();
  }

  /** Paste the selected files inside the selected folder */
  async onPaste() {
    const targetFolder: IFolder = this.isFolder(this.activeDirectoryItem)
      ? (this.activeDirectoryItem as IFolder)
      : this.getParent(this.activeDirectoryItem);

    await this._handlePaste(targetFolder, this.itemsToCut);
  }

  private async _handlePaste(target: IFolder, items: (IFile | IFolder)[]) {
    const itemsToMove = [...items]; // We make a copy because the original can change during iteration below
    const pastePromises: Promise<boolean>[] = [];

    for (let i = 0; i < itemsToMove.length; i++) {
      const item = itemsToMove[i];
      pastePromises.push(this._paste(item, target));
    }
    this._openRecursive(target);

    const wasPasted = await Promise.allSettled(pastePromises);

    if (wasPasted.some(r => r.status === 'fulfilled' && r.value)) {
      this.unselectAll();
      this.uncutAll();
    }
  }

  // TODO: currently not propagating correctly
  // _closeIfEmpty(item: IFolder) {
  //   if (!item.children.length) {
  //     const index = this.open.indexOf(item);
  //     if (index >= 0) {
  //       this.open.splice(index, 1);
  //     }
  //   }
  // }

  /** Move an item to the target folder inside the Treeview structure */
  private _moveItem(item: IFolder | IFile, targetFolder: IFolder) {
    this._deleteItem(item);

    // Need to be performed on next tick after changes from splice operation above are propagated to the tree
    this.$nextTick(() => {
      // Add to destination
      item.name = this._getAvailableName(item.name, targetFolder);
      targetFolder.children.push(item);
      targetFolder.children = targetFolder.children.sort((_a, b) => {
        return b.hasOwnProperty('children') ? 1 : -1;
      });
    });
  }

  private async _paste(
    item: IFile | IFolder,
    targetFolder: IFolder
  ): Promise<boolean> {
    let wasMoved = false;
    const targetPathString = this.getPathString(targetFolder);
    const itemPathString = this.getPathString(item);

    const newPath = [targetPathString, item.name]
      .filter(s => s.length)
      .join('/');

    // Can't move a parent folder to a path inside itself
    if (newPath.startsWith(itemPathString)) {
      return false;
    }

    this._toggleItemDisabled(item, true);
    wasMoved =
      item.isUploaded && this.renameFileOrFolder
        ? await this.renameFileOrFolder(item, newPath)
        : true;

    if (wasMoved) {
      this._moveItem(item, targetFolder);
    }

    this._toggleItemDisabled(item, false);

    return wasMoved;
  }

  canRenameItem(item: IFile | IFolder) {
    return item.isUploaded
      ? this.renameFileOrFolder && !item.isDisabled
      : !item.isDisabled;
  }

  onItemClick(event: MouseEvent, item: IFolder | IFile) {
    const wasOnlyOneSelected =
      this.isSelected(item) && this.selected.length == 1;
    this.unselectAll();
    this.select([item]);
    this.shiftAnchor = item;

    if (!wasOnlyOneSelected) {
      event.stopPropagation();
    }
  }

  onItemCtrlClick(event: MouseEvent, item: IFolder | IFile) {
    this.toggleSelect(item);
    this.shiftAnchor = item;
    event.stopPropagation();
  }

  getParent(item: IFile | IFolder): IFolder {
    if (item.key !== undefined && this.tree.nodes.hasOwnProperty(item.key)) {
      const parentKey = this.tree.getParents(item.key)[0];
      const parentNode = this.tree.nodes[parentKey];
      return parentNode?.item || this.rootDirectory;
    }

    return this.rootDirectory;
  }

  onItemShiftClick(event: MouseEvent, item: IFolder | IFile) {
    const parent = this.getParent(item);
    const itemIndex = parent.children.indexOf(item);
    const anchorIndex = this.shiftAnchor
      ? Math.max(0, parent.children.indexOf(this.shiftAnchor))
      : 0;

    this.unselectAll();

    const first = Math.min(itemIndex, anchorIndex);
    const last = Math.max(itemIndex, anchorIndex);
    const itemsToSelect: (IFolder | IFile)[] = [];

    for (let i = first; i <= last; i++) {
      itemsToSelect.push(parent.children[i]);
    }
    this.select(itemsToSelect);
    event.stopPropagation();
  }

  toggleSelect(item: IFolder | IFile) {
    if (this.isSelected(item)) {
      this.unselect(item);
    } else {
      this.select([item]);
    }
  }

  renameItem(item: IFile | IFolder) {
    this._clearRenaming(this.rootDirectory);
    item.isRenaming = true;
    this.showMenu = false;
    this.showMenuItem = null;
  }

  isFileExtensionValid(file: IFile) {
    if (!this.supportedFileTypes) {
      return true;
    }

    const nameWithoutExtension = this._getFileNameWithoutExtension(file.name);
    const extention = file.name.replace(nameWithoutExtension, '');
    return this.supportedFileTypes.includes(extention);
  }

  isFileNameValid(file: IFile) {
    if (!this.fileNameRegex) {
      return true;
    }
    const nameWithoutExtension = this._getFileNameWithoutExtension(file.name);
    const isValid = this.fileNameRegex.test(nameWithoutExtension);
    return isValid;
  }

  isFileInvalid(file: IFile) {
    return !this.isFileExtensionValid(file) || this.isFileTooBig(file);
  }

  hasFileWarnings(file: IFile) {
    return !this.isFileNameValid(file);
  }

  isFileTooBig(file: IFile) {
    if (!this.maxUploadSizePerFile) {
      return false;
    }

    return file.file?.size && file.file?.size > this.maxUploadSizePerFile;
  }

  canRetryUpload(item: IFile) {
    return (
      item.file &&
      !this.hasTooManyFiles &&
      !this.isFolder(item) &&
      !this.isFileInvalid(item as IFile) &&
      (item as IFile).isUploaded === false
    );
  }

  couldNotUploadFile(item: IFile) {
    return item.isUploaded === false && this.hasTooManyFiles;
  }

  showFileWarnings(item: IFile) {
    return (
      !this.isFolder(item) &&
      (this.isFileInvalid(item) ||
        this.hasFileWarnings(item) ||
        this.couldNotUploadFile(item))
    );
  }

  async onRenamed(item: IFile | IFolder, name: string) {
    if (name.trim()) {
      const newName = this._getAvailableName(
        name,
        this.getParent(item),
        item.name
      );

      this._toggleItemDisabled(item, true);
      try {
        const wasRenamed =
          item.isUploaded && this.renameFileOrFolder
            ? await this.renameFileOrFolder(item, name)
            : true;
        if (wasRenamed) {
          item.name = newName;
        }
      } catch (e) {
      } finally {
        this._toggleItemDisabled(item, false);
      }
    }

    item.isRenaming = false;
  }

  async deleteSelected() {
    Notifications.openDialog({
      title: 'Remove files?',
      content: 'Are you sure you want to remove the selected files?',
      confirmText: 'Remove',
      confirmTextColor: 'error',
      cancelText: 'Cancel',
      contentClass: 'files-container--included',
      isPersistent: true,
      onConfirm: async () => {
        this._deleteSelected();
      },
    });
  }

  private async _deleteSelected() {
    this.isDeleting = true;
    const reversedSelected = this.selected.reverse();

    // First, disable all items to delete
    for (let i = 0; i < reversedSelected.length; i++) {
      const item = reversedSelected[i];
      this._toggleItemDisabled(item, true);
    }

    for (let i = 0; i < reversedSelected.length; i++) {
      const item = reversedSelected[i];

      if (item) {
        if (item === this.shiftAnchor) {
          this.shiftAnchor = null;
        }

        const isParentSelected = this.isSelected(this.getParent(item));
        if (!this.isFolder(item) && !(item as IFile).isUploaded) {
          this._deleteItem(item); // Item hasn't been uploaded, just discard it
        } else if (!isParentSelected) {
          await this.onDeleteFileOrFolder(item);
        }
      }
    }
    this.isDeleting = false;
    this.selected = [];
  }

  private async onDeleteFileOrFolder(item: IFile | IFolder): Promise<boolean> {
    let wasDeleted = false;
    if (!this.isFolder(item) && this.isFileInvalid(item as IFile)) {
      // File was not uplaoded because it was invalid. No need to delete asynchronously.
      wasDeleted = true;
    } else if (item.isUploaded && this.deleteFileOrFolder) {
      this._toggleItemDisabled(item, true);
      wasDeleted = await this.deleteFileOrFolder(item);
    } else {
      wasDeleted = true;
    }

    this._toggleItemDisabled(item, false);
    if (wasDeleted) {
      this._deleteItem(item);
    }
    return wasDeleted;
  }

  private _toggleItemDisabled(item: IFolder | IFile, isDisabled: boolean) {
    item.isDisabled = isDisabled;
    if (this.isFolder(item)) {
      (item as IFolder).children.map(i => {
        i.isDisabled = isDisabled;
        this._toggleItemDisabled(i as IFolder, isDisabled);
      });
    }
  }

  onClickOutside() {
    if (this.ignoreNextClick) {
      this.ignoreNextClick = false;
    } else {
      this.unselectAll();
    }
  }

  include() {
    return [
      ...Array.from(
        document.getElementsByClassName('files-container--included')
      ),
      ...Array.from(document.getElementsByClassName('v-overlay')),
    ];
  }

  discardAll() {
    Notifications.openDialog({
      title: 'Discard all files?',
      content: 'Are you sure you want to remove all files staged for upload?',
      confirmText: 'Discard',
      confirmTextColor: 'error',
      cancelText: 'Cancel',
      isPersistent: true,
      onConfirm: async () => {
        this.rootDirectory.children = this.rootDirectory.children.filter(
          i => i.isUploaded
        );
        this.selected = [];
        this.open = [];
      },
    });
  }

  async newFolder() {
    if (!this.hasFolders) {
      return;
    }

    this._clearRenaming(this.rootDirectory);
    const newFolder = {
      name: 'New folder',
      children: [],
      isRenaming: false,
      isCutting: false,
      isDisabled: false,
      key: this.generateNewKey(),
    } as IFolder;

    const targetFolder = this.isFolder(this.activeDirectoryItem)
      ? (this.activeDirectoryItem as IFolder)
      : this.getParent(this.activeDirectoryItem);

    newFolder.name = this._getAvailableName(newFolder.name, targetFolder);

    let wasUploaded = true;
    this._openRecursive(targetFolder);
    targetFolder.children.push(newFolder);
    targetFolder.children = targetFolder.children.sort((_a, b) => {
      return b.hasOwnProperty('children') ? 1 : -1;
    });
    if (this.upload) {
      this._toggleItemDisabled(newFolder, true);
      try {
        const response = await this.upload([newFolder]);
        wasUploaded = response[0];
      } catch (e) {
        wasUploaded = false;
      } finally {
        this._toggleItemDisabled(newFolder, false);
      }
    }

    if (wasUploaded) {
      newFolder.isUploaded = true;
      this.$nextTick(() => {
        this._openRecursive(newFolder);
      });
    } else {
      this._deleteItem(newFolder);
    }
  }

  private _openRecursive(item: IFile | IFolder) {
    if (item === this.rootDirectory) {
      return;
    }

    if (this.isFolder(item)) {
      this.open = [...new Set([...this.open, item])];
    }

    const parent = this.getParent(item);
    if (parent) {
      this.open = [...new Set([...this.open, parent])];
      this._openRecursive(parent);
    }
  }

  private _deleteItem(item: IFolder | IFile) {
    if (item === this.rootDirectory) {
      return;
    }

    const parent = this.getParent(item);
    const index = parent.children.indexOf(item);

    if (index >= 0) {
      parent.children.splice(index, 1);
      // this._closeIfEmpty(parent);
    }
  }

  private _getAvailableName(
    fileName: string,
    parent: IFolder,
    currentName?: string
  ): string {
    let availableName = fileName;
    let nameAlreadyExists = parent.children.some((item: IFile | IFolder) => {
      return item.name === availableName && item.name !== currentName;
    });
    let counter = 1;

    while (nameAlreadyExists) {
      const nameWithoutExtension = this._getFileNameWithoutExtension(fileName);
      const extention = fileName.replace(nameWithoutExtension, '');

      availableName = `${nameWithoutExtension} (${counter})${extention}`;
      nameAlreadyExists = parent.children.some((item: IFile | IFolder) => {
        return item.name === availableName && item.name !== currentName;
      });
      counter++;
    }

    return availableName;
  }

  private _getFileNameWithoutExtension(fileName: string) {
    return fileName.replace(/\.[^/.]+$/, '');
  }

  /** Sets `isRenaming` property of all files and folders inside the directory to `false` */
  private _clearRenaming(item: IFile | IFolder) {
    item.isRenaming = false;
    if (this.isFolder(item)) {
      (item as IFolder).children.map(this._clearRenaming);
    }
  }

  /** Returns all files inside the given folder */
  private _getDirectoryItems(item: IFolder): IFile[] {
    const childFolders = item.children.filter(i =>
      this.isFolder(i)
    ) as IFolder[];

    let nestedItems: (IFile | IFolder)[] = [];
    for (let i = 0; i < childFolders.length; i++) {
      const newItems = this._getDirectoryItems(childFolders[i]);
      nestedItems.push(...newItems);
    }

    return [...item.children, ...nestedItems] as IFile[];
  }

  private _itemsToCutRecursive(item: IFolder): (IFile | IFolder)[] {
    const childFolders = item.children.filter(i =>
      this.isFolder(i)
    ) as IFolder[];

    return [
      ...item.children.filter(f => f.isCutting),
      ...childFolders
        .filter(f => f.children.length)
        .map(f => this._itemsToCutRecursive(f))
        .reduce((acc, curr) => {
          return [...acc, ...curr];
        }, []),
    ];
  }
}

export default toNative(CzFileExplorer);
</script>

<style lang="scss" scoped>
.upload-drop-area {
  border: 1px dashed #ddd;
  border-radius: 0.5rem;
  cursor: pointer;

  &,
  .upload {
    cursor: pointer;

    &:hover {
      background: #eee;
    }
  }

  :deep(input[type='file']) {
    display: none;
  }

  :deep(.upload-draggable.is-hovered) {
    background: lightgray;
  }
}

.discard-area {
  height: 7.0625rem;
  border-radius: 0.5rem;
  cursor: pointer;
  opacity: 0.45;

  &.error.lighten-5 {
    border: 1px dashed !important;
    border-color: rgba(0, 0, 0, 0.25) !important;

    &:hover {
      opacity: 1 !important;
    }
  }
}

.files-container-card.border-dash {
  border: 1px dashed !important;
  border-color: rgba(0, 0, 0, 0.25) !important;
}

.files-container {
  height: 15rem;
  overflow: auto;
  resize: vertical;
}

.root-drag-select {
  min-height: 100%;
}

.full-height {
  height: 100%;
}

.item-row {
  .item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    flex-basis: fit-content;
    max-width: 100%;
  }
}

.drag-ghost {
  background: white !important;
  border: 1px solid #ddd !important;
}
</style>
