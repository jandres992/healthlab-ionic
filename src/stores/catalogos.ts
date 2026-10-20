/** Catálogos en caché (RNF-43): se cargan una vez por sesión y se refrescan a demanda. */
import { defineStore } from 'pinia';
import * as cat from '@/api/endpoints/catalogos';
import type { CatalogoCups, Departamento, Municipio, SexoBiologico, TipoDocumento } from '@/api/tipos';

interface Estado {
  cups: CatalogoCups[];
  tiposDocumento: TipoDocumento[];
  sexos: SexoBiologico[];
  departamentos: Departamento[];
  municipiosPorDepartamento: Record<number, Municipio[]>;
  cargado: boolean;
}

export const useCatalogosStore = defineStore('catalogos', {
  state: (): Estado => ({ cups: [], tiposDocumento: [], sexos: [], departamentos: [], municipiosPorDepartamento: {}, cargado: false }),

  actions: {
    async cargarBasicos(forzar = false) {
      if (this.cargado && !forzar) return;
      const [tipos, sexos, deptos] = await Promise.all([cat.listarTiposDocumento(), cat.listarSexos(), cat.listarDepartamentos()]);
      this.tiposDocumento = tipos;
      this.sexos = sexos;
      this.departamentos = deptos;
      this.cargado = true;
    },

    async cargarCups(forzar = false) {
      if (this.cups.length && !forzar) return this.cups;
      this.cups = await cat.listarCups();
      return this.cups;
    },

    async municipios(departamentoId: number) {
      if (!this.municipiosPorDepartamento[departamentoId]) {
        this.municipiosPorDepartamento[departamentoId] = await cat.listarMunicipios(departamentoId);
      }
      return this.municipiosPorDepartamento[departamentoId];
    },
  },
});
