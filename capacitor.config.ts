import type { CapacitorConfig } from '@capacitor/cli';

// Mismo identificador de paquete que la app Expo para que los usuarios
// actualicen desde la tienda sin instalar otra app (§16.12).
const config: CapacitorConfig = {
  appId: 'com.jorgeandres992.HealthLabMobile',
  appName: 'HealthLab',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Solo desarrollo: permite llamar al backend local por HTTP (10.0.2.2 desde el emulador).
    cleartext: process.env.CAP_DEV === '1',
  },
  android: {
    allowMixedContent: process.env.CAP_DEV === '1',
  },
};

export default config;
