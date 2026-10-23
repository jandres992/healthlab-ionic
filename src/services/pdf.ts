/**
 * Abrir e imprimir PDF del backend (informe RF-37.6 y etiqueta RF-60.2).
 *
 * - Web: «abrir» lo muestra en una pestaña nueva; «imprimir» lo carga en un
 *   iframe oculto y abre el diálogo de impresión del navegador.
 * - Android: se guarda en la caché y se abre la hoja de compartir, desde la
 *   que se elige el servicio de impresión del sistema o la app de la impresora.
 */
import { Capacitor } from '@capacitor/core';

async function aBase64(blob: Blob): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(blob);
  });
}

async function compartirNativo(blob: Blob, nombre: string, titulo: string): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const archivo = await Filesystem.writeFile({ path: nombre, data: await aBase64(blob), directory: Directory.Cache });
  await Share.share({ title: titulo, dialogTitle: titulo, url: archivo.uri });
}

/** Muestra el PDF: pestaña nueva en web, hoja de compartir en Android. */
export async function abrirPdf(blob: Blob, nombre: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await compartirNativo(blob, nombre, nombre);
    return;
  }
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Abre el diálogo de impresión con el PDF. Si el navegador no lo permite, lo abre en otra pestaña. */
export async function imprimirPdf(blob: Blob, nombre: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await compartirNativo(blob, nombre, `Imprimir ${nombre}`);
    return;
  }
  const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
  const marco = document.createElement('iframe');
  marco.setAttribute('aria-hidden', 'true');
  marco.title = nombre;
  Object.assign(marco.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  marco.src = url;
  document.body.appendChild(marco);
  await new Promise<void>((resolver) => {
    marco.onload = () => {
      // Pequeña espera para que el visor de PDF del navegador termine de cargar.
      setTimeout(() => {
        try {
          marco.contentWindow?.focus();
          marco.contentWindow?.print();
        } catch {
          window.open(url, '_blank');
        }
        resolver();
      }, 400);
    };
  });
  setTimeout(() => { marco.remove(); URL.revokeObjectURL(url); }, 120_000);
}
