<template>
  <v-app app>
    <v-container>
      <div class="text-h5 text-center">CZNet vue core components</div>

      <v-card class="my-4">
        <v-card-title>Notifications</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-btn class="mr-2" color="primary" @click="toast">Toast</v-btn>
          <v-btn color="primary" @click="openDialog">Open Dialog</v-btn>
        </v-card-text>
      </v-card>

      <v-card class="my-4">
        <v-card-title>CzForm</v-card-title>
        <v-divider></v-divider>
        <v-card-text
          ><v-checkbox label="Readonly" v-model="isReadonly"></v-checkbox
        ></v-card-text>
        <v-divider></v-divider>
        <v-card-text>
          <pre>{{ data }}</pre>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-text>
          <cz-form
            :schema="schema"
            :uischema="uischema"
            :isReadOnly="isReadonly"
            :errors.sync="errors"
            :data.sync="data"
            :config="config"
            ref="form"
          />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-menu :disabled="!errors.length" open-on-hover bottom left offset-y>
            <template v-slot:activator="{ on, attrs }">
              <div
                v-bind="attrs"
                v-on="on"
                class="d-flex form-controls flex-column flex-sm-row"
              >
                <v-badge
                  :value="!!errors.length"
                  bordered
                  color="error"
                  icon="mdi-exclamation-thick"
                  overlap
                >
                  <v-btn
                    color="primary"
                    depressed
                    @click="submit"
                    :disabled="isReadonly || !!errors.length"
                    >Submit</v-btn
                  >
                </v-badge>
              </div>
            </template>

            <div class="white pa-4">
              <ul
                v-for="(error, index) of errors"
                :key="index"
                class="text-subtitle-1"
              >
                <li>
                  <b>{{ error.title }}</b> {{ error.message }}.
                </li>
              </ul>
            </div>
          </v-menu>
        </v-card-actions>
      </v-card>
    </v-container>

    <cz-notifications></cz-notifications>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CzNotifications from "@/components/base/cz.notifications.vue";
import Notifications from "@/models/notifications";
import CzForm from "@/components/cz-form.vue";

const schema = require("@/schemas/schema.json");
const uischema = require("@/schemas/uischema.json");

const initialData = {};

@Component({
  name: "app",
  components: { CzNotifications, CzForm },
})
export default class App extends Vue {
  // @Ref("form") form!: InstanceType<typeof CzForm>;

  protected schema;
  protected uischema;
  protected isReadonly = false;
  protected errors = [];
  protected data = initialData;
  protected config = {
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
        dense: true,
        outlined: true,
        "persistent-hint": true,
        "hide-details": false,
      },
    },
  };

  beforeCreate() {
    this.schema = schema;
    this.uischema = uischema;
  }

  openDialog() {
    Notifications.openDialog({
      title: `Dialog Title`,
      content: "Some message for the dialog",
      onConfirm: () => {},
    });
  }

  toast() {
    Notifications.toast({ message: "Some toasty message", type: "success" });
  }

  protected submit() {
    console.log(this.data);
  }
}
</script>

<style></style>
