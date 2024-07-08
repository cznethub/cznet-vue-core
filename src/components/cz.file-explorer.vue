<template>
  <v-card class="mb-8">
    <v-sheet
      class="pa-4 d-flex align-center files-container--included flex-wrap gap-1 bg-grey-lighten-4"
    >
      <v-tooltip v-if="hasFolders && !isReadOnly" bottom transition="fade">
        <template v-slot:activator="{ props }">
          <v-btn
            @click="newFolder"
            icon="mdi-folder"
            size="small"
            variant="text"
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
                icon="mdi-select"
                size="small"
                variant="text"
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
                size="small"
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
                icon="mdi-content-cut"
                size="small"
                variant="text"
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
                size="small"
                variant="text"
                v-bind="props"
              />
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
                size="small"
                variant="text"
                :disabled="isDeleting || !selected.length"
                v-bind="props"
              ></v-btn>
            </template>
            <span>Discard</span>
          </v-tooltip>
        </template>
      </div>

      <v-spacer />

      <template v-if="rootDirectory.children.length && !isReadOnly">
        <v-spacer></v-spacer>
        <v-btn
          @click="discardAll"
          :disabled="!isSomeNotUploaded"
          depressed
          variant="elevated"
        >
          <v-icon class="mr-2" size="small" color="error">
            mdi-cloud-cancel-outline
          </v-icon>
          Discard All
        </v-btn>
      </template>
    </v-sheet>

    <v-divider outlined></v-divider>
    <v-card-text style="min-height: 10rem">
      <slot name="prepend"></slot>

      <v-menu v-model="showMenu" v-bind="menuAttrs" offset-y :attach="true">
        <v-list width="auto" class="files-container--included">
          <template v-if="!isReadOnly">
            <!-- CREATE NEW FOLDER -->
            <v-list-item v-if="hasFolders" @click.stop="newFolder">
              <v-list-item-title>
                <v-icon color="primary" class="mr-2">mdi-folder-outline</v-icon>
                Create new folder
              </v-list-item-title>
            </v-list-item>

            <!-- RENAME -->
            <v-list-item
              v-if="!!showMenuItem && canRenameItem(showMenuItem)"
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
              <v-list-item v-if="showMenuItem" @click="cut">
                <v-list-item-title>
                  <v-icon
                    class="mr-2"
                    :class="{ 'text--disabled': showMenuItem.isCutting }"
                  >
                    mdi-content-cut
                  </v-icon>
                  Cut
                </v-list-item-title>
              </v-list-item>

              <!-- PASTE -->
              <v-list-item
                v-if="!showMenuItem || isFolder(showMenuItem)"
                @click="onPaste"
                :disabled="
                  (!!showMenuItem && !canPasteOnFolder(showMenuItem)) ||
                  (!showMenuItem && !canPasteOnFolder(rootDirectory))
                "
              >
                <v-list-item-title>
                  <v-icon
                    class="mr-2"
                    :class="{
                      'text--disabled':
                        !!showMenuItem && !canPasteOnFolder(showMenuItem),
                    }"
                  >
                    mdi-content-paste
                  </v-icon>
                  Paste
                </v-list-item-title>
              </v-list-item>
            </template>

            <!-- DISCARD -->
            <v-list-item
              v-if="showMenuItem"
              @click="deleteSelected"
              :disabled="isDeleting"
            >
              <v-list-item-title v-if="showMenuItem?.isUploaded">
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

          <!-- VIEW DETAILS -->
          <template v-if="showMenuItem && hasFileMetadata?.(showMenuItem)">
            <v-divider v-if="!isReadOnly"></v-divider>

            <v-list-item @click.stop="$emit('show-metadata', showMenuItem)">
              <v-list-item-title>
                <v-icon class="mr-2" color="orange">
                  mdi-text-box-search-outline
                </v-icon>
                View details
              </v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>

      <v-card
        flat
        variant="outlined"
        v-if="rootDirectory.children.length"
        class="mb-4 files-container-card"
        :class="isRootDragging && isDragMoving ? 'border-dash' : ''"
      >
        <v-card-text>
          <v-text-field
            v-model="search"
            label="Search by file or folder name..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
            clear-icon="mdi-close-circle-outline"
            prepend-inner-icon="mdi-magnify"
          />
        </v-card-text>
        <v-card-text class="files-container py-0 pr-0">
          <drop
            @drop="onDropMove($event, rootDirectory)"
            @dragenter.exact="isRootDragging = true"
            @dragleave.exact="isRootDragging = false"
            class="fill-height"
          >
            <cz-drag-select
              attribute="customAttribute"
              @update:model-value="onDragSelect"
              @endDrag="onDragEnd"
              @startDrag="unselectAll"
              :disabled="isDragMoving"
              @click.right.exact="show($event, null)"
            >
              <v-row class="flex-grow-1">
                <v-col
                  :cols="11"
                  v-click-outside="{ handler: onClickOutside, include }"
                >
                  <v-treeview
                    ref="tree"
                    :items="rootDirectory.children"
                    v-model:activated="selected"
                    v-model:opened="opened"
                    :search="search"
                    :filter="filter"
                    return-object
                    item-value="key"
                    item-title="name"
                    density="comfortable"
                    class="files-container--included"
                    activatable
                    :active-strategy="customActiveStrategy"
                  >
                    <template #title="{ item }">
                      <drop
                        :key="item.key"
                        @drop="onDropMove($event, item as IFolder)"
                        :customAttribute="item.key"
                      >
                        <drag
                          :key="item.key"
                          :disabled="
                            !hasFolders || item.isRenaming || isReadOnly
                          "
                          :data="item"
                          @dragstart="onDragStart"
                          @dragend="isDragMoving = false"
                          drag-class="drag-ghost"
                          go-back
                          :class="{ highlight: item.highlight }"
                        >
                          <v-text-field
                            v-if="item.isRenaming"
                            class="ml-3"
                            @change="onRename(item, $event)"
                            @keydown.enter="item.isRenaming = false"
                            @click:append="item.isRenaming = false"
                            :model-value="item.name"
                            v-click-outside="onClickOutside"
                            append-icon="mdi-cancel"
                            density="compact"
                            variant="outlined"
                            hide-details="auto"
                            autofocus
                            clearable
                          />

                          <cz-file-explorer-item
                            v-else
                            @click.right.exact.prevent="show($event, item)"
                            @retry-upload="retryUpload(item as IFile)"
                            :item="item"
                            :isOpen="opened.includes(item.key)"
                            :folderColor="folderColor"
                            :fileColor="fileColor"
                            :canRetryUpload="canRetryUpload(item)"
                          >
                            <template #warnings>
                              <v-menu
                                v-if="showFileWarnings(item as IFile)"
                                open-on-hover
                                bottom
                                left
                                offset-y
                              >
                                <template v-slot:activator="{ props }">
                                  <div v-bind="props">
                                    <v-icon
                                      :color="
                                        isFileInvalid(item as IFile) ||
                                        item.isUploaded === false
                                          ? 'error'
                                          : 'warning'
                                      "
                                    >
                                      mdi-alert-circle
                                    </v-icon>
                                  </div>
                                </template>

                                <v-card>
                                  <v-card-text>
                                    <div
                                      v-if="isFileInvalid(item as IFile)"
                                      class="text-body-1"
                                    >
                                      <b>This file cannot be uploaded</b>
                                    </div>

                                    <div
                                      v-else-if="item.isUploaded === false"
                                      class="text-body-1"
                                    >
                                      <b>This file failed to upload</b>
                                    </div>

                                    <ul class="text-subtitle-1 ml-4">
                                      <li v-if="hasTooManyFiles">
                                        Maximum number of files exceeded.
                                      </li>
                                      <li
                                        v-if="
                                          !isFileExtensionValid(item as IFile)
                                        "
                                      >
                                        This file extension is not allowed for
                                        upload.
                                      </li>
                                      <li
                                        v-if="!isFileNameValid(item as IFile)"
                                      >
                                        This file name contains invalid
                                        characters.
                                      </li>
                                      <li v-if="isFileTooLarge(item as IFile)">
                                        Files cannot be larger than
                                        <b>
                                          {{
                                            prettyBytes(maxUploadSizePerFile)
                                          }}
                                        </b>
                                        .
                                      </li>
                                    </ul>
                                  </v-card-text>
                                </v-card>
                              </v-menu>
                            </template>
                          </cz-file-explorer-item>
                        </drag>
                      </drop>
                    </template>
                  </v-treeview>
                </v-col>
                <v-col
                  v-if="breakpoints.smAndUp"
                  class="drag-select--included"
                ></v-col>
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

            <v-card class="text-subtitle-1">
              <v-card-text>
                The total upload size cannot exceed
                <b>{{ prettyBytes(maxTotalUploadSize) }}</b>
              </v-card-text>
            </v-card>
          </v-menu>
        </div>
      </v-card>

      <v-card
        flat
        variant="outlined"
        v-else-if="!rootDirectory.children.length"
        class="pa-2 text-body-1 text-medium-emphasis mb-2 border-grey"
      >
        <v-card-text class="text-center">
          No files have been included in this submission.
        </v-card-text>
      </v-card>

      <v-alert
        v-if="hasTooManyFiles"
        class="text-subtitle-1 mb-4"
        border="start"
        type="error"
        colored-border
        variant="outlined"
      >
        The maximum number of files cannot exceed
        <b>{{ maxNumberOfFiles }}</b>
      </v-alert>

      <drop
        @drop="onDropDiscard($event)"
        v-if="isDragMoving && !isReadOnly"
        class="discard-area d-flex align-center justify-center files-container--included transition-swing"
      >
        <v-icon color="error" class="mr-2" size="x-large">
          mdi-delete-outline
        </v-icon>
      </drop>
      <div
        v-else-if="!isReadOnly"
        class="upload-drop-area files-container--included"
      >
        <b-upload
          type="file"
          multiple
          drag-drop
          expanded
          v-model="dropFiles"
          class="fill-height d-block"
        >
          <v-alert variant="plain" class="fill-height">
            <v-alert-title class="text-body-1">
              <v-icon class="mr-2" size="x-large" icon="mdi-paperclip"></v-icon>
              Drop your files here or click to upload
            </v-alert-title>
          </v-alert>
        </b-upload>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, toNative, Prop, Watch } from 'vue-facing-decorator';
