import { describe, it, expect } from 'vitest'
import { validateField, validateForm } from '@/utils/validation'

describe('Validation Utils', () => {
  describe('validateField', () => {
    it('validates required fields', () => {
      const rules = { required: true }
      
      expect(validateField('', rules)).toBe('Este campo es requerido')
      expect(validateField('test', rules)).toBe(null)
    })

    it('validates email format', () => {
      const rules = { 
        custom: (value: unknown) => {
          if (typeof value !== 'string') return null;
          if (!value) return null;
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'El formato del email no es válido';
          }
          return null;
        }
      }
      
      expect(validateField('invalid-email', rules)).toBe('El formato del email no es válido')
      expect(validateField('test@example.com', rules)).toBe(null)
      expect(validateField('', rules)).toBe(null) // Empty is valid for non-required
    })

    it('validates minimum length', () => {
      const rules = { minLength: 5 }
      
      expect(validateField('123', rules)).toBe('Debe tener al menos 5 caracteres')
      expect(validateField('12345', rules)).toBe(null)
      expect(validateField('123456', rules)).toBe(null)
    })

    it('validates maximum length', () => {
      const rules = { maxLength: 10 }
      
      expect(validateField('12345678901', rules)).toBe('No puede exceder 10 caracteres')
      expect(validateField('12345', rules)).toBe(null)
      expect(validateField('', rules)).toBe(null)
    })

    it('validates pattern', () => {
      const rules = { pattern: /^[A-Za-z]+$/ }
      
      expect(validateField('123', rules)).toBe('El formato no es válido')
      expect(validateField('abc', rules)).toBe(null)
      expect(validateField('ABC', rules)).toBe(null)
    })

    it('combines multiple validations', () => {
      const rules = { 
        required: true, 
        minLength: 3, 
        custom: (value: unknown) => {
          if (typeof value !== 'string') return null;
          if (!value) return null;
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'El formato del email no es válido';
          }
          return null;
        }
      }
      
      expect(validateField('', rules)).toBe('Este campo es requerido')
      expect(validateField('ab', rules)).toBe('Debe tener al menos 3 caracteres')
      expect(validateField('invalid', rules)).toBe('El formato del email no es válido')
      expect(validateField('test@example.com', rules)).toBe(null)
    })
  })

  describe('validateForm', () => {
    it('validates complete form data', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }
      
      const validationRules = {
        name: { required: true, minLength: 2 },
        email: { 
          required: true, 
          custom: (value: unknown) => {
            if (typeof value !== 'string') return 'El email debe ser una cadena';
            if (!value) return 'El email es requerido';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return 'El formato del email no es válido';
            }
            return null;
          }
        },
        password: { required: true, minLength: 8 }
      }
      
      const result = validateForm(formData, validationRules)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('returns errors for invalid form data', () => {
      const formData = {
        name: '',
        email: 'invalid-email',
        password: '123'
      }
      
      const validationRules = {
        name: { required: true },
        email: { 
          required: true, 
          custom: (value: unknown) => {
            if (typeof value !== 'string') return 'El email debe ser una cadena';
            if (!value) return 'El email es requerido';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return 'El formato del email no es válido';
            }
            return null;
          }
        },
        password: { required: true, minLength: 8 }
      }
      
      const result = validateForm(formData, validationRules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('name: Este campo es requerido')
      expect(result.errors).toContain('email: El formato del email no es válido')
      expect(result.errors).toContain('password: Debe tener al menos 8 caracteres')
    })

    it('handles empty form data', () => {
      const formData = {}
      const validationRules = {
        name: { required: true }
      }
      
      const result = validateForm(formData, validationRules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('name: Este campo es requerido')
    })

    it('handles partial validation rules', () => {
      const formData = {
        name: 'John',
        email: 'john@example.com'
      }
      
      const validationRules = {
        name: { required: true },
        email: { 
          custom: (value: unknown) => {
            if (typeof value !== 'string') return null;
            if (!value) return null;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return 'El formato del email no es válido';
            }
            return null;
          }
        } // Not required
      }
      
      const result = validateForm(formData, validationRules)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('specific validations', () => {
    it('validates student data', () => {
      const studentData = {
        name: 'John Doe',
        email: 'john@example.com',
        grade: '10th'
      }
      
      const rules = {
        name: { required: true, minLength: 2 },
        email: { 
          required: true, 
          custom: (value: unknown) => {
            if (typeof value !== 'string') return 'El email debe ser una cadena';
            if (!value) return 'El email es requerido';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return 'El formato del email no es válido';
            }
            return null;
          }
        },
        grade: { required: true }
      }
      
      const result = validateForm(studentData, rules)
      expect(result.isValid).toBe(true)
    })

    it('validates teacher data', () => {
      const teacherData = {
        name: 'Jane Smith',
        email: 'jane@school.com',
        subject: 'Mathematics'
      }
      
      const rules = {
        name: { required: true, minLength: 2 },
        email: { 
          required: true, 
          custom: (value: unknown) => {
            if (typeof value !== 'string') return 'El email debe ser una cadena';
            if (!value) return 'El email es requerido';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return 'El formato del email no es válido';
            }
            return null;
          }
        },
        subject: { required: true }
      }
      
      const result = validateForm(teacherData, rules)
      expect(result.isValid).toBe(true)
    })

    it('validates course data', () => {
      const courseData = {
        name: 'Advanced Mathematics',
        code: 'MATH101',
        description: 'Advanced mathematics course'
      }
      
      const rules = {
        name: { required: true, minLength: 3 },
        code: { required: true, pattern: /^[A-Z]{3,4}\d{3}$/ },
        description: { maxLength: 200 }
      }
      
      const result = validateForm(courseData, rules)
      expect(result.isValid).toBe(true)
    })
  })
}) 