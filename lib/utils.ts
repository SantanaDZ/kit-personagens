import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g')

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getFileExtension(url: string, fallback = 'png'): string {
  const match = new URL(url).pathname.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1] : fallback
}
