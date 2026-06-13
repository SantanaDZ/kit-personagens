'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'kit-story-font-size'
const MIN_SIZE = 14
const MAX_SIZE = 24
const STEP = 2
const DEFAULT_SIZE = 18

export function useReadingFontSize() {
  const [fontSize, setFontSize] = useState(DEFAULT_SIZE)

  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY))
    if (saved >= MIN_SIZE && saved <= MAX_SIZE) {
      setFontSize(saved)
    }
  }, [])

  const persist = (value: number) => {
    setFontSize(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }

  return {
    fontSize,
    increase: () => persist(Math.min(MAX_SIZE, fontSize + STEP)),
    decrease: () => persist(Math.max(MIN_SIZE, fontSize - STEP)),
    canIncrease: fontSize < MAX_SIZE,
    canDecrease: fontSize > MIN_SIZE,
  }
}
