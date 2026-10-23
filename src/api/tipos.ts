/**
 * Alias de los tipos generados desde el esquema OpenAPI del backend
 * (`npm run api:types`). No se escriben tipos de entidades a mano.
 */
import type { components } from './generated/schema';

export type Esquemas = components['schemas'];

export type PerfilPropio = Esquemas['PerfilPropio'];
export type Paciente = Esquemas['Paciente'];
export type Orden = Esquemas['OrdenLaboratorio'];
export type OrdenCrear = Esquemas['OrdenCrearRequest'];
export type Examen = Esquemas['ExamenSolicitado'];
export type Muestra = Esquemas['MuestraFisica'];
export type MuestraCrear = Esquemas['MuestraCrearRequest'];
export type Resultado = Esquemas['ResultadoAnalito'];
export type ResultadoRegistrar = Esquemas['ResultadoRegistrarRequest'];
export type Notificacion = Esquemas['Notificacion'];
export type CatalogoCups = Esquemas['CatalogoCups'];
export type TipoDocumento = Esquemas['TipoDocumentoPaciente'];
export type SexoBiologico = Esquemas['SexoBiologico'];
export type Parametro = Esquemas['ParametroExamen'];
export type Informe = Esquemas['InformeResultados'];
export type Departamento = Esquemas['Departamento'];
export type Municipio = Esquemas['Municipio'];
export type EventoMuestra = Esquemas['EventoMuestra'];
export type PacienteCrear = Esquemas['PacienteRequest'];
export type Indicadores = Esquemas['Indicadores'];

/** Respuesta de POST /usr/login/ (campos añadidos por TokenPersonalizadoSerializer). */
export interface RespuestaLogin {
  access: string;
  refresh: string;
  rol: string;
  roles: Rol[];
  roles_etiquetas: string[];
  acciones: string[];
  user: {
    id: number;
    username: string;
    p_nombre: string;
    p_apellido: string;
    nombre_completo: string;
    email: string;
    registro_profesional: string | null;
  };
}

export type Rol = 'medico' | 'tecnico_de_enfermeria' | 'bacteriologo' | 'auditor' | 'administrador';

export const ETIQUETAS_ROL: Record<Rol, string> = {
  medico: 'Médico',
  tecnico_de_enfermeria: 'Técnico de Enfermería',
  bacteriologo: 'Bacteriólogo',
  auditor: 'Auditor',
  administrador: 'Administrador',
};
