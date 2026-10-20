<script setup lang="ts">
/** Bitácora de auditoría (RNF-25) y exportación RIPS (RF-42). */
import {
  IonButton, IonButtons, IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonInput, IonItem, IonLabel,
  IonList, IonListHeader, IonMenuButton, IonNote, IonPage, IonSearchbar, IonSegment, IonSegmentButton, IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { exportarRips, listarAuditoria, type FiltroAuditoria, type RegistroAuditoria } from '@/api/endpoints/auditoria';
import EstadoLista from '@/components/EstadoLista.vue';
import { useListaPaginada } from '@/composables/useListaPaginada';
import { useMensajes } from '@/composables/useMensajes';
import { usePermisos } from '@/composables/usePermisos';

const { puede } = usePermisos();
const { error, exito } = useMensajes();
const panel = ref(puede('auditoria.ver') ? 'bitacora' : 'rips');
const lista = useListaPaginada<RegistroAuditoria, FiltroAuditoria>(listarAuditoria, {}, 50);
const prefijo = ref('');
const texto = ref('');
const desde = ref('');
const hasta = ref('');
let temporizador: ReturnType<typeof setTimeout> | undefined;

function recargar() {
  lista.cargar({ search: texto.value || undefined, accion__startswith: prefijo.value || undefined });
}
function buscar(ev: CustomEvent) {
  clearTimeout(temporizador);
  texto.value = String((ev.target as HTMLIonSearchbarElement).value ?? '').trim();
  temporizador = setTimeout(recargar, 300);
}
async function masItems(ev: CustomEvent) { await lista.siguiente(); (ev.target as HTMLIonInfiniteScrollElement).complete(); }

async function descargarRips() {
  try {
    const blob = await exportarRips(desde.value || undefined, hasta.value || undefined);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rips_laboratorio_${desde.value || 'inicio'}_${hasta.value || 'hoy'}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    await exito('RIPS exportado.');
  } catch (e) { await error(e); }
}
function fecha(iso: string) { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' }); }
onMounted(() => { if (puede('auditoria.ver')) recargar(); });
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Auditoría y RIPS</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="panel">
          <ion-segment-button v-if="puede('auditoria.ver')" value="bitacora">Bitácora</ion-segment-button>
          <ion-segment-button v-if="puede('ordenes.export_rips')" value="rips">RIPS</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
      <ion-toolbar v-if="panel === 'bitacora'">
        <ion-searchbar placeholder="Usuario, acción, id o IP" :debounce="0" @ionInput="buscar" />
      </ion-toolbar>
      <ion-toolbar v-if="panel === 'bitacora'">
        <ion-segment v-model="prefijo" scrollable @ionChange="recargar">
          <ion-segment-button value="">Todo</ion-segment-button>
          <ion-segment-button value="login">Accesos</ion-segment-button>
          <ion-segment-button value="usuario">Cuentas</ion-segment-button>
          <ion-segment-button value="rol">Roles</ion-segment-button>
          <ion-segment-button value="paciente">Pacientes</ion-segment-button>
          <ion-segment-button value="examen">Exámenes</ion-segment-button>
          <ion-segment-button value="orden">Órdenes</ion-segment-button>
          <ion-segment-button value="cci">CCI</ion-segment-button>
          <ion-segment-button value="critico">Críticos</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <template v-if="panel === 'bitacora'">
        <EstadoLista :cargando="lista.cargando.value" :error="lista.error.value" :vacio="!lista.items.value.length" texto-vacio="Sin registros." @reintentar="recargar" />
        <ion-list v-if="lista.items.value.length">
          <ion-item v-for="r in lista.items.value" :key="r.id">
            <ion-label class="ion-text-wrap">
              <h3>{{ r.accion }} <ion-note :color="r.exito ? 'success' : 'danger'">{{ r.exito ? 'ok' : 'fallo' }}</ion-note></h3>
              <p>{{ fecha(r.fecha) }} · {{ r.username || '—' }} <span v-if="(r.roles as string[])?.length">({{ (r.roles as string[]).join(', ') }})</span> · {{ r.ip ?? '' }}</p>
              <p v-if="r.entidad">{{ r.entidad }} {{ r.entidad_id }}</p>
              <p v-if="r.detalle && Object.keys(r.detalle as object).length"><ion-note><code>{{ JSON.stringify(r.detalle) }}</code></ion-note></p>
            </ion-label>
          </ion-item>
        </ion-list>
        <ion-infinite-scroll :disabled="!lista.hayMas.value" @ionInfinite="masItems"><ion-infinite-scroll-content /></ion-infinite-scroll>
      </template>
      <ion-list v-else>
        <ion-list-header><ion-label>Exportar RIPS (órdenes finalizadas)</ion-label></ion-list-header>
        <ion-item><ion-input v-model="desde" type="date" label="Desde" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="hasta" type="date" label="Hasta" label-placement="stacked" /></ion-item>
        <ion-button expand="block" class="ion-margin" @click="descargarRips">Descargar CSV</ion-button>
        <ion-item lines="none"><ion-note class="ion-text-wrap">Formato simplificado (una fila por examen). El formato oficial RIPS vigente queda pendiente (B-15).</ion-note></ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
