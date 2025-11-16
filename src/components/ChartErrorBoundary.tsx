import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChartErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

interface ChartErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ChartErrorBoundary extends React.Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border-2 border-red-200">
          <div className="max-w-md text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-900">
                Error al cargar el gráfico
              </h3>
              <p className="text-sm text-red-700">
                {this.state.error?.message || 'Ocurrió un error inesperado'}
              </p>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={this.handleReset}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function withChartErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function ChartWithErrorBoundary(props: P) {
    return (
      <ChartErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ChartErrorBoundary>
    )
  }
}

