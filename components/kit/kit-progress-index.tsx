'use client'

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProgressSection {
  label: string
  icon: LucideIcon
  ref: RefObject<HTMLElement | null>
}

interface KitProgressIndexProps {
  sections: ProgressSection[]
}

export function KitProgressIndex({ sections }: KitProgressIndexProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]))

  useEffect(() => {
    const elements = sections.map((section) => section.ref.current)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = elements.indexOf(entry.target as HTMLElement)
          if (index === -1) continue
          setActiveIndex(index)
          setVisited((prev) => (prev.has(index) ? prev : new Set(prev).add(index)))
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )

    elements.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  const handleClick = (index: number) => {
    sections[index].ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="sticky top-16 z-40 -mx-5 flex items-center justify-center gap-1.5 border-b bg-background/95 px-5 py-2 backdrop-blur-sm md:hidden">
      {sections.map((section, index) => {
        const isActive = activeIndex === index
        const isVisited = visited.has(index)
        const Icon = isVisited && !isActive ? Check : section.icon

        return (
          <div key={section.label} className="flex items-center">
            <button
              type="button"
              onClick={() => handleClick(index)}
              aria-label={section.label}
              aria-current={isActive ? 'true' : undefined}
              className="flex min-h-11 min-w-11 items-center justify-center"
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isVisited
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            </button>
            {index < sections.length - 1 && <span className="h-px w-4 bg-border" aria-hidden="true" />}
          </div>
        )
      })}
    </div>
  )
}
