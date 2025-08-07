"use client"

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface PieChartProps {
  data: any[]
  dataKey: string
  nameKey: string
  title?: string
  description?: string
  className?: string
  colors?: string[]
}

export function PieChartComponent({ 
  data, 
  dataKey, 
  nameKey, 
  title, 
  description, 
  className = "",
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]
}: PieChartProps) {
  // Verificar si hay datos válidos
  const hasValidData = data && data.length > 0 && data.some(item => item[dataKey] > 0);

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
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
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
          <RechartsPieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {nameKey}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {payload[0].name}
                        </span>
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {dataKey}
                        </span>
                        <span className="font-bold">
                          {payload[0].value}
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
