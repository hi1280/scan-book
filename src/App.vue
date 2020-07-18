<template>
  <div id="app">
    <button v-if="!isLogin" v-on:click="login">Login</button>
    <button v-if="isLogin" v-on:click="logout">Logout</button>
    <scan v-if="isLogin"></scan>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Scan from "./components/Scan.vue";

@Component({
  components: {
    Scan
  }
})
export default class App extends Vue {
  $gapi: any;
  isLogin: boolean | null = null;

  login() {
    this.$gapi.login();
  }

  logout() {
    localStorage.removeItem("scan-book.spreadsheetId");
    this.$gapi.logout();
  }

  async created() {
    const gapi = await this.$gapi.getGapiClient();
    this.isLogin = gapi.auth2.getAuthInstance().isSignedIn.get();
    gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus);
  }

  updateSigninStatus(isSignedIn: boolean) {
    this.isLogin = isSignedIn;
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
  margin-top: 30px;
  font-size: 20px;
}

button {
  width: 100px;
  height: 60px;
  font-size: 20px;
}
</style>
