export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Você esqueceu de preencher o e-mail'
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Esse e-mail não parece correto 🤔'
  return null
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Você esqueceu de digitar a senha'
  if (value.length < 6) return 'A senha precisa ter pelo menos 6 caracteres'
  return null
}

export function validateRequired(value: string, message: string): string | null {
  return value.trim() ? null : message
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (confirm && password !== confirm) return 'As senhas não coincidem'
  return null
}
