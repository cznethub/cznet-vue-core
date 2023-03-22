<template>
  <v-app app>
    CZNet vue core components
    <cz-notifications />
  </v-app>
</template>

<script>
import { Component, Vue } from "vue-property-decorator";
import CzNotifications from "@/components/base/cz.notifications.vue";
import Notifications from "@/models/notifications";

@Component({
  name: "app",
  components: { CzNotifications },
})
export default class App extends Vue {
  created() {
    setTimeout(() => {
      Notifications.openDialog({
        title: `Testing....`,
        content: 'error',
        onConfirm: () => {}
      })
    }, 400)
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
