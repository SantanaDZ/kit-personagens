'use client'

import { useEffect, useState } from 'react'

export type KitMode = 'listen' | 'read' | 'guide'

const VALID_MODES: KitMode[] = ['listen', 'read', 'guide']

const DEFAULT_MODE: KitMode = 'listen'

// Persiste o modo de foco do desktop (Ouvir/Ler/Guia) por kit, restaurando
// ao reabrir a pagina. O valor inicial e sempre o padrao ('listen') para
// nao quebrar a hidratacao; o valor salvo e aplicado em seguida via efeito.
export function useKitMode(kitId: string) {
  const [mode, setModeState] = useState<KitMode>(DEFAULT_MODE)

  useEffect(() => {
    const saved = localStorage.getItem(`kit-mode-${kitId}`)
    if (saved && VALID_MODES.includes(saved as KitMode)) {
      setModeState(saved as KitMode)
    }
  }, [kitId])

  const setMode = (next: KitMode) => {
    setModeState(next)
    localStorage.setItem(`kit-mode-${kitId}`, next)
  }

  return [mode, setMode] as const
}
