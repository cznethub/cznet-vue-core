<template>
  <v-row
    :class="{
      'text-medium-emphasis': item.isCutting || item.isDisabled,
    }"
    class="item-row flex-wrap flex-sm-nowrap ma-0 flex-sm-row flex-column cursor-pointer fill-height align-center"
  >
    <v-col class="d-flex flex-row align-center pa-0">
      <v-icon
        v-if="isFolder(item)"
        class="mr-2"
        :disabled="item.isDisabled"
        :color="item.isCutting ? 'grey' : folderColor"
      >
        {{ isOpen ? 'mdi-folder-open' : 'mdi-folder' }}
      </v-icon>

      <v-icon
        v-else
        class="mr-2"
        :disabled="item.isDisabled"
        :color="item.isCutting || item.isDisabled ? 'grey' : fileColor"
      >
        {{
          fileIcons[item.name.split('.').pop() || ''] || fileIcons['default']
        }}
      </v-icon>

      <div class="item-name flex-grow-1 flex-shrink-1">
        <span :title="item.name">
          {{ item.name }}
        </span>
      </div>

      <div
        v-if="(item as IFile).file"
        class="flex-grow-0 flex-shrink-0 mx-3 pa-0 text-caption text-medium-emphasis"
      >
        {{ prettyBytes((item as IFile).file?.size || 0) }}
      </div>

      <div
        v-else-if="(item as IFile).uploadedSize"
        class="flex-grow-0 flex-shrink-0 mx-3 pa-0 text-caption text-medium-emphasis"
      >
        {{ prettyBytes((item as IFile).uploadedSize || 0) }}
      </div>

      <template v-if="!item.isRenaming">
        <v-col
          v-if="item.isUploaded"
          class="d-flex flex-grow-0 flex-shrink-0 ma-3 ml-2 pa-0 align-center"
        >
          <v-icon class="text-medium-emphasis" title="uploaded" size="small">
            mdi-cloud-check
          </v-icon>
        </v-col>

        <v-col
          class="d-flex flex-grow-0 flex-shrink-0 ma-3 ml-2 pa-0 text-caption text-medium-emphasis align-center"
        >
          <slot name="warnings" />
        </v-col>
        <v-col
          v-if="canRetryUpload"
          class="d-flex flex-grow-0 flex-shrink-0 ma-3 ml-2 pa-0 align-center"
        >
          <v-btn
            color="info"
            @click="$emit('retry-upload')"
            :disabled="item.isDisabled"
            size="small"
            variant="outlined"
            depressed
          >
            <v-icon left class="mr-1">mdi-cloud-upload</v-icon>
            Retry
          </v-btn>
        </v-col>

        <v-col v-if="item.isDisabled">
          <v-icon
            color="primary lighten-2"
            icon="fa:fas fa-circle-notch fa-spin"
            small
          />
        </v-col>
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue, toNative, Prop } from 'vue-facing-decorator';
import { IFolder, IFile } from '@/types';
import { FILE_ICONS } from '@/constants';
import { VRow, VCol, VIcon } from 'vuetify/components';
import prettyBytes from 'pretty-bytes';

@Component({
  name: 'cz-file-explorer-item',
  components: {
    VRow,
    VCol,
    VIcon,
  },
  directives: {},
  emits: ['retry-upload'],
})
class CzFileExplorerItem extends Vue {
  @Prop({ required: true }) item!: IFile | IFolder;
  @Prop({ default: 'primary lighten-2' }) folderColor!: string;
  @Prop({ default: 'primary lighten-3' }) fileColor!: string;
  @Prop() isOpen!: boolean;
  @Prop() canRetryUpload!: boolean;
  prettyBytes = prettyBytes;

  fileIcons = FILE_ICONS;

  isFolder(item: IFile | IFolder) {
    return item.hasOwnProperty('children');
  }
}

export default toNative(CzFileExplorerItem);
</script>

<style lang="scss" scoped>
.item-row {
  .item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    flex-basis: fit-content;
    max-width: 100%;
  }
}
</style>
