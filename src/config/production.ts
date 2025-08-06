// Configuración específica para producción
export const productionConfig = {
  // Firebase
  firebase: {
    enablePersistence: true,
    cacheSizeBytes: 50 * 1024 * 1024, // 50MB
    enableNetworkStatus: true
  },

  // Performance
  performance: {
    enableCache: true,
    cacheDuration: 5 * 60 * 1000, // 5 minutos
    enableLazyLoading: true,
    enableCompression: true
  },

  // Error Reporting
  errorReporting: {
    enableConsoleLogging: false,
    enableExternalLogging: true,
    enableUserTracking: false
  },

  // Analytics
  analytics: {
    enableTracking: true,
    enablePerformanceMonitoring: true,
    enableErrorTracking: true
  },

  // Security
  security: {
    enableCSP: true,
    enableHTTPS: true,
    enableXSSProtection: true
  },

  // Feature Flags
  features: {
    enableDebugMode: false,
    enableDeveloperTools: false,
    enableTestMode: false
  }
};

// Configuración de desarrollo
export const developmentConfig = {
  ...productionConfig,
  performance: {
    ...productionConfig.performance,
    enableCache: false,
    cacheDuration: 1 * 60 * 1000 // 1 minuto
  },
  errorReporting: {
    ...productionConfig.errorReporting,
    enableConsoleLogging: true,
    enableExternalLogging: false
  },
  features: {
    ...productionConfig.features,
    enableDebugMode: true,
    enableDeveloperTools: true
  }
};

// Configuración actual basada en el entorno
export const config = import.meta.env.PROD ? productionConfig : developmentConfig; 