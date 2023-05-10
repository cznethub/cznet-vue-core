<template>
  <v-app app>
    <div class="text-center">CZNet vue core components</div>
    <submission-form
      :schema="schema"
      :uischema="uischema"
      :schemaDefaults="schemaDefaults"
    />
    <cz-notifications />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CzNotifications from "@/components/base/cz.notifications.vue";
import Notifications from "@/models/notifications";
import SubmissionForm from "@/components/new-submission/submission-form.vue";

const schema = require("@/schemas/schema.json");
const uischema = require("@/schemas/uischema.json");
const schemaDefaults = require("@/schemas/uischema.json");

@Component({
  name: "app",
  components: { CzNotifications, SubmissionForm },
})
export default class App extends Vue {
  protected schema;
  protected uischema;
  protected schemaDefaults;

  created() {
    this.schema = schema;
    this.uischema = uischema;
    this.schemaDefaults = schemaDefaults;
  }
  mounted() {
    // Notifications.openDialog({
    //   title: `Testing....`,
    //   content: "error",
    //   onConfirm: () => {},
    // });
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
