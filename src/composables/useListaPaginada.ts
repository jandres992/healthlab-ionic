import { ref } from 'vue';
import type { Paginado } from '@/api/http';

/**
 * Listado con scroll infinito sobre limit/offset (RNF-42, RNF-47).
 * `cargar(reiniciar)` trae la primera página; `siguiente()` la siguiente.
 */
export function useListaPaginada<T, F extends { limit?: number; offset?: number }>(
  fuente: (f: F) => Promise<Paginado<T>>, filtroBase: F, tamano = 20,
) {
  const items = ref<T[]>([]) as import('vue').Ref<T[]>;
  const total = ref(0);
  const cargando = ref(false);
  const error = ref<unknown>(null);
  const hayMas = ref(true);
  let filtro: F = { ...filtroBase };

  async function cargar(nuevoFiltro?: Partial<F>) {
    filtro = { ...filtroBase, ...(nuevoFiltro ?? {}) };
    items.value = [];
    hayMas.value = true;
    await siguiente();
  }

  async function siguiente() {
    if (cargando.value || !hayMas.value) return;
    cargando.value = true;
    error.value = null;
    try {
      const pagina = await fuente({ ...filtro, limit: tamano, offset: items.value.length });
      items.value = items.value.concat(pagina.results);
      total.value = pagina.count;
      hayMas.value = pagina.next !== null && items.value.length < pagina.count;
    } catch (e) {
      error.value = e;
      hayMas.value = false;
    } finally {
      cargando.value = false;
    }
  }

  return { items, total, cargando, error, hayMas, cargar, siguiente };
}
