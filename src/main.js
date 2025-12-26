import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import { initAuth, setupAuthListener } from "./composables/useAuth";

const app = createApp(App);

// Configure PrimeVue theme
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false,
      cssLayer: false,
    },
  },
});

// Add Toast service
app.use(ToastService);

// Register Tooltip directive
app.directive("tooltip", Tooltip);

app.use(router);

// Initialize auth
initAuth().then(() => {
  setupAuthListener(router);
  app.mount("#app");
});
