import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import VueGAPI from "vue-gapi";

Vue.config.productionTip = false;

const apiConfig = {
  apiKey: process.env.VUE_APP_API_KEY,
  clientId: process.env.VUE_APP_CLIENT_ID,
  discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  scope: "https://www.googleapis.com/auth/spreadsheets"
};

Vue.use(VueGAPI, apiConfig);

new Vue({
  render: h => h(App)
}).$mount("#app");
