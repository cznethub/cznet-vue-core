<template>
  <v-card class="mb-8">
    <v-sheet
      class="pa-4 d-flex align-center has-bg-light-gray primary lighten-4 files-container--included flex-wrap gap-1"
    >
      <v-tooltip v-if="hasFolders && !isReadOnly" bottom transition="fade">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            @click="newFolder"
            class="mr-4"
            small
            icon
            v-on="on"
            v-bind="attrs"
            ><v-icon>mdi-folder</v-icon></v-btn
          >
        </template>
        New Folder
      </v-tooltip>

      <div v-else class="text-subtitle-1 mr-4">Files</div>

      <div v-if="!isReadOnly">
        <template>
          <v-tooltip bottom transition="fade">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="selectAll"
                :disabled="!rootDirectory.children.length"
                class="mr-1"
                icon
                small
                v-on="on"
                v-bind="attrs"
              >
                <v-icon>mdi-select</v-icon>
              </v-btn>
            </template>
            <span>Select All</span>
          </v-tooltip>
        </template>

        <!-- <template>
          <v-tooltip bottom transition="fade">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="unselectAll"
                icon
                small
                :disabled="!selected.length"
                v-on="on"
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
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="cut"
                :disabled="!canCutSelected"
                class="mr-1"
                icon
                small
                v-on="on"
                v-bind="attrs"
                ><v-icon>mdi-content-cut</v-icon></v-btn
              >
            </template>
            Cut
          </v-tooltip>

          <v-tooltip bottom transition="fade">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="onPaste"
                :disabled="!canPaste"
                icon
                small
                v-on="on"
                v-bind="attrs"
              >
                <v-icon>mdi-content-paste</v-icon>
              </v-btn>
            </template>
            Paste
          </v-tooltip>
          <v-divider class="mx-4" vertical></v-divider>
        </template>

        <template v-if="!isReadOnly">
          <v-tooltip bottom transition="fade">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="deleteSelected"
                icon
                small
                :disabled="isDeleting || !selected.length"
                v-on="on"
                v-bind="attrs"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
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
          @click="empty"
          :disabled="!isSomeNotUploaded"
          small
          depressed
          class="primary lighten-2"
        >
          <v-icon class="mr-2" small>mdi-delete-outline</v-icon>
          Discard All
        </v-btn>
      </template>
    </v-sheet>

    <v-card-text style="min-height: 10rem">
      <slot name="prepend"></slot>

      <v-menu v-model="showMenu" v-bind="menuAttrs" absolute offset-y>
        <v-list
          v-if="showMenuItem"
          width="200"
          class="files-container--included"
        >
          <template v-if="!isReadOnly">
            <!-- CREATE NEW FOLDER -->
            <v-list-item
              v-if="isFolder(showMenuItem) && hasFolders"
              @click.stop="newFolder"
            >
              <v-list-item-title
                ><v-icon color="primary" small>mdi-folder-outline</v-icon>
                Create new folder</v-list-item-title
              >
            </v-list-item>

            <!-- RENAME -->
            <v-list-item
              v-if="canRenameItem(showMenuItem)"
              @click.stop="renameItem(showMenuItem)"
              :disabled="showMenuItem.isRenaming"
            >
              <v-list-item-title
                ><v-icon
                  :class="{ 'text--disabled': showMenuItem.isRenaming }"
                  small
                  >mdi-pencil-outline</v-icon
                >
                Rename</v-list-item-title
              >
            </v-list-item>

            <template v-if="hasFolders">
              <!-- CUT -->
              <v-list-item @click="cut" :disabled="!canCutItem(showMenuItem)">
                <v-list-item-title
                  ><v-icon
                    :class="{ 'text--disabled': !canCutItem(showMenuItem) }"
                    small
                    >mdi-content-cut</v-icon
                  >
                  Cut</v-list-item-title
                >
              </v-list-item>

              <!-- PASTE -->
              <v-list-item
                v-if="isFolder(showMenuItem)"
                @click="onPaste"
                :disabled="!canPasteOnFolder(showMenuItem)"
              >
                <v-list-item-title
                  ><v-icon
                    small
                    :class="{
                      'text--disabled': !canPasteOnFolder(showMenuItem),
                    }"
                    >mdi-content-paste</v-icon
                  >
                  Paste</v-list-item-title
                >
              </v-list-item>
            </template>

            <!-- DISCARD -->
            <v-list-item @click="deleteSelected" :disabled="isDeleting">
              <v-list-item-title v-if="showMenuItem.isUploaded">
                <v-icon small :class="{ 'text--disabled': isDeleting }"
                  >mdi-cloud-remove-outline</v-icon
                >
                Delete
              </v-list-item-title>
              <v-list-item-title v-else>
                <v-icon :class="{ 'text--disabled': isDeleting }" small
                  >mdi-delete-outline</v-icon
                >
                Discard
              </v-list-item-title>
            </v-list-item>
          </template>

          <!-- VIEW METADATA -->
          <template v-if="hasFileMetadata(showMenuItem)">
            <v-divider v-if="!isReadOnly"></v-divider>

            <v-list-item @click.stop="$emit('showMetadata', showMenuItem)">
              <v-list-item-title
                ><v-icon small>mdi-text-box-search-outline</v-icon> View
                metadata</v-list-item-title
              >
            </v-list-item>
          </template>
        </v-list>
      </v-menu>

      <v-card flat outlined v-if="rootDirectory.children.length" class="mb-4">
        <v-card-text class="files-container" style="height: 15rem">
          <drop @drop="onDropMove($event, rootDirectory)" class="root-drop">
            <drag-select
              attribute="customAttribute"
              @change="onDragSelect"
              @endDrag="onDragEnd"
              @startDrag="onDragStart"
              class="root-drop"
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
                        :color="item.isCutting ? 'grey' : ''"
                      >
                        {{ open ? "mdi-folder-open" : "mdi-folder" }}
                      </v-icon>
                      <v-icon
                        v-else
                        @click.ctrl.exact="onItemCtrlClick($event, item)"
                        :disabled="item.isDisabled"
                        :color="item.isCutting ? 'grey' : ''"
                      >
                        {{
                          fileIcons[item.name.split(".").pop()] ||
                          fileIcons["default"]
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
                          @dragstart="isDragMoving = true"
                          @dragend="isDragMoving = false"
                          drag-class="drag-ghost"
                          go-back
                        >
                          <v-text-field
                            v-if="item.isRenaming"
                            class="ml-3"
                            @change="onRenamed(item, $event)"
                            @keydown.enter="item.isRenaming = false"
                            @click.exact="onItemClick($event, item)"
                            @click.ctrl.exact="onItemCtrlClick($event, item)"
                            @click.meta.exact="onItemCtrlClick($event, item)"
                            @click.shift.exact="onItemShiftClick($event, item)"
                            @click:append="item.isRenaming = false"
                            :value="item.name"
                            v-click-outside="onClickOutside"
                            append-icon="mdi-cancel"
                            dense
                            outlined
                            hide-details="auto"
                            autofocus
                          >
                          </v-text-field>

                          <v-row
                            v-else
                            @contextmenu.prevent="show($event, item)"
                            @click.exact="onItemClick($event, item)"
                            @click.ctrl.exact="onItemCtrlClick($event, item)"
                            @click.meta.exact="onItemCtrlClick($event, item)"
                            @click.shift.exact="onItemShiftClick($event, item)"
                            :class="{ 'text--secondary': item.isCutting }"
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
                                class="flex-grow-0 flex-shrink-0 mx-0 mx-sm-3 pa-0 text-caption text--secondary"
                              >
                                {{ item.file.size | prettyBytes(2, false) }}
                              </div>
                              <div
                                v-else-if="item.uploadedSize"
                                class="flex-grow-0 flex-shrink-0 mx-0 mx-sm-3 pa-0 text-caption text--secondary"
                              >
                                {{ item.uploadedSize | prettyBytes(2, false) }}
                              </div>
                            </v-col>
                          </v-row>
                        </drag>
                      </drop>
                    </template>
                    <template v-slot:append="{ item }">
                      <v-row v-if="!item.isRenaming">
                        <v-col
                          v-if="!isFolder(item) && item.isUploaded"
                          class="d-flex flex-grow-0 flex-shrink-0 ma-3 ml-2 pa-0 align-center"
                        >
                          <v-icon class="text--disabled" title="uploaded" small
                            >mdi-cloud-check</v-icon
                          >
                        </v-col>
                        <v-col
                          v-if="canRetryUpload(item)"
                          class="d-flex flex-grow-0 flex-shrink-0 ma-3 ml-2 pa-0 align-center"
                        >
                          <v-btn
                            color="info"
                            @click="$emit('upload', [item])"
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
                          class="d-flex flex-grow-0 flex-shrink-0 ma-3 ml-2 pa-0 text-caption text--secondary align-center"
                        >
                          <v-menu open-on-hover bottom left offset-y>
                            <template v-slot:activator="{ on, attrs }">
                              <div v-bind="attrs" v-on="on">
                                <v-icon
                                  :color="
                                    isFileInvalid(item) ||
                                    couldNotUploadFile(item)
                                      ? 'error'
                                      : 'warning'
                                  "
                                  >mdi-alert-circle</v-icon
                                >
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
                                  <b>{{
                                    maxUploadSizePerFile | prettyBytes(2, false)
                                  }}</b
                                  >.
                                </li>
                              </ul>
                            </div>
                          </v-menu>
                        </v-col>
                        <v-col v-if="item.isDisabled">
                          <v-icon small>fas fa-circle-notch fa-spin</v-icon>
                        </v-col>
                      </v-row>
                    </template>
                  </v-treeview>
                </v-col>
                <v-col v-if="$vuetify.breakpoint.smAndUp"></v-col>
              </v-row>
            </drag-select>
          </drop>
        </v-card-text>
        <v-divider></v-divider>

        <div class="py-2 px-4" v-if="rootDirectory.children.length">
          <span
            >{{ allFiles.length }} file{{
              allFiles.length === 1 ? "" : "s"
            }}</span
          >
          <v-divider class="mx-4" vertical></v-divider>
          <span
            v-if="totalUploadSize"
            :class="
              isTotalUploadSizeTooBig
                ? 'red--text text--lighten-1 font-weight-bold'
                : ''
            "
            >{{ totalUploadSize | prettyBytes(2, false) }}
          </span>

          <template v-if="selected.length">
            <v-divider class="mx-4" vertical></v-divider>
            <span class="text-subtitle-2"
              >{{ selected.length }} item{{
                selected.length !== 1 ? "s" : ""
              }}
              selected</span
            >
          </template>

          <v-menu
            v-if="isTotalUploadSizeTooBig"
            open-on-hover
            top
            right
            offset-y
          >
            <template v-slot:activator="{ on, attrs }">
              <div class="ml-4 d-inline-block" v-bind="attrs" v-on="on">
                <v-icon color="error">mdi-alert-circle</v-icon>
              </div>
            </template>

            <div class="pa-4 has-bg-white text-subtitle-1">
              The total upload size cannot exceed
              <b>{{ maxTotalUploadSize | prettyBytes(2, false) }}</b>
            </div>
          </v-menu>
        </div>
      </v-card>

      <v-card
        flat
        outlined
        v-else-if="!rootDirectory.children.length"
        class="pa-2 text-body-1 text--secondary mb-2"
      >
        <v-card-text class="text-center">
          No files have been included in this submission.
        </v-card-text>
      </v-card>

      <v-alert
        v-if="hasTooManyFiles"
        class="text-subtitle-1"
        border="left"
        colored-border
        type="error"
        elevation="1"
      >
        The maximum number of files cannot exceed
        <b>{{ maxNumberOfFiles }}</b>
      </v-alert>

      <drop
        @drop="onDropDiscard($event)"
        v-if="isDragMoving && !isReadOnly"
        class="discard-area d-flex align-center justify-center error lighten-5 files-container--included"
      >
        <v-icon class="mr-2" x-large>mdi-delete-outline</v-icon>
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
          class="has-bg-light-gray"
        >
          <v-alert
            class="ma-4 has-cursor-pointer transparent"
            type="info"
            prominent
            colored-border
            icon="mdi-paperclip"
          >
            <span class="text-subtitle-1"
              >Drop your files here or click to upload</span
            >
          </v-alert>
        </b-upload>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Watch, Prop, Vue, Ref } from "vue-property-decorator";
import { IFolder, IFile } from "@/types";
import { default as Notifications } from "@/models/notifications";
import { FILE_ICONS } from "@/constants";
import { setReactive } from "@/utils";

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
  VTreeview,
  VBtn,
  VIcon,
  VList,
  VListItem,
  VListItemTitle,
  ClickOutside,
} from "vuetify/lib";

