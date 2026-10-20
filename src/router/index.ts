import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { guardSesion } from './guards';

declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean;
    accion?: string | string[];
    titulo?: string;
  }
}

// Carga diferida por módulo (RNF-46): cada vista se descarga al abrirse.
const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/tabs/inicio' },
  { path: '/login', name: 'login', component: () => import('@/views/auth/LoginPage.vue'), meta: { publica: true } },
  { path: '/no-autorizado', name: 'no-autorizado', component: () => import('@/views/NoAutorizadoPage.vue') },
  { path: '/perfil', name: 'perfil', component: () => import('@/views/auth/PerfilPage.vue'), meta: { accion: 'perfil.ver' } },
  { path: '/notificaciones', name: 'notificaciones', component: () => import('@/views/notificaciones/NotificacionesPage.vue'), meta: { accion: 'notificaciones.propias' } },
  {
    path: '/tabs/',
    component: () => import('@/views/TabsPage.vue'),
    children: [
      { path: '', redirect: '/tabs/inicio' },
      { path: 'inicio', name: 'inicio', component: () => import('@/views/inicio/InicioPage.vue'), meta: { titulo: 'Inicio' } },
      { path: 'pacientes', name: 'pacientes', component: () => import('@/views/pacientes/PacientesPage.vue'), meta: { accion: 'pacientes.ver', titulo: 'Pacientes' } },
      { path: 'ordenes', name: 'ordenes', component: () => import('@/views/ordenes/OrdenesPage.vue'), meta: { accion: 'ordenes.ver', titulo: 'Órdenes' } },
      { path: 'muestras', name: 'muestras', component: () => import('@/views/muestras/MuestrasPage.vue'), meta: { accion: 'muestras.ver', titulo: 'Muestras' } },
      { path: 'resultados', name: 'resultados', component: () => import('@/views/resultados/ResultadosPage.vue'), meta: { accion: ['resultados.ver', 'examenes.ver'], titulo: 'Resultados' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/tabs/inicio' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(guardSesion);

export default router;
