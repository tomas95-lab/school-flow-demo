import { seedAlerts } from './createAlerts.js';

// Función principal para ejecutar el seed
async function main() {
  try {
    console.log("🚀 Iniciando creación de alertas en Firestore...");
    await seedAlerts();
    console.log("🎉 Proceso completado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la ejecución:", error);
    process.exit(1);
  }
}

// Ejecutar el script
main(); 