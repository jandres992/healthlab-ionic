import { conIdempotencia, datos, http, lista, type Paginado } from '../http';
import type { Esquemas, Paciente } from '../tipos';

export interface FiltroPacientes { search?: string; limit?: number; offset?: number; incluir_inactivos?: boolean }

export async function listarPacientes(f: FiltroPacientes = {}): Promise<Paginado<Paciente>> {
  const { data } = await http.get('/api/v1/pacientes/', { params: { limit: 20, ...f } });
  return lista<Paciente>(data);
}

export async function obtenerPaciente(id: string): Promise<Paciente> {
  const { data } = await http.get(`/api/v1/pacientes/${id}/`);
  return datos<Paciente>(data);
}

export async function crearPaciente(cuerpo: Esquemas['PacienteRequest']): Promise<Paciente> {
  const { data } = await http.post('/api/v1/pacientes/', cuerpo, conIdempotencia());
  return datos<Paciente>(data);
}

export async function editarPaciente(id: string, cambios: Esquemas['PatchedPacienteRequest']): Promise<Paciente> {
  const { data } = await http.patch(`/api/v1/pacientes/${id}/`, cambios);
  return datos<Paciente>(data);
}

export async function desactivarPaciente(id: string): Promise<void> {
  await http.delete(`/api/v1/pacientes/${id}/`);
}
