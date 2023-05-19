<template>
  <div class="cz-notifications">
    <v-snackbar
      v-model="snackbar.isActive"
      :timeout="snackbar.isInfinite ? -1 : snackbar.duration"
      :color="snackbarColors[snackbar.type].snackbar"
    >
      <span>{{ snackbar.message }}</span>

      <template v-slot:action="{ attrs }">
        <v-btn
          @click="snackbar.isActive = false"
          v-bind="attrs"
          :color="snackbarColors[snackbar.type].actionButton"
          >Dismiss</v-btn
        >
      </template>
    </v-snackbar>

    <v-dialog
      :id="`dialog-` + dialog.title.replaceAll(` `, ``)"
      v-model="dialog.isActive"
      persistent
      width="500"
    >
      <v-card>
        <v-card-title>{{ dialog.title }}</v-card-title>
        <v-card-text class="text-body-1">{{ dialog.content }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="dialog-cancel"
            @click="
              dialog.isActive = false;
              dialog.onCancel();
            "
            text
          >
            {{ dialog.cancelText }}
          </v-btn>

          <v-btn
            v-if="dialog.onSecondaryAction"
            @click="
              dialog.isActive = false;
              dialog.onSecondaryAction();
            "
            color="green darken-1"
            text
          >
            {{ dialog.secondaryActionText }}
          </v-btn>

          <v-btn
            class="dialog-confirm"
            @click="
              dialog.isActive = false;
              dialog.onConfirm();
            "
            color="green darken-1"
            text
          >
            {{ dialog.confirmText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Subscription } from "rxjs";
import { DEFAULT_TOAST_DURATION } from "@/constants";
import Notifications from "@/models/notifications";

const INITIAL_DIALOG = {
  title: "",
  content: "",
  confirmText: "Accept",
  cancelText: "Cancel",
  isActive: false,
  onConfirm: () => {},
  onCancel: () => {},
};

const INITIAL_SNACKBAR = {
  message: "",
  duration: DEFAULT_TOAST_DURATION,
  position: "center" as "center" | "left" | undefined,
  type: "default" as "default" | "success" | "error" | "info",
  isActive: false,
  isInfinite: false,
  // isPersistent: false,
};

import {
  VSnackbar,
  VDialog,
  VCard,
  VBtn,
  VCardText,
  VCardTitle,
  VCardActions,
  VSpacer,
} from "vuetify/lib";
import { IDialog, IToast } from "@/types";

@Component({
  name: "cz-notifications",
  components: {
    VSnackbar,
    VDialog,
    VCard,
    VBtn,
    VCardText,
    VCardTitle,
    VCardActions,
    VSpacer,
  },
})
export default class CzNotifications extends Vue {
  public onToast!: Subscription;
  public onOpenDialog!: Subscription;
  public snackbarColors = {
    success: { snackbar: "primary", actionButton: "primary darken-2" },
    error: { snackbar: "error darken-2", actionButton: "error darken-3" },
    info: { snackbar: "primary", actionButton: "primary darken-2" },
    default: { snackbar: undefined, actionButton: undefined },
  };
  public snackbar: IToast & { isActive: boolean; isInfinite: boolean } =
    INITIAL_SNACKBAR;
  public dialog: IDialog & { isActive: boolean } = INITIAL_DIALOG;

  async created() {
    this.onToast = Notifications.toast$.subscribe((toast: IToast) => {
      this.snackbar = { ...this.snackbar, ...toast };

      this.snackbar.isActive = true;
    });

    this.onOpenDialog = Notifications.dialog$.subscribe((dialog: IDialog) => {
      this.dialog = { ...INITIAL_DIALOG, ...dialog };
      this.dialog.isActive = true;
    });
  }

  beforeDestroy() {
    // Good practice
    this.onToast.unsubscribe();
    this.onOpenDialog.unsubscribe();
  }
}
</script>

<style lang="scss" scoped></style>