import { IFolder, IFile } from '@/types';
import { default as Notifications } from '@/models/notifications';
// @ts-ignore
import { DnDEvent, Drag, Drop, DropMask } from 'vue-easy-dnd';
import CzDragSelect from '@/components/cz.drag-select.vue';
import CzFileExplorerItem from '@/components/cz.file-explorer-item.vue';

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
  VBtn,
  VIcon,
  VList,
  VListItem,
  VListItemTitle,
  VAlert,
} from 'vuetify/components';
import { VTreeview } from 'vuetify/labs/VTreeview';
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
    VTreeview,
    VBtn,
    VIcon,
    VList,
    VListItem,
    VListItemTitle,
    Drag,
    Drop,
    DropMask,
    CzDragSelect,
    CzFileExplorerItem,
    VAlert,
  },
  directives: { ClickOutside },
  emits: ['show-metadata', 'update:valid-items'],
})
class CzFileExplorer extends Vue {
  /** The `IFolder` instance representing the root of the file structure */
  @Prop({ required: true }) rootDirectory!: IFolder;
  @Prop() maxNumberOfFiles!: number;
  @Prop() maxTotalUploadSize!: number;
  @Prop() maxUploadSizePerFile!: number;
  @Prop({ default: 'primary lighten-2' }) folderColor!: string;
  @Prop({ default: 'secondary lighten-1' }) fileColor!: string;
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

