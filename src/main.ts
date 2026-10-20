import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { IonicVue } from '@ionic/vue';

import App from './App.vue';
import router from './router';
import { conectarSesionHttp } from './stores/auth';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';
/* Modo oscuro según el sistema (RF-48) */
import '@ionic/vue/css/palettes/dark.system.css';
import './theme/variables.css';

const pinia = createPinia();
const app = createApp(App).use(pinia).use(IonicVue, { mode: 'md' }).use(router);

conectarSesionHttp();

router.isReady().then(() => {
  app.mount('#app');
});
