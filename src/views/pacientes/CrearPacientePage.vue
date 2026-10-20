<script setup lang="ts">
/** Registro de paciente (RF-16, RF-16.2, RF-16.3, RF-64): exige documento, nombres y Habeas Data. */
import {
  IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonList,
  IonListHeader, IonLabel, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { crearPaciente } from '@/api/endpoints/pacientes';
import type { Municipio, PacienteCrear } from '@/api/tipos';
import { useMensajes } from '@/composables/useMensajes';
import { useCatalogosStore } from '@/stores/catalogos';

const router = useRouter();
const catalogos = useCatalogosStore();
const { exito, error } = useMensajes();

const form = ref<PacienteCrear>({
  tipo_documento: 'CC', numero_documento: '', primer_nombre: '', segundo_nombre: '', primer_apellido: '',
  segundo_apellido: '', fecha_nacimiento: '', sexo_biologico: '', telefono: '', correo_electronico: '',
  regimen_salud: 'Particular', consentimiento_habeas_data: false, departamento_residencia: null, municipio_residencia: null,
});
const municipios = ref<Municipio[]>([]);
const guardando = ref(false);
const errores = ref<Record<string, string>>({});

watch(() => form.value.departamento_residencia, async (dep) => {
  form.value.municipio_residencia = null;
  municipios.value = dep ? await catalogos.municipios(dep) : [];
});

function validar(): boolean {
  const e: Record<string, string> = {};
  if (!form.value.numero_documento.trim()) e.numero_documento = 'Obligatorio';
  if (!form.value.primer_nombre.trim()) e.primer_nombre = 'Obligatorio';
  if (!form.value.primer_apellido.trim()) e.primer_apellido = 'Obligatorio';
  if (!form.value.fecha_nacimiento) e.fecha_nacimiento = 'Obligatoria';
  if (!form.value.sexo_biologico) e.sexo_biologico = 'Obligatorio';
  if (!form.value.consentimiento_habeas_data) e.consentimiento_habeas_data = 'Debes registrar la aceptación del tratamiento de datos (Ley 1581 de 2012).';
  errores.value = e;
  return Object.keys(e).length === 0;
}

async function guardar() {
  if (!validar()) return;
  guardando.value = true;
  try {
    const p = await crearPaciente({ ...form.value, numero_documento: form.value.numero_documento.trim() });
    await exito('Paciente registrado.');
    await router.replace(`/pacientes/${p.id}`);
  } catch (e) {
    await error(e, 'No se pudo registrar el paciente.');
  } finally {
    guardando.value = false;
  }
}

onMounted(async () => {
  try { await catalogos.cargarBasicos(); } catch (e) { await error(e, 'No se cargaron los catálogos.'); }
});
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/pacientes" text="" /></ion-buttons>
        <ion-title>Nuevo paciente</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="guardar">
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
            <ion-checkbox v-model="form.consentimiento_habeas_data" label-placement="end" justify="start">
              <span class="ion-text-wrap">El paciente aceptó el tratamiento de sus datos personales y de salud.</span>
            </ion-checkbox>
          </ion-item>
          <ion-item v-if="errores.consentimiento_habeas_data" lines="none">
            <ion-label color="danger" class="ion-text-wrap"><small>{{ errores.consentimiento_habeas_data }}</small></ion-label>
          </ion-item>
        </ion-list>
        <ion-button type="submit" expand="block" class="ion-margin" :disabled="guardando">Registrar paciente</ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>