  // @Ref('tree') tree!: InstanceType<typeof VTreeview> & any;

  breakpoints: any = useDisplay();
  opened: number[] = [];
  selected: number[] = [];
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

  customActiveStrategy = (_mandatory?: boolean) => {
    const onItemClick = (item: IFolder | IFile, activated: Set<number>) => {
      activated.clear();
      activated.add(+item.key);
      if (this.isFolder(item)) {
        this.open([item]);
      }
      this.shiftAnchor = item;
    };

    const onItemCtrlClick = (item: IFolder | IFile, activated: Set<number>) => {
      if (activated.has(+item.key)) {
        activated.delete(+item.key);
      } else {
        activated.add(+item.key);
      }
      this.shiftAnchor = item;
    };

    const onItemShiftClick = (
      item: IFolder | IFile,
      activated: Set<number>
    ) => {
      const parent = this.getParent(item);
      const itemIndex = parent.children.indexOf(item);
      const anchorIndex = this.shiftAnchor
        ? Math.max(0, parent.children.indexOf(this.shiftAnchor))
        : 0;

      activated.clear();

      const first = Math.min(itemIndex, anchorIndex);
      const last = Math.max(itemIndex, anchorIndex);

      for (let i = first; i <= last; i++) {
        activated.add(parent.children[i].key);
      }
    };

    const strategy = {
      activate: ({ id, value, activated, event }) => {
        const item = this.getItemById(id as number);
        if (!item) {
          return;
        }

        event?.ctrlKey
          ? onItemCtrlClick(item, activated)
          : event?.shiftKey
            ? onItemShiftClick(item, activated)
            : onItemClick(item, activated);

        return activated;
      },
      in: (v: number[], _children: any, _parents: any) => {
        return new Set(v);
      },
      out: (v: Set<number>) => {
        return Array.from(v);
      },
    };

    return strategy;
  };

