import { alertController, toastController } from '@ionic/vue';
import { esApiError } from '@/api/http';

/** Mensajes de retroalimentación (RNF-13, RNF-15). Los errores de la API se muestran con su `mensaje`. */
export function useMensajes() {
  async function exito(texto: string) {
    const t = await toastController.create({ message: texto, duration: 2500, color: 'success', position: 'top' });
    await t.present();
  }

  async function error(e: unknown, fallback = 'Ocurrió un error.') {
    let texto = fallback;
    let detalle = '';
    if (esApiError(e)) {
      texto = e.mensaje;
      if (e.errores) {
        detalle = Object.entries(e.errores)
          .map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(' ') : String(msgs)}`)
          .join('\n');
      }
    } else if (e instanceof Error) {
      texto = e.message;
    }
    const a = await alertController.create({ header: 'Atención', message: detalle ? `${texto}\n${detalle}` : texto, buttons: ['Cerrar'] });
    await a.present();
  }

  async function confirmar(titulo: string, texto: string, textoOk = 'Confirmar'): Promise<boolean> {
    return new Promise((resolve) => {
      alertController.create({
        header: titulo, message: texto,
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(false) },
          { text: textoOk, role: 'confirm', handler: () => resolve(true) },
        ],
      }).then((a) => a.present());
    });
  }

  async function pedirTexto(titulo: string, placeholder: string): Promise<string | null> {
    return new Promise((resolve) => {
      alertController.create({
        header: titulo,
        inputs: [{ name: 'texto', type: 'textarea', placeholder }],
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(null) },
          { text: 'Aceptar', handler: (d: { texto?: string }) => resolve((d.texto ?? '').trim() || null) },
        ],
      }).then((a) => a.present());
    });
  }

  return { exito, error, confirmar, pedirTexto };
}
