"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts"

interface ChartDataPoint {
  [key: string]: string | number
}

interface LineChartProps {
  data: ChartDataPoint[]
  xKey: string
  yKey: string
  title?: string
  description?: string
  className?: string
  color?: string
  showReferenceLine?: boolean
  referenceLineValue?: number
  referenceLineColor?: string
}

export function LineChartComponent({ 
  data, 
  xKey, 
  yKey, 
  title, 
  description, 
  className = "",
  color = "#3b82f6",
  showReferenceLine = true,
  referenceLineValue = 7,
  referenceLineColor = "#10b981"
}: LineChartProps) {
  const hasValidData = data && data.length > 0 && data.some(item => {
    const value = item[yKey]
    return typeof value === 'number' && value > 0
  });

  if (!hasValidData) {
    return (
      <div className={`w-full h-100 ${className}`}>
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
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
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
          <LineChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 16 }}>
            <CartesianGrid strokeDasharray="4 8" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xKey} 
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              axisLine={false}
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
            <Line 
              type="monotone"
              dataKey={yKey} 
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: color }}
            />
            {showReferenceLine && (
              <ReferenceLine 
                y={referenceLineValue} 
                stroke={referenceLineColor} 
                strokeDasharray="3 3" 
                ifOverflow="extendDomain" 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
