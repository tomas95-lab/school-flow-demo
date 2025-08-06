import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Componente simple para testing
const SimpleComponent = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div data-testid="simple-component">
      <h1>{title}</h1>
      <div>{children}</div>
    </div>
  )
}

describe('Simple Component', () => {
  it('renders with title', () => {
    render(<SimpleComponent title="Test Title">Test Content</SimpleComponent>)
    
    expect(screen.getByTestId('simple-component')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders without children', () => {
    render(<SimpleComponent title="Empty Component"></SimpleComponent>)
    
    expect(screen.getByTestId('simple-component')).toBeInTheDocument()
    expect(screen.getByText('Empty Component')).toBeInTheDocument()
  })

  it('renders with complex children', () => {
    render(
      <SimpleComponent title="Complex Component">
        <div data-testid="nested-content">
          <span>Nested content</span>
          <button>Click me</button>
        </div>
      </SimpleComponent>
    )
    
    expect(screen.getByTestId('simple-component')).toBeInTheDocument()
    expect(screen.getByTestId('nested-content')).toBeInTheDocument()
    expect(screen.getByText('Nested content')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
}) 