"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts"

interface ChartDataPoint {
  [key: string]: string | number
}

interface BarChartProps {
  data: ChartDataPoint[]
  xKey: string
  yKey: string
  title?: string
  description?: string
  className?: string
  colors?: {
    bar?: string
    referenceLine?: string
  }
}

export function BarChartComponent({ 
  data, 
  xKey, 
  yKey, 
  title, 
  description, 
  className = "",
  colors = {
    bar: "#2563eb",
    referenceLine: "#10b981"
  }
}: BarChartProps) {
  const hasValidData = data && data.length > 0 && data.some(item => {
    const value = item[yKey]
    return typeof value === 'number' && value > 0
  });

  if (!hasValidData) {
    return (
      <div className={`w-full h-100${className}`}>
        {(title || description) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
        )}
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-4">
           <div className="text-center max-w-xs">
             <div className="text-gray-400 mb-2">
               <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
             </div>
             <p className="text-gray-500 text-xs font-medium">Sin datos</p>
             <p className="text-gray-400 text-xs mt-1">Próximamente</p>
           </div>
         </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}
      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 32 }}>
            <CartesianGrid strokeDasharray="4 8" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xKey} 
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={64}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-md border bg-white p-3 shadow-lg">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {xKey}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {label}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {yKey}
                          </span>
                          <span className="font-bold">
                            {payload[0].value}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar 
              dataKey={yKey} 
              fill={colors.bar} 
              radius={[6, 6, 0, 0]} 
              maxBarSize={48}
            />
            <ReferenceLine y={7} stroke={colors.referenceLine} strokeDasharray="3 3" ifOverflow="extendDomain" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default BarChart;