import { Gift, Headphones, ShieldCheck, Truck } from 'lucide-react'
import React from 'react'

const iconMap = {
  truck: Truck,
  shield: ShieldCheck,
  headphones: Headphones,
  gift: Gift,
}

export const ServiceFeaturesBlock: React.FC<any> = ({ features }) => {
  if (!features || features.length === 0) return null

  return (
    <div className="bg-white section-spacing border-b">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:justify-between gap-6 lg:gap-8">
          {features.map((feature: any, i: number) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap] || Truck
            return (
              <div
                key={i}
                className="flex px-4 py-6 sm:px-6 sm:py-8 border border-transparent hover:border-primary/20 transition-all group"
              >
                <div className="mr-4 sm:mr-5 shrink-0">
                  <Icon
                    size={40}
                    strokeWidth={1}
                    className="text-primary group-hover:scale-110 transition-transform"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1 uppercase tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
