// Utilidades para Firebase
// Funciones auxiliares para trabajar con Firebase de manera más eficiente

/**
 * Limpia un objeto removiendo propiedades con valores undefined
 * Firebase no acepta valores undefined, por lo que es necesario limpiarlos
 */
export function limpiarObjetoParaFirebase<T extends Record<string, any>>(obj: T): T {
  const objetoLimpio = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        // Limpiar arrays recursivamente
        objetoLimpio[key as keyof T] = value.map(item => 
          typeof item === 'object' && item !== null ? limpiarObjetoParaFirebase(item) : item
        ) as T[keyof T];
      } else if (typeof value === 'object' && value !== null) {
        // Limpiar objetos anidados recursivamente
        objetoLimpio[key as keyof T] = limpiarObjetoParaFirebase(value) as T[keyof T];
      } else {
        // Valor primitivo válido
        objetoLimpio[key as keyof T] = value;
      }
    }
  }
  
  return objetoLimpio;
}

/**
 * Convierte valores undefined a null para Firebase
 * Firebase acepta null pero no undefined
 */
export function convertirUndefinedANull<T extends Record<string, any>>(obj: T): T {
  const objetoConvertido = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      objetoConvertido[key as keyof T] = null as T[keyof T];
    } else if (Array.isArray(value)) {
      objetoConvertido[key as keyof T] = value.map(item => 
        typeof item === 'object' && item !== null ? convertirUndefinedANull(item) : item
      ) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      objetoConvertido[key as keyof T] = convertirUndefinedANull(value) as T[keyof T];
    } else {
      objetoConvertido[key as keyof T] = value;
    }
  }
  
  return objetoConvertido;
}

/**
 * Valida si un objeto es seguro para Firebase
 * Verifica que no contenga valores undefined
 */
export function esObjetoSeguroParaFirebase(obj: unknown): boolean {
  if (obj === undefined) return false;
  if (obj === null) return true;
  
  if (typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      if (value === undefined) return false;
      if (typeof value === 'object' && !esObjetoSeguroParaFirebase(value)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Función helper para crear documentos de Firebase con datos limpios
 */
export function crearDocumentoFirebase<T extends Record<string, any>>(
  datos: T,
  opciones: {
    limpiarUndefined?: boolean;
    convertirANull?: boolean;
  } = {}
): T {
  const { limpiarUndefined = true, convertirANull = false } = opciones;
  
  let datosProcesados = datos;
  
  if (limpiarUndefined) {
    datosProcesados = limpiarObjetoParaFirebase(datos);
  } else if (convertirANull) {
    datosProcesados = convertirUndefinedANull(datos);
  }
  
  return datosProcesados;
}

/**
 * Función helper para actualizar documentos de Firebase con datos limpios
 */
export function actualizarDocumentoFirebase<T extends Record<string, any>>(
  datos: T,
  opciones: {
    limpiarUndefined?: boolean;
    convertirANull?: boolean;
  } = {}
): T {
  return crearDocumentoFirebase(datos, opciones);
}

/**
 * Función para validar y limpiar datos antes de enviar a Firebase
 * Retorna un objeto con los datos limpios y un flag de éxito
 */
export function validarYLimpiarDatosFirebase<T extends Record<string, any>>(
  datos: T
): { datos: T; esValido: boolean; errores: string[] } {
  const errores: string[] = [];
  let datosLimpios = datos;
  
  try {
    // Verificar si el objeto original es seguro
    if (!esObjetoSeguroParaFirebase(datos)) {
      errores.push('El objeto contiene valores undefined');
      datosLimpios = limpiarObjetoParaFirebase(datos);
    }
    
    // Verificar que después de limpiar sigue siendo válido
    if (!esObjetoSeguroParaFirebase(datosLimpios)) {
      errores.push('Error al limpiar el objeto');
      return { datos: datosLimpios, esValido: false, errores };
    }
    
    return { datos: datosLimpios, esValido: true, errores };
  } catch (error) {
    errores.push(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return { datos: datosLimpios, esValido: false, errores };
  }
} 
