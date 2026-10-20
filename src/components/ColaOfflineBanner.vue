<script setup lang="ts">
/** Estado de la cola offline: sin conexión, pendientes por sincronizar y conflictos (RF-47). */
import { IonButton, IonIcon, IonItem, IonLabel, IonList, IonNote } from '@ionic/vue';
import { cloudOfflineOutline, cloudUploadOutline, warningOutline } from 'ionicons/icons';
import { onMounted } from 'vue';
import { useMensajes } from '@/composables/useMensajes';
import { useColaOfflineStore } from '@/stores/colaOffline';

const cola = useColaOfflineStore();
const { exito } = useMensajes();

async function sincronizar() {
  const r = await cola.sincronizar();
  if (r) await exito(`Sincronización: ${r.enviadas} enviadas, ${r.pendientes} pendientes, ${r.conflictos} conflictos.`);
}
onMounted(() => cola.iniciar());
</script>

<template>
  <div v-if="!cola.conectado || cola.pendientes.length || cola.conflictos.length" class="banner">
    <ion-item v-if="!cola.conectado" color="warning" lines="none">
      <ion-icon slot="start" :icon="cloudOfflineOutline" />
      <ion-label class="ion-text-wrap">Sin conexión. Solo puedes registrar tomas y admisiones; se enviarán al volver la red.</ion-label>
    </ion-item>
    <ion-item v-if="cola.pendientes.length" lines="none">
      <ion-icon slot="start" :icon="cloudUploadOutline" color="primary" />
      <ion-label>{{ cola.pendientes.length }} operación(es) por sincronizar</ion-label>
      <ion-button slot="end" size="small" :disabled="!cola.conectado || cola.sincronizando" @click="sincronizar">Sincronizar</ion-button>
    </ion-item>
    <ion-list v-if="cola.conflictos.length" lines="full">
      <ion-item v-for="c in cola.conflictos" :key="c.id" color="light">
        <ion-icon slot="start" :icon="warningOutline" color="danger" />
        <ion-label class="ion-text-wrap">
          <h3>{{ c.descripcion }}</h3>
          <p>El servidor la rechazó: {{ c.mensaje }}</p>
          <ion-note>{{ new Date(c.creadoEn).toLocaleString('es-CO') }}</ion-note>
        </ion-label>
        <ion-button slot="end" size="small" fill="outline" @click="cola.reintentar(c.id)">Reintentar</ion-button>
        <ion-button slot="end" size="small" fill="clear" color="danger" @click="cola.descartar(c.id)">Descartar</ion-button>
      </ion-item>
    </ion-list>
  </div>
</template>

<style scoped>
.banner { margin-bottom: 8px; }
</style>
