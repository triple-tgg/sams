
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StepCardProps {
  stepNumber: number
  title: string
  description: string
  children: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  description,
  children,
  className = "",
  headerClassName = "",
  contentClassName = ""
}) => {
  return (
    <Card className={`shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg ${headerClassName}`}>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">{stepNumber}</span>
          </div>
          {title}
        </CardTitle>
        <p className="text-blue-100 text-sm mt-2">
          {description}
        </p>
      </CardHeader>
      <CardContent className={`p-6 ${contentClassName}`}>
        {children}
      </CardContent>
    </Card>
  )
}

export default StepCard 