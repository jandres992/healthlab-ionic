<script setup lang="ts">
/** Creación de orden con varios CUPS en una sola petición (RF-20, RNF-29.1). */
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList,
  IonListHeader, IonPage, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { crearOrden } from '@/api/endpoints/ordenes';
import { listarPacientes } from '@/api/endpoints/pacientes';
import type { CatalogoCups, Paciente } from '@/api/tipos';
import SelectorBusqueda from '@/components/SelectorBusqueda.vue';
import { useMensajes } from '@/composables/useMensajes';
import { useCatalogosStore } from '@/stores/catalogos';

const route = useRoute();
const router = useRouter();
const catalogos = useCatalogosStore();
const { exito, error } = useMensajes();

const pacientes = ref<Paciente[]>([]);
const pacienteSel = ref<Array<string | number>>(route.query.paciente ? [String(route.query.paciente)] : []);
const cupsSel = ref<Array<string | number>>([]);
const cups = ref<CatalogoCups[]>([]);
const observaciones = ref('');
const cie10 = ref('');
const entidad = ref('');
const convenio = ref('');
const finalidad = ref('No Aplica');
const causa = ref('Enfermedad general');
const tipoDx = ref('Impresion diagnostica');
const guardando = ref(false);

const FINALIDADES = ['No Aplica', 'Atencion Parto', 'Atencion Recien Nacido', 'Atencion Planificacion Familiar',
  'Deteccion Alteraciones Crecimiento', 'Deteccion Alteraciones Joven', 'Deteccion Alteraciones Embarazo',
  'Deteccion Alteraciones Adulto', 'Deteccion Alteraciones Agudeza Visual', 'Deteccion Enfermedad Profesional'];
const CAUSAS = ['Enfermedad general', 'Enfermedad profesional', 'Accidente de trabajo', 'Accidente de transito',
  'Accidente rabico', 'Accidente ofidico', 'Otro tipo de accidente', 'Evento catastrofico', 'Lesion por agresion',
  'Lesion auto infligida', 'Sospecha maltrato fisico', 'Sospecha abuso sexual', 'Sospecha violencia sexual',
  'Sospecha maltrato emocional', 'Otra'];
const TIPOS_DX = ['Impresion diagnostica', 'Confirmado nuevo', 'Confirmado repetido'];

async function buscarPacientes(texto: string) {
  return (await listarPacientes({ search: texto, limit: 20 })).results;
}

async function guardar() {
  if (!pacienteSel.value.length) return error(new Error('Selecciona un paciente.'));
  if (!cupsSel.value.length) return error(new Error('Selecciona al menos un examen (CUPS).'));
  guardando.value = true;
  try {
    const orden = await crearOrden({
      paciente: String(pacienteSel.value[0]),
      examenes: cupsSel.value.map(String),
      observaciones_clinicas: observaciones.value || null,
      codigo_cie10: cie10.value.trim().toUpperCase() || null,
      entidad_remitente: entidad.value || null,
      convenio: convenio.value || null,
      finalidad_consulta: finalidad.value as never,
      causa_externa: causa.value as never,
      tipo_diagnostico: tipoDx.value as never,
    });
    await exito(`Orden ${orden.numero_orden} creada.`);
    await router.replace(`/ordenes/${orden.id}`);
  } catch (e) {
    await error(e, 'No se pudo crear la orden.');
  } finally {
    guardando.value = false;
  }
}

onMounted(async () => {
  try {
    const [p, c] = await Promise.all([listarPacientes({ limit: 20 }), catalogos.cargarCups()]);
    pacientes.value = p.results;
    cups.value = c;
    if (route.query.paciente && !pacientes.value.some((x) => x.id === route.query.paciente)) {
      const { obtenerPaciente } = await import('@/api/endpoints/pacientes');
      pacientes.value.unshift(await obtenerPaciente(String(route.query.paciente)));
    }
  } catch (e) { await error(e, 'No se cargaron los catálogos.'); }
});
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/ordenes" text="" /></ion-buttons>
        <ion-title>Nueva orden</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-list-header><ion-label>Paciente y exámenes</ion-label></ion-list-header>
        <SelectorBusqueda v-model="pacienteSel" titulo="Paciente" :items="pacientes" :buscar-remoto="buscarPacientes"
                          :etiqueta="(p) => p.nombre_completo ?? ''" :detalle="(p) => `${p.tipo_documento} ${p.numero_documento}`" />
        <SelectorBusqueda v-model="cupsSel" titulo="Exámenes (CUPS)" :items="cups" multiple
                          :etiqueta="(c) => c.descripcion" :detalle="(c) => c.codigo_cups" />

        <ion-list-header><ion-label>Datos clínicos (RIPS)</ion-label></ion-list-header>
        <ion-item><ion-input v-model="cie10" label="Diagnóstico CIE-10" label-placement="stacked" placeholder="E11.9" autocapitalize="characters" /></ion-item>
        <ion-item><ion-textarea v-model="observaciones" label="Observaciones clínicas" label-placement="stacked" auto-grow placeholder="Escribe 'urgente' para marcar STAT" /></ion-item>
        <ion-item><ion-input v-model="entidad" label="Entidad remitente" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="convenio" label="Convenio / EPS" label-placement="stacked" /></ion-item>
        <ion-item>
          <ion-select v-model="finalidad" label="Finalidad de la consulta" label-placement="stacked" interface="popover">
            <ion-select-option v-for="f in FINALIDADES" :key="f" :value="f">{{ f }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select v-model="causa" label="Causa externa" label-placement="stacked" interface="popover">
            <ion-select-option v-for="c in CAUSAS" :key="c" :value="c">{{ c }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select v-model="tipoDx" label="Tipo de diagnóstico" label-placement="stacked" interface="popover">
            <ion-select-option v-for="t in TIPOS_DX" :key="t" :value="t">{{ t }}</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>
      <ion-button expand="block" class="ion-margin" :disabled="guardando" @click="guardar">Crear orden</ion-button>
    </ion-content>
  </ion-page>
</template>
