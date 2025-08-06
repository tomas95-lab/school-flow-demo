import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import useFirestoreCollection from '@/hooks/useFireStoreCollection'

describe('useFirestoreCollection Hook', () => {
  it('should have working test environment', () => {
    expect(true).toBe(true)
  })

  it('should return default values', () => {
    const { result } = renderHook(() => useFirestoreCollection('test'))
    
    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
  })

  it('should handle empty data', () => {
    const { result } = renderHook(() => useFirestoreCollection('empty'))
    
    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should handle different collection types', () => {
    const { result: usersResult } = renderHook(() => useFirestoreCollection('users'))
    const { result: coursesResult } = renderHook(() => useFirestoreCollection('courses'))
    
    expect(usersResult.current.data).toEqual([])
    expect(coursesResult.current.data).toEqual([])
  })
}) 