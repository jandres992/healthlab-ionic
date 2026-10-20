<script setup lang="ts">
/** Un resultado con sus banderas: anormal, crítico, acuse pendiente (RF-36). Las banderas vienen del backend. */
import { IonBadge, IonItem, IonLabel, IonNote } from '@ionic/vue';
import type { Resultado } from '@/api/tipos';

defineProps<{ resultado: Resultado }>();

function rango(r: Resultado) {
  if (r.rango_min_aplicado != null || r.rango_max_aplicado != null) return `${r.rango_min_aplicado ?? ''} – ${r.rango_max_aplicado ?? ''}`;
  return r.rango_texto_aplicado ?? '—';
}
</script>

<template>
  <ion-item :color="resultado.es_critico ? 'light' : undefined">
    <ion-label class="ion-text-wrap">
      <h3>
        {{ resultado.parametro_nombre }}
        <ion-badge v-if="resultado.es_critico" color="danger">CRÍTICO</ion-badge>
        <ion-badge v-else-if="resultado.es_anormal" color="warning">anormal</ion-badge>
        <ion-badge v-if="resultado.es_critico && !resultado.tiene_acuse" color="danger" style="margin-left: 4px">sin acuse</ion-badge>
      </h3>
      <p>Rango {{ rango(resultado) }} {{ resultado.unidades_aplicadas ?? '' }}<span v-if="resultado.metodo_aplicado"> · {{ resultado.metodo_aplicado }}</span></p>
      <p v-if="resultado.comentario_bacteriologo"><ion-note>{{ resultado.comentario_bacteriologo }}</ion-note></p>
    </ion-label>
    <div slot="end" class="valor" :class="{ critico: resultado.es_critico, anormal: resultado.es_anormal && !resultado.es_critico }">
      {{ resultado.valor_resultado }} <small>{{ resultado.unidades_aplicadas ?? '' }}</small>
    </div>
  </ion-item>
</template>

<style scoped>
.valor { font-size: 20px; font-weight: 600; color: var(--hl-normal); white-space: nowrap; }
.valor.anormal { color: var(--hl-anormal); }
.valor.critico { color: var(--hl-critico); }
.valor small { font-size: 12px; font-weight: normal; color: var(--ion-color-medium); }
</style>
