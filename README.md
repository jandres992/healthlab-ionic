# HealthLab — Cliente web y móvil (Ionic + Vue + Capacitor)

Una sola base de código para la PWA de escritorio (puesto del bacteriólogo), la PWA móvil y las
apps Android/iOS (§16.16 del documento de requerimientos).

## Principios

- **El backend manda.** La interfaz muestra una acción solo si viene en `acciones[]` del login o
  de `/usr/me/` (`usePermisos().puede('ordenes.finalizar')`, `<Permitido accion="…">`). No hay
  listas de permisos por rol en el cliente (RF-44.1).
- **Contrato primero.** Los tipos de `src/api/generated/` se generan desde el esquema OpenAPI del
  backend con `npm run api:types`; no se escriben tipos de entidades a mano.
- **Las vistas no llaman a Axios.** Pasan por `src/api/endpoints/*`, que usan el cliente de
  `src/api/http.ts` (JWT, renovación ante 401, errores `{estado, mensaje, errores}`,
  `Idempotency-Key`).
- **Sin reglas clínicas en el cliente.** Banderas, estados y cierres los calcula el backend.

## Desarrollo

```bash
npm install
npm run dev            # http://localhost:5173 (o --port 8100)
npm run typecheck      # vue-tsc
npm run test:unit      # vitest
npm run build          # dist/ (lo envuelve Capacitor)
npm run api:types      # regenerar tipos desde ../HealthLab
```

`VITE_API_URL` se define en `.env.development` / `.env.production`. En un teléfono físico usa la
IP del PC en la red local.

### Android / iOS

```bash
npx cap add android    # una vez
npm run build && npx cap sync && npx cap open android
```

## Estructura

```
src/
├── api/
│   ├── generated/      schema.yaml + schema.d.ts (generados, no editar)
│   ├── http.ts         cliente Axios con interceptores
│   ├── tipos.ts        alias de los tipos generados + RespuestaLogin
│   └── endpoints/      auth, catalogos, pacientes, ordenes, muestras, resultados, notificaciones
├── stores/auth.ts      sesión, roles y acciones (Pinia); tokens en almacenamiento seguro
├── router/             rutas con carga diferida y guards por acción
├── composables/        usePermisos, useMensajes, useListaPaginada, useEscaner
├── components/         Permitido, EstadoLista, EstadoBadge, SelectorBusqueda, CampoCodigoBarras, ColaOfflineBanner,
│                       ValorResultado, FormularioAcuse
├── services/           almacenamientoSeguro (Keychain/Keystore o Preferences), colaOffline (RN-26)
└── views/              auth, inicio, pacientes, ordenes, muestras, resultados, notificaciones
```

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 3 | Cliente generado, http, sesión segura, login, perfil, guards, pestañas, listados | ✔ |
| 4 | Crear paciente, crear orden con varios CUPS, detalle de orden (admitir, anular, informe), registrar muestra con escáner y checklist, detalle de muestra con cadena de custodia (recibir, rechazar, alícuota, descarte, eventos), cola offline para toma y admisión con conflictos | ✔ |
| 5 | Bandeja de validación, detalle de examen con resultados y banderas, ingreso manual, estado del CCI y política al validar (justificación o bloqueo), rechazar/anular, lecturas de analizadores y procesamiento, críticos con acuse (read-back) y escalado visible, finalizar orden con detalle del 409, informes emitidos con hash | ✔ |
| 6 | Calidad, auditoría, administración web | pendiente |
