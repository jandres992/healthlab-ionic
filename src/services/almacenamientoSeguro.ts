/**
 * Almacenamiento de secretos (tokens) — RNF-33.1, §16.3.
 * En Android/iOS usa Keychain/Keystore (plugin secure-storage); en web, Preferences
 * (localStorage) como respaldo: la PWA de escritorio es un puesto compartido, por eso
 * su sesión expira por inactividad (ver stores/auth.ts).
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const esNativo = Capacitor.isNativePlatform();

type Seguro = {
  get(clave: string): Promise<unknown>;
  set(clave: string, valor: string): Promise<void>;
  remove(clave: string): Promise<void>;
};

// Los plugins de Capacitor son Proxies que responden a cualquier propiedad, incluida `then`.
// Si se devolvieran directamente desde una función async, JavaScript los trataría como
// promesas y llamaría a `.then()` (error "SecureStorage.then() is not implemented").
// Por eso se envuelven en un objeto plano.
let seguro: { plugin: Seguro } | null = null;

async function obtenerSeguro(): Promise<{ plugin: Seguro } | null> {
  if (!esNativo) return null;
  if (seguro) return seguro;
  try {
    const mod = await import('@aparajita/capacitor-secure-storage');
    seguro = { plugin: mod.SecureStorage as unknown as Seguro };
    return seguro;
  } catch {
    return null;
  }
}

export async function leerSecreto(clave: string): Promise<string | null> {
  const s = await obtenerSeguro();
  if (s) {
    const v = await s.plugin.get(clave);
    return typeof v === 'string' ? v : null;
  }
  const { value } = await Preferences.get({ key: clave });
  return value;
}

export async function guardarSecreto(clave: string, valor: string): Promise<void> {
  const s = await obtenerSeguro();
  if (s) return s.plugin.set(clave, valor);
  await Preferences.set({ key: clave, value: valor });
}

export async function borrarSecreto(clave: string): Promise<void> {
  const s = await obtenerSeguro();
  if (s) { await s.plugin.remove(clave); return; }
  await Preferences.remove({ key: clave });
}
