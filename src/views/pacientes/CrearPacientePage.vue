<script setup lang="ts">
/**
 * Registro de paciente (RF-16, RF-16.2, RF-16.3, RF-64): exige documento, nombres y Habeas Data.
 * Con la ruta /pacientes/:id/editar el mismo formulario edita un paciente existente (RF-18).
 */
import {
  IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonList,
  IonListHeader, IonLabel, IonPage, IonSelect, IonSelectOption, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { crearPaciente, editarPaciente, obtenerPaciente } from '@/api/endpoints/pacientes';
import type { Municipio, PacienteCrear } from '@/api/tipos';
import { useMensajes } from '@/composables/useMensajes';
import { useCatalogosStore } from '@/stores/catalogos';

const route = useRoute();
const router = useRouter();
const catalogos = useCatalogosStore();
const { exito, error } = useMensajes();

const idEdicion = route.params.id ? String(route.params.id) : null;
const esEdicion = idEdicion !== null;
const cargandoPaciente = ref(esEdicion);
/** En edición, si el paciente ya aceptó el tratamiento de datos, la casilla queda fija. */
const consentimientoPrevio = ref(false);
/** Al cargar el paciente no se debe borrar el municipio cuando se fija su departamento. */
let conservarMunicipio = false;

const form = ref<PacienteCrear>({
  tipo_documento: 'CC', numero_documento: '', primer_nombre: '', segundo_nombre: '', primer_apellido: '',
  segundo_apellido: '', fecha_nacimiento: '', sexo_biologico: '', telefono: '', correo_electronico: '',
  regimen_salud: 'Particular', consentimiento_habeas_data: false, departamento_residencia: null, municipio_residencia: null,
});
const municipios = ref<Municipio[]>([]);
const guardando = ref(false);
const errores = ref<Record<string, string>>({});

watch(() => form.value.departamento_residencia, async (dep) => {
  if (conservarMunicipio) conservarMunicipio = false;
  else form.value.municipio_residencia = null;
  municipios.value = dep ? await catalogos.municipios(dep) : [];
});

function validar(): boolean {
  const e: Record<string, string> = {};
  if (!form.value.numero_documento.trim()) e.numero_documento = 'Obligatorio';
  if (!form.value.primer_nombre.trim()) e.primer_nombre = 'Obligatorio';
  if (!form.value.primer_apellido.trim()) e.primer_apellido = 'Obligatorio';
  if (!form.value.fecha_nacimiento) e.fecha_nacimiento = 'Obligatoria';
  if (!form.value.sexo_biologico) e.sexo_biologico = 'Obligatorio';
  if (!esEdicion && !form.value.consentimiento_habeas_data) e.consentimiento_habeas_data = 'Debes registrar la aceptación del tratamiento de datos (Ley 1581 de 2012).';
  errores.value = e;
  return Object.keys(e).length === 0;
}

async function guardar() {
  if (!validar()) return;
  guardando.value = true;
  const datos = { ...form.value, numero_documento: form.value.numero_documento.trim() };
  try {
    if (esEdicion && idEdicion) {
      await editarPaciente(idEdicion, datos);
      await exito('Datos del paciente actualizados.');
      // Se vuelve al detalle, que recarga los datos al entrar.
      if (window.history.length > 1) router.back();
      else await router.replace(`/pacientes/${idEdicion}`);
    } else {
      const p = await crearPaciente(datos);
      await exito('Paciente registrado.');
      await router.replace(`/pacientes/${p.id}`);
    }
  } catch (e) {
    await error(e, esEdicion ? 'No se pudieron guardar los cambios.' : 'No se pudo registrar el paciente.');
  } finally {
    guardando.value = false;
  }
}

/** Carga el paciente en el formulario (modo edición). */
async function cargarPaciente(id: string) {
  const p = await obtenerPaciente(id);
  consentimientoPrevio.value = !!p.consentimiento_habeas_data;
  conservarMunicipio = p.departamento_residencia != null;
  form.value = {
    tipo_documento: p.tipo_documento, numero_documento: p.numero_documento, primer_nombre: p.primer_nombre,
    segundo_nombre: p.segundo_nombre ?? '', primer_apellido: p.primer_apellido, segundo_apellido: p.segundo_apellido ?? '',
    fecha_nacimiento: p.fecha_nacimiento, sexo_biologico: p.sexo_biologico, telefono: p.telefono ?? '',
    correo_electronico: p.correo_electronico ?? '', regimen_salud: p.regimen_salud,
    consentimiento_habeas_data: !!p.consentimiento_habeas_data,
    departamento_residencia: p.departamento_residencia ?? null, municipio_residencia: p.municipio_residencia ?? null,
  };
}

onMounted(async () => {
  try { await catalogos.cargarBasicos(); } catch (e) { await error(e, 'No se cargaron los catálogos.'); }
  if (esEdicion && idEdicion) {
    try { await cargarPaciente(idEdicion); } catch (e) { await error(e, 'No se pudo cargar el paciente.'); } finally { cargandoPaciente.value = false; }
  }
});
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button :default-href="esEdicion ? `/pacientes/${idEdicion}` : '/tabs/pacientes'" text="" /></ion-buttons>
        <ion-title>{{ esEdicion ? 'Editar paciente' : 'Nuevo paciente' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="cargandoPaciente" class="ion-padding ion-text-center"><ion-spinner /></div>
      <form v-else @submit.prevent="guardar">
        <ion-list>
          <ion-list-header><ion-label>Identificación</ion-label></ion-list-header>
          <ion-item>
            <ion-select v-model="form.tipo_documento" label="Tipo de documento" label-placement="stacked" interface="popover">
              <ion-select-option v-for="t in catalogos.tiposDocumento" :key="t.id" :value="t.codigo">{{ t.codigo }} · {{ t.descripcion }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item :class="{ 'ion-invalid': errores.numero_documento }">
            <ion-input v-model="form.numero_documento" label="Número de documento" label-placement="stacked" inputmode="numeric"
                       :error-text="errores.numero_documento" required />
          </ion-item>

          <ion-list-header><ion-label>Nombres</ion-label></ion-list-header>
          <ion-item><ion-input v-model="form.primer_nombre" label="Primer nombre" label-placement="stacked" autocapitalize="words" :error-text="errores.primer_nombre" /></ion-item>
          <ion-item><ion-input v-model="form.segundo_nombre" label="Segundo nombre" label-placement="stacked" autocapitalize="words" /></ion-item>
          <ion-item><ion-input v-model="form.primer_apellido" label="Primer apellido" label-placement="stacked" autocapitalize="words" :error-text="errores.primer_apellido" /></ion-item>
          <ion-item><ion-input v-model="form.segundo_apellido" label="Segundo apellido" label-placement="stacked" autocapitalize="words" /></ion-item>

          <ion-list-header><ion-label>Datos clínicos y de contacto</ion-label></ion-list-header>
          <ion-item><ion-input v-model="form.fecha_nacimiento" type="date" label="Fecha de nacimiento" label-placement="stacked" :error-text="errores.fecha_nacimiento" /></ion-item>
          <ion-item>
            <ion-select v-model="form.sexo_biologico" label="Sexo biológico" label-placement="stacked" interface="popover" placeholder="Seleccionar">
              <ion-select-option v-for="s in catalogos.sexos" :key="s.id" :value="s.codigo">{{ s.descripcion }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-select v-model="form.regimen_salud" label="Régimen de salud" label-placement="stacked" interface="popover">
              <ion-select-option v-for="r in ['Contributivo', 'Subsidiado', 'Vinculado', 'Particular', 'Otro']" :key="r" :value="r">{{ r }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item><ion-input v-model="form.telefono" type="tel" label="Teléfono" label-placement="stacked" /></ion-item>
          <ion-item><ion-input v-model="form.correo_electronico" type="email" label="Correo" label-placement="stacked" /></ion-item>
          <ion-item>
            <ion-select v-model="form.departamento_residencia" label="Departamento" label-placement="stacked" interface="popover" placeholder="Seleccionar">
              <ion-select-option v-for="d in catalogos.departamentos" :key="d.id" :value="d.id">{{ d.departamento }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item v-if="municipios.length">
            <ion-select v-model="form.municipio_residencia" label="Municipio" label-placement="stacked" interface="popover" placeholder="Seleccionar">
              <ion-select-option v-for="m in municipios" :key="m.id" :value="m.id">{{ m.municipio }}</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-list-header><ion-label>Habeas Data (Ley 1581 de 2012)</ion-label></ion-list-header>
          <ion-item lines="none">
            <ion-checkbox v-model="form.consentimiento_habeas_data" label-placement="end" justify="start" :disabled="esEdicion && consentimientoPrevio">
              <span class="ion-text-wrap">El paciente aceptó el tratamiento de sus datos personales y de salud.</span>
            </ion-checkbox>
          </ion-item>
          <ion-item v-if="errores.consentimiento_habeas_data" lines="none">
            <ion-label color="danger" class="ion-text-wrap"><small>{{ errores.consentimiento_habeas_data }}</small></ion-label>
          </ion-item>
        </ion-list>
        <ion-button type="submit" expand="block" class="ion-margin" :disabled="guardando">{{ esEdicion ? 'Guardar cambios' : 'Registrar paciente' }}</ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>
