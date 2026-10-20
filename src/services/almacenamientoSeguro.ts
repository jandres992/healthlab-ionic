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

let seguro: Seguro | null = null;

async function obtenerSeguro(): Promise<Seguro | null> {
  if (!esNativo) return null;
  if (seguro) return seguro;
  try {
    const mod = await import('@aparajita/capacitor-secure-storage');
    seguro = mod.SecureStorage as unknown as Seguro;
    return seguro;
  } catch {
    return null;
  }
}

export async function leerSecreto(clave: string): Promise<string | null> {
  const s = await obtenerSeguro();
  if (s) {
    const v = await s.get(clave);
    return typeof v === 'string' ? v : null;
  }
  const { value } = await Preferences.get({ key: clave });
  return value;
}

export async function guardarSecreto(clave: string, valor: string): Promise<void> {
  const s = await obtenerSeguro();
  if (s) return s.set(clave, valor);
  await Preferences.set({ key: clave, value: valor });
}

export async function borrarSecreto(clave: string): Promise<void> {
  const s = await obtenerSeguro();
  if (s) return s.remove(clave);
  await Preferences.remove({ key: clave });
}
