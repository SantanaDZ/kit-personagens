// Alguns kits têm `story_text` salvo inteiramente em CAIXA ALTA no banco
// (ex.: "Pacote Lagarta Laila"), enquanto outros já têm o texto com
// capitalização correta (ex.: "Pacote Serpente Sissa"). A correção é feita
// só no render, e só quando o texto for predominantemente maiúsculo —
// nunca alteramos o dado no banco e nunca aplicamos um transform global que
// estragaria textos já corretos.

const UPPERCASE_THRESHOLD = 0.7

export function isPredominantlyUppercase(text: string): boolean {
  const letters = text.match(/\p{L}/gu) ?? []
  if (letters.length === 0) return false

  const uppercase = text.match(/\p{Lu}/gu) ?? []
  return uppercase.length / letters.length >= UPPERCASE_THRESHOLD
}

// Mesma estratégia sugerida pela especificação (lowercase + capitalizar
// início de linha/frase), usando \p{L} em vez de \w para também capitalizar
// corretamente letras acentuadas no início de parágrafo (ex.: "água").
// Limitação conhecida e aceita: nomes próprios no meio da frase ficam em
// minúsculas (ex. "lália" em vez de "Lália").
export function fixUppercaseText(text: string): string {
  return text.toLowerCase().replace(/(^\p{L}|\.\s+\p{L})/gmu, (c) => c.toUpperCase())
}

export function formatStoryText(text: string): string {
  return isPredominantlyUppercase(text) ? fixUppercaseText(text) : text
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