  menuAttrs: Record<any, any> = {
    // 'position-x': 0,
    // 'position-y': 0,
    target: null,
  };

  public get hasInvalidFilesToUpload() {
    return this.allFiles.some((item: IFile) => {
      return !item.isUploaded && this.isFileInvalid(item as IFile);
    });
  }

  get isSomeNotUploaded() {
    return this.allItems.some(i => !i.isUploaded);
  }

  get allFiles(): IFile[] {
    return this.allItems.filter((item: IFile | IFolder) => {
      return !this.isFolder(item);
    }) as IFile[];
  }

  get allFolders(): IFolder[] {
    return this.allItems.filter((item: IFile | IFolder) => {
      return this.isFolder(item);
    }) as IFolder[];
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
      return this.getItemById(this.selected[0]) || this.rootDirectory;
    }
  }

  get canPaste() {
    const isValidTarget = this.selected.length <= 1;
    const areItemsValid =
      this.itemsToCut.length > 0 &&
      !this.itemsToCut.includes(this.activeDirectoryItem);

    return isValidTarget && areItemsValid;
  }

  get selectedItems() {
    return this.selected.map(key => this.getItemById(+key)).filter(i => i) as (
      | IFile
      | IFolder
    )[];
  }

  @Watch('rootDirectory.children', { deep: true })
  protected onInput() {
    const items = this._getDirectoryItems(this.rootDirectory) as (
      | IFile
      | IFolder
    )[];
    const validItems = items.filter(item => !this.isFileInvalid(item as IFile));
    this.$emit('update:valid-items', validItems);
  }

  getItemById(id: number) {
    return this.allItems.find(item => item.key === id);
  }

  onDragStart() {
    this.isDragMoving = true;
    this.isRootDragging = false;
  }

  onDragSelect(selectedKeys: string[]) {
    this.unselectAll();
    const selectedItems = selectedKeys
      .map(key => this.getItemById(+key))
      .filter(i => i) as (IFile | IFolder)[];
    this.select(selectedItems);
  }

  onDragEnd() {
    this.ignoreNextClick = true;
    setTimeout(() => {
      this.ignoreNextClick = false;
    }, 100);
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

  get allItems(): (IFile | IFolder)[] {
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
    const validFiles = this.allFiles.filter(item => !this.isFileInvalid(item));

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
    if (this.allItems.some(i => i.key === newKey)) {
      // This key already exists, try the next one.
      return this.generateNewKey();
    }
    return newKey;
  }

  show(event: MouseEvent, item: (IFile | IFolder) | null) {
    if (item && this.isReadOnly && !this.hasFileMetadata?.(item)) {
      return false;
    }

    if (item && !this.isSelected(item)) {
      this.unselectAll();
      this.select([item]);
    }

    this.shiftAnchor = item;
    this.showMenu = false;
    // this.menuAttrs['position-x'] = event.clientX;
    // this.menuAttrs['position-y'] = event.clientY;
    this.menuAttrs['attach'] = event.target;
    this.menuAttrs['target'] = [event.clientX, event.clientY];
    this.$nextTick(() => {
      this.showMenu = true;
      this.showMenuItem = item;
    });
    event.preventDefault();
    event.stopPropagation();
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

  /**
   * @param nameOverrides A key - value dictionary where the key is the index of the file in the `newFiles` array and the value is the new file name.
   * */
  @Watch('dropFiles', { deep: true })
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

      // Important: we need to return the proxy that is created after push operation so we don't break reactivity
      const itemIndex = targetFolder.children.push(newItem);
      return targetFolder.children[itemIndex - 1] as IFile;
    });

    this._openRecursive(targetFolder);

    const validFiles = addedFiles.filter(f => !this.isFileInvalid(f));

    // Flag invalid files
    const invalidFiles = addedFiles.filter(f => this.isFileInvalid(f));
    invalidFiles.forEach(f => (f.isUploaded = false));

    if (
      this.upload &&
      validFiles.length &&
      !this.hasTooManyFiles &&
      !this.isTotalUploadSizeTooBig
    ) {
      // Attempt to upload the valid files
      validFiles.forEach(f => this._toggleItemDisabled(f, true));
      try {
        const responses = await this.upload(validFiles);
        responses.forEach((wasUploaded, index) => {
          validFiles[index].isUploaded = wasUploaded;
        });
      } catch (e: any) {
        e.forEach((wasUploaded: boolean, index: number) => {
          validFiles[index].isUploaded = wasUploaded;
        });
      } finally {
        validFiles.forEach(f => this._toggleItemDisabled(f, false));
      }
    } else {
      // Flag valid files because they could not be uploaded
      validFiles.forEach(f => (f.isUploaded = false));
    }
    this.dropFiles = [];
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

  selectAll() {
    this.select(this.allItems);
  }

  getParent(item: IFile | IFolder): IFolder {
    return (
      this.allFolders.find(folder => folder.children?.includes(item)) ||
      this.rootDirectory
    );
  }

  /** Returns an item path string. I.e: "Some Folder/readme.txt" */
  getPathString(item: IFolder | IFile) {
    if (item === this.rootDirectory) {
      return '';
    }

    const paths = [item];

    while (paths[paths.length - 1] !== this.rootDirectory) {
      const lastParent = paths[paths.length - 1];
      const parent = this.getParent(lastParent);
      if (parent !== this.rootDirectory) {
        paths.push(parent);
      } else {
        break;
      }
    }

    return paths
      .reverse()
      .map(i => i.name)
      .join('/');
  }

  isFolder(item: IFile | IFolder) {
    return item.hasOwnProperty('children');
  }

  isSelected(item: IFolder | IFile) {
    return this.selected.includes(item.key);
  }

  select(items: (IFolder | IFile)[]) {
    this.selected = [
      ...new Set([...this.selected, ...items.map(i => +i.key as number)]),
    ];
  }

  open(items: (IFolder | IFile)[]) {
    this.opened = [
      ...new Set([...this.opened, ...items.map(i => +i.key as number)]),
    ];
  }

  unselect(item: IFolder | IFile) {
    const index = this.selected.indexOf(item.key as number);
    if (index >= 0) {
      this.selected.splice(index, 1);
    }
  }

  unselectAll() {
    this.selected = [];
  }

  cut() {
    this.uncutAll();

    this.selected.map(key => {
      const item = this.getItemById(key);
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

    await this._handlePaste(
      targetFolder,
      this.itemsToCut.map(i => i.key)
    );
  }

  private async _handlePaste(target: IFolder, items: number[]) {
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

  private _closeIfEmpty(item: IFolder) {
    if (!item.children.length) {
      const index = this.opened.indexOf(item.key);
      if (index >= 0) {
        this.opened.splice(index, 1);
      }
    }
  }

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
      item.highlight = true;
      setTimeout(() => {
        item.highlight = false;
      }, 2000);
    });
  }

  private async _paste(key: number, targetFolder: IFolder): Promise<boolean> {
    let wasMoved = false;
    const item = this.getItemById(key);

    if (!item) {
      return false;
    }

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
    return (
      !this.isFileExtensionValid(file) ||
      this.isFileTooLarge(file) ||
      !this.isFileNameValid(file)
    );
  }

  isFileTooLarge(file: IFile) {
    if (!this.maxUploadSizePerFile) {
      return false;
    }

    return file.file?.size && file.file?.size > this.maxUploadSizePerFile;
  }

  canRetryUpload(item: IFile | IFolder) {
    return (
      !this.isFolder(item) &&
      this.upload &&
      (item as IFile).file &&
      !this.hasTooManyFiles &&
      !this.isFolder(item) &&
      !this.isFileInvalid(item as IFile) &&
      (item as IFile).isUploaded === false
    );
  }

  showFileWarnings(item: IFile) {
    return (
      !this.isFolder(item) &&
      ((!!this.upload && item.isUploaded === false) || this.isFileInvalid(item))
    );
  }

  async onRename(item: IFile | IFolder, event: Event) {
    const name = (event.target as InstanceType<typeof VTextField>).value.trim();
    if (name) {
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
      const item = this.getItemById(reversedSelected[i]);
      if (item) {
        this._toggleItemDisabled(item, true);
      }
    }

    for (let i = 0; i < reversedSelected.length; i++) {
      const item = this.getItemById(reversedSelected[i]);

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
      (item as IFolder).children.forEach(i => {
        i.isDisabled = isDisabled;
        this._toggleItemDisabled(i as IFolder, isDisabled);
      });
    }
  }

  onClickOutside() {
    this.ignoreNextClick ? (this.ignoreNextClick = false) : this.unselectAll();
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
        this.opened = [];
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
      // isRenaming: false,
      // isCutting: false,
      isDisabled: false,
      key: this.generateNewKey(),
    } as IFolder;

    const targetFolder = this.isFolder(this.activeDirectoryItem)
      ? (this.activeDirectoryItem as IFolder)
      : this.getParent(this.activeDirectoryItem);

    newFolder.name = this._getAvailableName(newFolder.name, targetFolder);

    let wasUploaded = false;
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
        // Workaround for isDisabled not propagating below
        this._deleteItem(newFolder);
      } finally {
        // TODO: not propagating if error caught above
        this._toggleItemDisabled(newFolder, false);
      }
    }

    if (wasUploaded) {
      newFolder.isUploaded = true;
      this.$nextTick(() => {
        this._openRecursive(newFolder);
      });
    }
  }

  private _openRecursive(item: IFile | IFolder) {
    if (item === this.rootDirectory) {
      return;
    }

    if (this.isFolder(item)) {
      this.opened = [...new Set([...this.opened, item.key])];
    }

    const parent = this.getParent(item);
    if (parent && parent !== this.rootDirectory) {
      this.opened = [...new Set([...this.opened, parent.key])];
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
      this._closeIfEmpty(parent);
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
  private _getDirectoryItems(item: IFolder): (IFile | IFolder)[] {
    const childFolders = item.children.filter(i =>
      this.isFolder(i)
    ) as IFolder[];

    let nestedItems: (IFile | IFolder)[] = [];
    for (let i = 0; i < childFolders.length; i++) {
      const newItems = this._getDirectoryItems(childFolders[i]);
      nestedItems.push(...newItems);
    }

    return [...item.children, ...nestedItems];
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
.border-grey {
  border: 1px solid rgba(0, 0, 0, 0.25);
}

.upload-drop-area {
  border: 1px dashed rgba(0, 0, 0, 0.25);
  border-radius: 0.5rem;
  cursor: pointer;
  height: 7rem;

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

  :deep(.upload-draggable) {
    height: 100%;
  }
}

.discard-area {
  height: 7rem;
  border-radius: 0.5rem;
  cursor: pointer;
  opacity: 0.45;
  border: 1px dashed;
  border-color: red !important;

  &:hover {
    opacity: 1 !important;
  }
}

.files-container-card {
  border-color: rgba(0, 0, 0, 0.25) !important;

  &.border-dash {
    border: 1px dashed !important;
  }
}

.files-container {
  height: 15rem;
  overflow: auto;
  resize: vertical;
}

.cz-drag-select {
  min-height: 100%;
}

.drag-ghost {
  background: white !important;
  border: 1px solid #ddd !important;
  height: 3rem !important;
}

// Make the item content span the full height to enable controls in the entire area
:deep(.v-treeview) {
  .v-list-item.v-treeview-item {
    padding-top: 0;
    padding-bottom: 0;
    & > .v-list-item__content {
      height: 100%;

      .v-list-item-title,
      .dnd-drop,
      .dnd-drag {
        height: 100%;
      }
    }
  }

  .dnd-drag.highlight {
    animation: highlight 2s linear forwards;
  }

  @keyframes highlight {
    from {
      background-color: #ddd;
    }

    to {
      background-color: initial;
    }
  }
}
</style>
