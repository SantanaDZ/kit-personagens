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

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

export function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}
