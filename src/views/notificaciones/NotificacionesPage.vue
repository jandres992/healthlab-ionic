<script setup lang="ts">
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage,
  IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { listarNotificaciones, marcarLeida, marcarTodasLeidas } from '@/api/endpoints/notificaciones';
import type { Notificacion } from '@/api/tipos';
import EstadoLista from '@/components/EstadoLista.vue';

// Copia local mutable: `leida` es de solo lectura en el contrato, pero aquí se actualiza de forma optimista.
type NotificacionLocal = Omit<Notificacion, 'leida'> & { leida: boolean };
const items = ref<NotificacionLocal[]>([]);
const cargando = ref(false);
const error = ref<unknown>(null);

async function cargar() {
  cargando.value = true; error.value = null;
  try { items.value = (await listarNotificaciones(false, 100)).results.map((n) => ({ ...n })); } catch (e) { error.value = e; } finally { cargando.value = false; }
}
async function leer(n: NotificacionLocal) {
  if (n.leida) return;
  // Respuesta optimista: es reversible y sin efecto clínico (RNF-47).
  n.leida = true;
  try { await marcarLeida(n.id); } catch { n.leida = false; }
}
async function leerTodas() {
  try { await marcarTodasLeidas(); items.value.forEach((n) => { n.leida = true; }); } catch { await cargar(); }
}
function fecha(iso: string) { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }); }
const COLOR: Record<string, string> = { alerta_critica: 'danger', muestra_rechazada: 'warning', examen_rechazado: 'warning', orden_finalizada: 'success', resultados_parciales: 'primary' };

onMounted(cargar);
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/inicio" text="" /></ion-buttons>
        <ion-title>Notificaciones</ion-title>
        <ion-buttons slot="end"><ion-button @click="leerTodas">Leer todas</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="cargando" :error="error" :vacio="!items.length" texto-vacio="Sin notificaciones." @reintentar="cargar" />
      <ion-list v-if="items.length">
        <ion-item v-for="n in items" :key="n.id" button :color="n.leida ? undefined : 'light'" @click="leer(n)">
          <ion-label class="ion-text-wrap">
            <h3><ion-note :color="COLOR[n.tipo] ?? 'medium'">{{ n.tipo.replace(/_/g, ' ') }}</ion-note></h3>
            <p>{{ n.mensaje }}</p>
            <p><small>{{ fecha(n.fecha_creacion) }}<span v-if="n.orden_numero"> · {{ n.orden_numero }}</span></small></p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
