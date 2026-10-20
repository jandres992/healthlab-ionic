<script setup lang="ts">
/** Equipos: estado, calibraciones, mantenimientos, token del middleware (RF-51, RF-12.1). */
import {
  IonBadge, IonButton, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonSelect, IonSelectOption, alertController,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import {
  cambiarEstadoEquipo, crearEquipo, listarCalibraciones, listarEquipos, listarMantenimientos, regenerarToken,
  registrarCalibracion, registrarMantenimiento, type Calibracion, type Equipo, type Mantenimiento,
} from '@/api/endpoints/calidad';
import Permitido from '@/components/Permitido.vue';
import { useMensajes } from '@/composables/useMensajes';

const { exito, error, confirmar, pedirTexto } = useMensajes();
const equipos = ref<Equipo[]>([]);
const abierto = ref<number | null>(null);
const calibraciones = ref<Calibracion[]>([]);
const mantenimientos = ref<Mantenimiento[]>([]);
const nuevo = ref({ nombre: '', codigo_equipo: '', tipo_conexion: 'SERIAL', puerto: '9600', protocolo: 'ASTM', host_ip: '' });
const mostrarNuevo = ref(false);

async function cargar() { try { equipos.value = await listarEquipos(); } catch (e) { await error(e); } }
async function abrir(e: Equipo) {
  abierto.value = abierto.value === e.id ? null : e.id;
  if (abierto.value) {
    try { [calibraciones.value, mantenimientos.value] = await Promise.all([listarCalibraciones(e.id), listarMantenimientos(e.id)]); } catch { calibraciones.value = []; mantenimientos.value = []; }
  }
}
async function estado(e: Equipo, nuevoEstado: string) {
  if (nuevoEstado === e.estado) return;
  const motivo = await pedirTexto(`Cambiar a ${nuevoEstado}`, 'Motivo');
  if (motivo === null) return;
  try { await cambiarEstadoEquipo(e.id, nuevoEstado, motivo); await exito('Estado actualizado.'); await cargar(); } catch (err) { await error(err); }
}
async function calibrar(e: Equipo) {
  const a = await alertController.create({
    header: 'Registrar calibración',
    inputs: [
      { name: 'fecha', type: 'date', label: 'Fecha' }, { name: 'vigente_hasta', type: 'date', label: 'Vigente hasta' },
      { name: 'realizada_por', type: 'text', placeholder: 'Realizada por' }, { name: 'certificado', type: 'text', placeholder: 'Certificado (opcional)' },
    ],
    buttons: ['Cancelar', { text: 'Guardar', role: 'confirm' }],
  });
  await a.present();
  const { role, data } = await a.onDidDismiss();
  if (role !== 'confirm') return;
  try {
    await registrarCalibracion(e.id, { ...data.values, resultado: 'conforme' });
    await exito('Calibración registrada.'); await cargar(); await abrir(e); await abrir(e);
  } catch (err) { await error(err); }
}
async function mantener(e: Equipo) {
  const a = await alertController.create({
    header: 'Registrar mantenimiento',
    inputs: [
      { name: 'fecha', type: 'date', label: 'Fecha' }, { name: 'descripcion', type: 'textarea', placeholder: 'Descripción' },
      { name: 'realizado_por', type: 'text', placeholder: 'Realizado por' }, { name: 'proximo', type: 'date', label: 'Próximo (opcional)' },
    ],
    buttons: ['Cancelar', { text: 'Preventivo', role: 'preventivo' }, { text: 'Correctivo', role: 'correctivo' }],
  });
  await a.present();
  const { role, data } = await a.onDidDismiss();
  if (role !== 'preventivo' && role !== 'correctivo') return;
  try {
    await registrarMantenimiento(e.id, { ...data.values, tipo: role, proximo: data.values.proximo || null });
    await exito('Mantenimiento registrado.'); await abrir(e); await abrir(e);
  } catch (err) { await error(err); }
}
async function token(e: Equipo) {
  if (!(await confirmar('Regenerar token', 'El token anterior deja de funcionar; el Bridge debe actualizarse. Se mostrará una sola vez.', 'Regenerar'))) return;
  try {
    const t = await regenerarToken(e.id);
    const a = await alertController.create({ header: 'Token del middleware', message: t, buttons: ['Copiado, cerrar'] });
    await a.present();
  } catch (err) { await error(err); }
}
async function guardarNuevo() {
  try { await crearEquipo(nuevo.value as never); mostrarNuevo.value = false; await exito('Equipo creado.'); await cargar(); } catch (err) { await error(err); }
}
function colorEstado(s?: string) { return s === 'operativo' ? 'success' : s === 'mantenimiento' ? 'warning' : 'danger'; }
onMounted(cargar);
</script>

<template>
  <ion-list>
    <Permitido accion="equipos.gestionar">
      <ion-item lines="full"><ion-button fill="clear" @click="mostrarNuevo = !mostrarNuevo">+ Nuevo equipo</ion-button></ion-item>
      <template v-if="mostrarNuevo">
        <ion-item><ion-input v-model="nuevo.nombre" label="Nombre" label-placement="stacked" placeholder="Analizador de orina URIT-500C" /></ion-item>
        <ion-item><ion-input v-model="nuevo.codigo_equipo" label="Código (lo usa el Bridge como equipo_origen)" label-placement="stacked" placeholder="URIT500C-LAB1" /></ion-item>
        <ion-item>
          <ion-select v-model="nuevo.tipo_conexion" label="Conexión" label-placement="stacked" interface="popover">
            <ion-select-option value="SERIAL">Serial RS-232/USB</ion-select-option><ion-select-option value="TCP">Red TCP/IP</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item><ion-input v-model="nuevo.puerto" label="Baudios (serial) o puerto TCP" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.host_ip" label="IP (solo TCP)" label-placement="stacked" /></ion-item>
        <ion-item>
          <ion-select v-model="nuevo.protocolo" label="Protocolo" label-placement="stacked" interface="popover">
            <ion-select-option value="HL7">HL7 v2.x</ion-select-option><ion-select-option value="ASTM">ASTM</ion-select-option>
            <ion-select-option value="CSV">Texto / CSV</ion-select-option><ion-select-option value="JSON">JSON</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-button expand="block" fill="outline" class="ion-margin" @click="guardarNuevo">Guardar equipo</ion-button>
      </template>
    </Permitido>

    <template v-for="e in equipos" :key="e.id">
      <ion-item button @click="abrir(e)">
        <ion-label class="ion-text-wrap">
          <h3>{{ e.nombre }} <ion-badge :color="colorEstado(e.estado)">{{ e.estado }}</ion-badge></h3>
          <p>{{ e.codigo_equipo }} · {{ e.tipo_conexion }} {{ e.puerto }} · {{ e.protocolo }}</p>
          <p>Calibración vigente hasta {{ e.calibracion_vigente_hasta ?? '—' }} · último latido {{ e.ultimo_latido ? new Date(e.ultimo_latido).toLocaleString('es-CO') : 'sin señal' }}</p>
        </ion-label>
      </ion-item>
      <template v-if="abierto === e.id">
        <Permitido accion="equipos.mantenimiento">
          <ion-item lines="none">
            <ion-select :value="e.estado" label="Estado" interface="popover" @ionChange="estado(e, String($event.detail.value))">
              <ion-select-option value="operativo">Operativo</ion-select-option>
              <ion-select-option value="mantenimiento">En mantenimiento</ion-select-option>
              <ion-select-option value="fuera_servicio">Fuera de servicio</ion-select-option>
            </ion-select>
            <ion-button slot="end" size="small" fill="outline" @click="calibrar(e)">+ Calibración</ion-button>
            <ion-button slot="end" size="small" fill="outline" @click="mantener(e)">+ Mantenimiento</ion-button>
          </ion-item>
        </Permitido>
        <Permitido accion="equipos.regenerar_token">
          <ion-item lines="none"><ion-button size="small" fill="clear" @click="token(e)">Regenerar token del middleware</ion-button></ion-item>
        </Permitido>
        <ion-list-header><ion-label>Calibraciones</ion-label></ion-list-header>
        <ion-item v-for="c in calibraciones" :key="c.id"><ion-label><p>{{ c.fecha }} → {{ c.vigente_hasta }} · {{ c.resultado }} · {{ c.realizada_por }}<ion-note v-if="c.certificado"> · {{ c.certificado }}</ion-note></p></ion-label></ion-item>
        <ion-item v-if="!calibraciones.length" lines="none"><ion-label color="medium"><p>Sin calibraciones.</p></ion-label></ion-item>
        <ion-list-header><ion-label>Mantenimientos</ion-label></ion-list-header>
        <ion-item v-for="m in mantenimientos" :key="m.id"><ion-label class="ion-text-wrap"><p>{{ m.fecha }} · {{ m.tipo }} · {{ m.descripcion }} · {{ m.realizado_por }}<ion-note v-if="m.proximo"> · próximo {{ m.proximo }}</ion-note></p></ion-label></ion-item>
        <ion-item v-if="!mantenimientos.length" lines="full"><ion-label color="medium"><p>Sin mantenimientos.</p></ion-label></ion-item>
      </template>
    </template>
  </ion-list>
</template>
