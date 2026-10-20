import type { CapacitorConfig } from '@capacitor/cli';

// Mismo identificador de paquete que la app Expo para que los usuarios
// actualicen desde la tienda sin instalar otra app (§16.12).
const config: CapacitorConfig = {
  appId: 'com.jorgeandres992.HealthLabMobile',
  appName: 'HealthLab',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
