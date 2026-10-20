<script setup lang="ts">
/** Cuentas y roles (RF-05, RF-05.1): crear, editar, desactivar y asignar/quitar roles. */
import {
  IonBadge, IonButton, IonChip, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonSearchbar, IonToggle,
} from '@ionic/vue';
import { closeCircle } from 'ionicons/icons';
import { onMounted, ref } from 'vue';
import {
  asignarRol, crearUsuario, desactivarUsuario, editarUsuario, listarAsignaciones, listarPermisos, listarUsuarios, quitarRol,
  type Permiso, type Usuario, type UsuarioXPermiso,
} from '@/api/endpoints/admin';
import { ETIQUETAS_ROL, type Rol } from '@/api/tipos';
import Permitido from '@/components/Permitido.vue';
import { useMensajes } from '@/composables/useMensajes';

const { exito, error, confirmar } = useMensajes();
const usuarios = ref<Usuario[]>([]);
const permisos = ref<Permiso[]>([]);
const abierto = ref<number | null>(null);
const asignaciones = ref<UsuarioXPermiso[]>([]);
const texto = ref('');
const mostrarNuevo = ref(false);
const nuevo = ref({ username: '', password: '', email: '', p_nombre: '', p_apellido: '', registro_profesional: '', numero_id: '' });
let temporizador: ReturnType<typeof setTimeout> | undefined;

async function cargar() {
  try { usuarios.value = (await listarUsuarios({ search: texto.value || undefined, limit: 50 })).results; } catch (e) { await error(e); }
}
function buscar(ev: CustomEvent) {
  clearTimeout(temporizador);
  texto.value = String((ev.target as HTMLIonSearchbarElement).value ?? '').trim();
  temporizador = setTimeout(cargar, 300);
}
async function abrir(u: Usuario) {
  abierto.value = abierto.value === u.id ? null : u.id;
  if (abierto.value) { try { asignaciones.value = await listarAsignaciones(u.id); } catch { asignaciones.value = []; } }
}
async function crear() {
  try {
    await crearUsuario(nuevo.value as never);
    mostrarNuevo.value = false;
    nuevo.value = { username: '', password: '', email: '', p_nombre: '', p_apellido: '', registro_profesional: '', numero_id: '' };
    await exito('Cuenta creada. Asigna al menos un rol para que pueda ingresar.');
    await cargar();
  } catch (e) { await error(e); }
}
async function asignar(u: Usuario, permisoId: number) {
  try { await asignarRol(u.id, permisoId); await exito('Rol asignado.'); await cargar(); asignaciones.value = await listarAsignaciones(u.id); } catch (e) { await error(e); }
}
async function quitar(u: Usuario, a: UsuarioXPermiso) {
  if (!(await confirmar('Quitar rol', `Quitar "${a.rol}" a ${u.username}. Sus sesiones se cerrarán.`, 'Quitar'))) return;
  try { await quitarRol(a.id); await cargar(); asignaciones.value = await listarAsignaciones(u.id); } catch (e) { await error(e); }
}
async function activar(u: Usuario, activo: boolean) {
  try {
    if (activo) await editarUsuario(u.id, { is_active: true });
    else { if (!(await confirmar('Desactivar cuenta', `${u.username} no podrá ingresar y sus sesiones se revocarán.`, 'Desactivar'))) { await cargar(); return; } await desactivarUsuario(u.id); }
    await cargar();
  } catch (e) { await error(e); await cargar(); }
}
async function restablecer(u: Usuario) {
  const clave = prompt(`Nueva contraseña para ${u.username} (mínimo 10 caracteres):`);
  if (!clave) return;
  try { await editarUsuario(u.id, { password: clave }); await exito('Contraseña restablecida; sus sesiones se cerraron.'); } catch (e) { await error(e); }
}
function permisosDisponibles(u: Usuario) {
  const asignados = new Set(asignaciones.value.map((a) => a.permiso));
  return permisos.value.filter((p) => !asignados.has(p.id));
}
onMounted(async () => { await cargar(); try { permisos.value = await listarPermisos(); } catch { /* sin permiso de roles */ } });
</script>

<template>
  <ion-searchbar placeholder="Usuario, nombre, documento" :debounce="0" @ionInput="buscar" />
  <ion-list>
    <Permitido accion="usuarios.gestionar">
      <ion-item lines="full"><ion-button fill="clear" @click="mostrarNuevo = !mostrarNuevo">+ Nueva cuenta</ion-button></ion-item>
      <template v-if="mostrarNuevo">
        <ion-item><ion-input v-model="nuevo.username" label="Usuario" label-placement="stacked" autocapitalize="off" /></ion-item>
        <ion-item><ion-input v-model="nuevo.password" type="password" label="Contraseña inicial (mín. 10)" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.email" type="email" label="Correo" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.p_nombre" label="Primer nombre" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.p_apellido" label="Primer apellido" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.numero_id" label="Documento" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.registro_profesional" label="Registro profesional (ReTHUS) — médico y bacteriólogo" label-placement="stacked" /></ion-item>
        <ion-button expand="block" fill="outline" class="ion-margin" @click="crear">Crear cuenta</ion-button>
      </template>
    </Permitido>

    <ion-list-header><ion-label>Cuentas</ion-label></ion-list-header>
    <template v-for="u in usuarios" :key="u.id">
      <ion-item button @click="abrir(u)">
        <ion-label class="ion-text-wrap">
          <h3>{{ u.username }} <ion-badge v-if="!u.is_active" color="medium">inactiva</ion-badge>
            <ion-chip v-for="r in (u.roles as Rol[])" :key="r" color="primary" outline>{{ ETIQUETAS_ROL[r] ?? r }}</ion-chip>
            <ion-note v-if="!(u.roles as Rol[])?.length" color="danger"> sin rol: no puede ingresar</ion-note></h3>
          <p>{{ u.nombre_completo }} · {{ u.email }}<span v-if="u.registro_profesional"> · reg. {{ u.registro_profesional }}</span></p>
        </ion-label>
      </ion-item>
      <template v-if="abierto === u.id">
        <Permitido accion="roles.gestionar">
          <ion-item lines="none">
            <ion-label>Roles</ion-label>
            <div slot="end">
              <ion-chip v-for="a in asignaciones" :key="a.id" color="primary" @click="quitar(u, a)">{{ a.rol }} <ion-icon :icon="closeCircle" /></ion-chip>
            </div>
          </ion-item>
          <ion-item lines="none" v-if="permisosDisponibles(u).length">
            <ion-label><p>Agregar:</p></ion-label>
            <div slot="end">
              <ion-chip v-for="p in permisosDisponibles(u)" :key="p.id" outline @click="asignar(u, p.id)">+ {{ p.tipo_usuario_nombre }}</ion-chip>
            </div>
          </ion-item>
        </Permitido>
        <Permitido accion="usuarios.gestionar">
          <ion-item lines="full">
            <ion-toggle :checked="!!u.is_active" @ionChange="activar(u, $event.detail.checked)">Cuenta activa</ion-toggle>
            <ion-button slot="end" size="small" fill="outline" @click="restablecer(u)">Restablecer contraseña</ion-button>
          </ion-item>
        </Permitido>
      </template>
    </template>
    <ion-item v-if="!usuarios.length" lines="none"><ion-label color="medium">Sin cuentas.</ion-label></ion-item>
  </ion-list>
</template>
