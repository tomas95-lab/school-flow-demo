import { describe, it, expect } from 'vitest'
import { validarYLimpiarDatosFirebase, limpiarObjetoParaFirebase, esObjetoSeguroParaFirebase } from '@/utils/firebaseUtils'

describe('Firebase Utils', () => {
  describe('esObjetoSeguroParaFirebase', () => {
    it('returns true for safe objects', () => {
      expect(esObjetoSeguroParaFirebase({ name: 'test' })).toBe(true)
      expect(esObjetoSeguroParaFirebase([1, 2, 3])).toBe(true)
      expect(esObjetoSeguroParaFirebase('string')).toBe(true)
      expect(esObjetoSeguroParaFirebase(123)).toBe(true)
      expect(esObjetoSeguroParaFirebase(null)).toBe(true)
    })

    it('returns false for unsafe objects', () => {
      expect(esObjetoSeguroParaFirebase(undefined)).toBe(false)
    })
  })

  describe('limpiarObjetoParaFirebase', () => {
    it('handles simple objects', () => {
      const result = limpiarObjetoParaFirebase({ name: 'test', age: 25 })
      expect(result).toEqual({ name: 'test', age: 25 })
    })

    it('handles null and undefined', () => {
      const result = limpiarObjetoParaFirebase({ name: 'test', value: null, empty: undefined })
      expect(result).toHaveProperty('name', 'test')
      expect(result).toHaveProperty('value', null)
      expect(result).not.toHaveProperty('empty')
    })
  })

  describe('validarYLimpiarDatosFirebase', () => {
    it('handles simple valid data', () => {
      const result = validarYLimpiarDatosFirebase({ name: 'test' })
      expect(result.esValido).toBe(true)
      expect(result.datos).toEqual({ name: 'test' })
      expect(result.errores).toEqual([])
    })

    it('handles null input', () => {
      const result = validarYLimpiarDatosFirebase(null as any)
      expect(result.esValido).toBe(true)
      expect(result.datos).toBe(null)
      expect(result.errores).toEqual([])
    })

    it('handles undefined input', () => {
      const result = validarYLimpiarDatosFirebase(undefined as any)
      expect(result.esValido).toBe(false)
      expect(result.datos).toBe(undefined)
      expect(result.errores).toContain('El objeto contiene valores undefined')
    })
  })
}) 