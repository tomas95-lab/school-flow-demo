import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Test simple que verifica que el setup funciona
describe('Dashboard Setup Test', () => {
  it('should have working test environment', () => {
    expect(true).toBe(true)
  })

  it('should be able to render basic elements', () => {
    render(<div data-testid="test-element">Test Content</div>)
    expect(screen.getByTestId('test-element')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
}) 