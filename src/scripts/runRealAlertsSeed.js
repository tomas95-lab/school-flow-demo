import { seedRealAlerts } from './createRealAlerts.js';

// Función principal para ejecutar el seed
async function main() {
  try {
    console.log("🚀 Iniciando creación de alertas con datos reales de Firestore...");
    await seedRealAlerts();
    console.log("🎉 Proceso completado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la ejecución:", error);
    process.exit(1);
  }
}

// Ejecutar el script
main(); 