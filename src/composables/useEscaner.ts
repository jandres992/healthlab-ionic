/**
 * Escáner de código de barras (RF-25).
 * Nativo: ML Kit (code128, code39, EAN-13, EAN-8, QR). Web: el campo de texto acepta un
 * lector USB (funciona como teclado) o digitación manual.
 */
import { Capacitor } from '@capacitor/core';

export function useEscaner() {
  const disponible = Capacitor.isNativePlatform();

  async function escanear(): Promise<string | null> {
    if (!disponible) return null;
    const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');
    const permiso = await BarcodeScanner.requestPermissions();
    if (permiso.camera !== 'granted' && permiso.camera !== 'limited') return null;
    if (Capacitor.getPlatform() === 'android') {
      const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (!available) await BarcodeScanner.installGoogleBarcodeScannerModule();
    }
    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.Code128, BarcodeFormat.Code39, BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.QrCode],
    });
    return barcodes[0]?.rawValue?.trim() || null;
  }

  return { disponible, escanear };
}