import { Drag, Drop, DropMask } from "vue-easy-dnd";
import DragSelect from "@/components/DragSelect.vue";

@Component({
  name: "cz-file-explorer",
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
    DragSelect,
  },
  directives: { ClickOutside },
  filters: {},
})
export default class CzFileExplorer extends Vue {
  /** The `IFolder` instance representing the root of the file structure */
  @Prop({ required: true }) rootDirectory!: IFolder;
  @Prop() maxNumberOfFiles!: number;
  @Prop() maxTotalUploadSize!: number;
  @Prop() maxUploadSizePerFile!: number;
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
  @Prop({ default: (_item: IFile | IFolder, _newPath) => () => false })
  hasFileMetadata?: (_item: IFile | IFolder) => Promise<boolean>;

  /** Asynchronous function to run when renaming files or folders */
  @Prop()
  renameFileOrFolder?: (
    _item: IFile | IFolder,
    _newPath: string
  ) => Promise<boolean>;

  /** Asynchronous function to run when deleting files or folders */
  @Prop({ default: (_item: IFile | IFolder) => () => true })
  deleteFileOrFolder?: (item: IFile | IFolder) => Promise<boolean>;

  /** Asynchronous function to run when uploading files or creating folders */
  @Prop({ default: (_items: IFile[] | IFolder[]) => () => true })
  upload?: (_items: IFile[] | IFolder[]) => Promise<boolean>;

  @Ref("tree") tree!: InstanceType<typeof VTreeview> & any;

  protected fileIcons = FILE_ICONS;
  protected open: (IFolder | IFile)[] = [];
  protected selected: (IFolder | IFile)[] = [];
  protected dropFiles: File[] = [];
  protected isDeleting = false;
  protected fileReleaseDate = null;
  protected shiftAnchor: IFolder | IFile | null = null;
  protected search = "";
  protected showMenu = false;
  protected showMenuItem: IFolder | IFile | null = null;
  protected keyCounter = 0;
  protected ignoreNextClick = false;
  protected isDragMoving = false;

  menuAttrs = {
    "position-x": 0,
    "position-y": 0,
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

  protected get isSomeNotUploaded() {
    return this.allFiles.some((i) => !i.isUploaded);
  }

  protected get allFiles(): IFile[] {
    return this.allItems.filter((item: IFile | IFolder) => {
      return !this.isFolder(item);
    });
  }

  protected get hasTooManyFiles() {
    if (!this.maxNumberOfFiles) {
      return false;
    }

    const validFiles = this.allItems.filter(
      (item) => !this.isFileInvalid(item as IFile)
    );
    return validFiles.length > this.maxNumberOfFiles;
  }

  protected get isTotalUploadSizeTooBig() {
    if (!this.maxTotalUploadSize) {
      return false;
    }
    return this.totalUploadSize > this.maxTotalUploadSize;
  }

  protected get itemsToCut(): (IFile | IFolder)[] {
    return this._itemsToCutRecursive(this.rootDirectory);
  }

  protected get activeDirectoryItem(): IFolder | IFile {
    if (this.selected.length !== 1) {
      return this.rootDirectory;
    } else {
      return this.selected[0];
    }
  }

  protected get canPaste() {
    const isValidTarget = this.selected.length <= 1;
    const areItemsValid =
      this.itemsToCut.length > 0 &&
      !this.itemsToCut.includes(this.activeDirectoryItem);

    return isValidTarget && areItemsValid;
  }

  protected onDragSelect(selectedKeys: number[]) {
    this.unselectAll();
    const selectedItems = selectedKeys.map((key) => {
      return this.tree.nodes[key].item;
    });
    this.select(selectedItems);
  }

  protected onDragEnd() {
    this.ignoreNextClick = true;
  }

  protected onDragStart() {
    this.unselectAll();
  }

  protected canPasteOnFolder(item: IFolder) {
    return (
      this.itemsToCut.length > 0 &&
      !this.itemsToCut.includes(item) &&
      this.itemsToCut.some((i) => this.getParent(i) !== item)
    );
  }

  protected get canCutSelected() {
    return this.selected.length;
  }

  protected canCutItem(item: IFile | IFolder) {
    return this.hasFolders && !item.isCutting;
  }

  protected get allItems(): IFile[] {
    return this._getDirectoryItems(this.rootDirectory);
  }

  protected get filter() {
    return (item, search, textKey) => {
      return (
        item[textKey]
          .trim()
          .toLowerCase()
          .indexOf(search.trim().toLowerCase()) > -1
      );
    };
  }

  /** @return total size of files uploaded and valid files pending to upload */
  protected get totalUploadSize(): number {
    const validFiles = this.allItems.filter(
      (item) => !this.isFileInvalid(item as IFile)
    );

    return validFiles.reduce((acc: number, file: IFile) => {
      const currentFileSize = file.file?.size || file.uploadedSize || 0;
      return acc + currentFileSize;
    }, 0);
  }

  created() {
    // Add keys
    this.annotateDirectory(this.rootDirectory);
  }

  protected generateNewKey(): number {
    const newKey = this.keyCounter++;
    if (this.tree && this.tree.nodes[newKey]) {
      // This key already exists
      return this.generateNewKey();
    }
    return newKey;
  }

  protected show(e, item: IFile | IFolder | null) {
    if (item && this.isReadOnly && !this.hasFileMetadata?.(item)) {
      return false;
    }

    if (item && !this.isSelected(item)) {
      this.unselectAll();
      this.select([item]);
    }
    this.shiftAnchor = item;
    this.showMenu = false;
    this.menuAttrs["position-x"] = e.clientX;
    this.menuAttrs["position-y"] = e.clientY;
    this.$nextTick(() => {
      this.showMenu = true;
      this.showMenuItem = item;
    });
  }

  /** Traverse the file structure and annotate keys. */
  protected annotateDirectory(item: IFolder) {
    const childFolders = item.children.filter((i, _index) => {
      i.key = i.key ?? this.generateNewKey();
      return this.isFolder(i);
    }) as IFolder[];

    for (let i = 0; i < childFolders.length; i++) {
      this.annotateDirectory(childFolders[i]);
    }
  }

  @Watch("rootDirectory.children", { deep: true })
  protected onInput() {
    const updatedItems = this._getDirectoryItems(this.rootDirectory);
    const validItems = updatedItems.filter(
      (item) => !this.isFileInvalid(item as IFile)
    );
    this.$emit("input", validItems);
  }

  @Watch("dropFiles")
  protected async onFilesDropped(newFiles: File[]) {
    if (!newFiles.length) {
      return;
    }
    const targetFolder: IFolder = this.activeDirectoryItem.hasOwnProperty(
      "children"
    )
      ? (this.activeDirectoryItem as IFolder)
      : this.getParent(this.activeDirectoryItem);

    const addedFiles = newFiles.map((file, _index) => {
      const newItem = {
        name: this._getAvailableName(file.name, targetFolder),
        key: this.generateNewKey(),
        file: file,
      } as IFile;

      targetFolder.children.push(newItem);
      return newItem;
    });

    this._openRecursive(targetFolder);

    const validFiles = addedFiles.filter((f) => !this.isFileInvalid(f));
    if (
      this.upload &&
      validFiles.length &&
      !this.hasTooManyFiles &&
      !this.isTotalUploadSizeTooBig
    ) {
      await this.upload(validFiles);
    }
    this.dropFiles = [];
  }

  protected selectAll() {
    this.select(this.allItems);
  }

  /** Returns an item path string. I.e: "Some Folder/readme.txt" */
  protected getPathString(item: IFolder | IFile) {
    if (item === this.rootDirectory) {
      return "";
    }

    const parentKeys = this.tree.getParents(item.key);
    const parentNames = parentKeys.map((p) => this.tree.nodes[p].item.name);
    return [...parentNames.reverse(), item.name].join("/");
  }

  protected isFolder(item: IFile | IFolder) {
    return item.hasOwnProperty("children");
  }

  protected isSelected(item: IFolder | IFile) {
    return this.selected.includes(item);
  }

  protected select(items: (IFolder | IFile)[]) {
    this.selected = [...new Set([...this.selected, ...items])];
  }

  protected unselect(item: IFolder | IFile) {
    const index = this.selected.indexOf(item);
    if (index >= 0) {
      this.selected.splice(index, 1);
    }
  }

  protected unselectAll() {
    this.selected = [];
  }

  protected cut() {
    this.uncutAll();

    this.selected.map((item) => {
      if (item) {
        setReactive(item, "isCutting", true);
      }
    });
  }

  protected uncutAll() {
    this.itemsToCut.map((item) => {
      item.isCutting = false;
    });
  }

  /** Paste the selected files inside the directory where the file was dropped */
  protected async onDropMove(event, dropTarget) {
    const targetFolder = this.isFolder(dropTarget)
      ? dropTarget
      : this.getParent(dropTarget);
    if (!this.isSelected(event.data)) {
      this.unselectAll();
      this.select([event.data]);
    }

    await this._handlePaste(targetFolder, this.selected);
  }

  protected onDropDiscard(event) {
    if (!this.isSelected(event.data)) {
      this.unselectAll();
      this.select([event.data]);
    }
    this.deleteSelected();
  }

  /** Paste the selected files inside the selected folder */
  protected async onPaste() {
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

    const wasPasted = await Promise.allSettled(pastePromises);

    if (wasPasted.some((r) => r.status === "fulfilled" && r.value)) {
      this.unselectAll();
      this.uncutAll();
      this._openRecursive(target);
    }
  }

  // TODO: currently not propagating correctly
  protected _closeIfEmpty(item: IFolder) {
    if (!item.children.length) {
      const index = this.open.indexOf(item);
      if (index >= 0) {
        this.open.splice(index, 1);
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
        return b.hasOwnProperty("children") ? 1 : -1;
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
      .filter((s) => s.length)
      .join("/");

    // Can't move a parent folder to a path inside itself
    if (newPath.startsWith(itemPathString)) {
      return false;
    }
    setReactive(item, "isDisabled", true);
    wasMoved = this.renameFileOrFolder
      ? await this.renameFileOrFolder(item, newPath)
      : true;

    if (wasMoved) {
      this._moveItem(item, targetFolder);
    }
    item.isDisabled = false;
    return wasMoved;
  }

  protected canRenameItem(item: IFile | IFolder) {
    return item.isUploaded
      ? this.renameFileOrFolder && !item.isDisabled
      : !item.isDisabled;
  }

  protected onItemClick(event: MouseEvent, item: IFolder | IFile) {
    const wasOnlyOneSelected =
      this.isSelected(item) && this.selected.length == 1;
    this.unselectAll();
    this.select([item]);
    this.shiftAnchor = item;

    if (!wasOnlyOneSelected) {
      event.stopPropagation();
    }
  }

  protected onItemCtrlClick(event: MouseEvent, item: IFolder | IFile) {
    this.toggleSelect(item);
    this.shiftAnchor = item;
    event.stopPropagation();
  }

  protected getParent(item: IFile | IFolder): IFolder {
    if (item.key !== undefined) {
      const parentKey = this.tree.getParents(item.key)[0];
      const parentNode = this.tree.nodes[parentKey];
      return parentNode?.item || this.rootDirectory;
    }

    return this.rootDirectory;
  }

  protected onItemShiftClick(event: MouseEvent, item: IFolder | IFile) {
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

  protected toggleSelect(item: IFolder | IFile) {
    if (this.isSelected(item)) {
      this.unselect(item);
    } else {
      this.select([item]);
    }
  }

  protected renameItem(item: IFile | IFolder) {
    this._clearRenaming(this.rootDirectory);
    setReactive(item, "isRenaming", true);
    this.showMenu = false;
    this.showMenuItem = null;
  }

  protected isFileExtensionValid(file: IFile) {
    if (!this.supportedFileTypes) {
      return true;
    }

    const nameWithoutExtension = this._getFileNameWithoutExtension(file.name);
    const extention = file.name.replace(nameWithoutExtension, "");
    return this.supportedFileTypes.includes(extention);
  }

  protected isFileNameValid(file: IFile) {
    if (!this.fileNameRegex) {
      return true;
    }
    const nameWithoutExtension = this._getFileNameWithoutExtension(file.name);
    const isValid = this.fileNameRegex.test(nameWithoutExtension);
    return isValid;
  }

  protected isFileInvalid(file: IFile) {
    return !this.isFileExtensionValid(file) || this.isFileTooBig(file);
  }

  protected hasFileWarnings(file: IFile) {
    return !this.isFileNameValid(file);
  }

  protected isFileTooBig(file: IFile) {
    if (!this.maxUploadSizePerFile) {
      return false;
    }

    return file.file?.size && file.file?.size > this.maxUploadSizePerFile;
  }

  protected canRetryUpload(item: IFile | IFolder) {
    return (
      !this.hasTooManyFiles &&
      !this.isFolder(item) &&
      !this.isFileInvalid(item as IFile) &&
      (item as IFile).isUploaded === false
    );
  }

  protected couldNotUploadFile(item: IFile) {
    return item.isUploaded === false && this.hasTooManyFiles;
  }

  protected showFileWarnings(item: IFile) {
    return (
      !this.isFolder(item) &&
      (this.isFileInvalid(item) ||
        this.hasFileWarnings(item) ||
        this.couldNotUploadFile(item))
    );
  }

  protected async onRenamed(item: IFile | IFolder, name: string) {
    if (name.trim()) {
      const newName = this._getAvailableName(
        name,
        this.getParent(item),
        item.name
      );

      setReactive(item, "isDisabled", true);
      const wasRenamed = this.renameFileOrFolder
        ? await this.renameFileOrFolder(item, name)
        : true;
      if (wasRenamed) {
        item.name = newName;
      } else {
        Notifications.toast({
          message: `Failed to rename ${
            this.isFolder(item) ? "folder" : "file"
          }`,
          type: "error",
        });
      }
      item.isDisabled = false;
    }

    item.isRenaming = false;
  }

  protected async deleteSelected() {
    Notifications.openDialog({
      title: "Remove files?",
      content: "Are you sure you want to remove the selected files?",
      confirmText: "Remove",
      cancelText: "Cancel",
      contentClass: "files-container--included",
      isPersistent: true,
      onConfirm: async () => {
        this._deleteSelected();
      },
    });
  }

  private async _deleteSelected() {
    this.isDeleting = true;
    const reversedSelected = this.selected.reverse();
    const response: any[] = [];

    // First, disable all items to delete
    for (let i = 0; i < reversedSelected.length; i++) {
      const item = reversedSelected[i];
      this.toggleItemDisabled(item, true);
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
          const message = await this.onDeleteFileOrFolder(item);
          response.push(message);
        }
      }
    }

    if (response.includes(false)) {
      // Failed to delete some file
      Notifications.toast({
        message: "Some of your files could not be deleted",
        type: "error",
      });
    }
    this.isDeleting = false;
    this.selected = [];
  }

  private async onDeleteFileOrFolder(item: IFile | IFolder): Promise<boolean> {
    let wasDeleted = false;
    if (!this.isFolder(item) && this.isFileInvalid(item as IFile)) {
      // File was not uplaoded because it was invalid. No need to delete asynchronously.
      wasDeleted = true;
    } else if (this.deleteFileOrFolder) {
      wasDeleted = await this.deleteFileOrFolder(item);
    } else {
      wasDeleted = true;
    }

    this.toggleItemDisabled(item, false);
    if (wasDeleted) {
      this._deleteItem(item);
    }
    return wasDeleted;
  }

  private toggleItemDisabled(item: IFolder | IFile, isDisabled: boolean) {
    item.isDisabled = isDisabled;
    if (this.isFolder(item)) {
      (item as IFolder).children.map((item) => {
        (item as IFolder).isDisabled = isDisabled;
        this.toggleItemDisabled(item as IFolder, isDisabled);
      });
    }
  }

  protected onClickOutside() {
    if (this.ignoreNextClick) {
      this.ignoreNextClick = false;
    } else {
      this.unselectAll();
    }
  }

  protected include() {
    return [
      ...document.getElementsByClassName("files-container--included"),
      ...document.getElementsByClassName("v-overlay"),
    ];
  }

  protected empty() {
    Notifications.openDialog({
      title: "Remove all files?",
      content: "Are you sure you want to remove all files from this list?",
      confirmText: "Remove",
      cancelText: "Cancel",
      isPersistent: true,
      onConfirm: async () => {
        this.rootDirectory.children = this.rootDirectory.children.filter(
          (i) => i.isUploaded
        );
        this.selected = [];
        this.open = [];
      },
    });
  }

  protected async newFolder() {
    if (!this.hasFolders) {
      return;
    }

    this._clearRenaming(this.rootDirectory);
    const newFolder = {
      name: "New folder",
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

    const wasUploaded = this.upload ? await this.upload([newFolder]) : true;

    if (wasUploaded) {
      targetFolder.children.push(newFolder);
      targetFolder.children = targetFolder.children.sort((_a, b) => {
        return b.hasOwnProperty("children") ? 1 : -1;
      });

      this._openRecursive(newFolder);
    } else {
      // Failed to delete some file
      Notifications.toast({
        message: "Failed to create new folder",
        type: "error",
      });
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
      const extention = fileName.replace(nameWithoutExtension, "");

      availableName = `${nameWithoutExtension} (${counter})${extention}`;
      nameAlreadyExists = parent.children.some((item: IFile | IFolder) => {
        return item.name === availableName && item.name !== currentName;
      });
      counter++;
    }

    return availableName;
  }

  private _getFileNameWithoutExtension(fileName: string) {
    return fileName.replace(/\.[^/.]+$/, "");
  }

  /** Sets `isRenaming` property of all files and folders inside the directory to `false` */
  private _clearRenaming(item: IFile | IFolder) {
    setReactive(item, "isRenaming", false);
    if (this.isFolder(item)) {
      (item as IFolder).children.map(this._clearRenaming);
    }
  }

  /** Returns all files inside the given folder */
  private _getDirectoryItems(item: IFolder): IFile[] {
    const childFolders = item.children.filter((i) =>
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
    const childFolders = item.children.filter((i) =>
      this.isFolder(i)
    ) as IFolder[];

    return [
      ...item.children.filter((f) => f.isCutting),
      ...childFolders
        .filter((f) => f.children.length)
        .map((f) => this._itemsToCutRecursive(f))
        .reduce((acc, curr) => {
          return [...acc, ...curr];
        }, []),
    ];
  }
}
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

  ::v-deep input[type="file"] {
    display: none;
  }

  ::v-deep .upload-draggable.is-hovered {
    background: lightgray;
  }
}

.discard-area {
  height: 7.0625rem;
  border-radius: 0.5rem;
  cursor: pointer;
  opacity: 0.45;
  transition: opacity 0.25s ease;

  &.error.lighten-5 {
    border: 1px dashed !important;
    border-color: rgba(0, 0, 0, 0.54) !important;

    &:hover {
      opacity: 1 !important;
    }
  }
}

.files-container {
  overflow: auto;
  resize: vertical;
}

.root-drop {
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
