'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { BackButton } from '@/components/ui/back-button'
import { Spinner } from '@/components/ui/spinner'
import { validatePassword, validatePasswordMatch, validateRequired } from '@/lib/validation'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'

type FieldErrors = {
  password?: string | null
  confirm?: string | null
}

export default function SettingsPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: FieldErrors = {
      password: validatePassword(password),
      confirm:
        validateRequired(confirm, 'Repita a senha para confirmar') ?? validatePasswordMatch(password, confirm),
    }
    if (errors.password || errors.confirm) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Senha alterada com sucesso')
      setPassword('')
      setConfirm('')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8 max-w-md">
      <div>
        <BackButton label="Voltar" fallbackHref="/dashboard" />
        <h1 className="mt-2 text-[26px] font-bold tracking-tight md:text-3xl">Configurações</h1>
        <p className="text-muted-foreground mt-2">Gerencie os dados da sua conta</p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Alterar senha</p>
            <p className="text-sm text-muted-foreground">Escolha uma nova senha para sua conta</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }))
                }
              }}
              onBlur={(e) => setFieldErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }))}
              aria-invalid={!!fieldErrors.password}
              placeholder="Mínimo 6 caracteres"
              required
              autoFocus
            />
            {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar nova senha</Label>
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                if (fieldErrors.confirm) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirm:
                      validateRequired(e.target.value, 'Repita a senha para confirmar') ??
                      validatePasswordMatch(password, e.target.value),
                  }))
                }
              }}
              onBlur={(e) =>
                setFieldErrors((prev) => ({
                  ...prev,
                  confirm:
                    validateRequired(e.target.value, 'Repita a senha para confirmar') ??
                    validatePasswordMatch(password, e.target.value),
                }))
              }
              aria-invalid={!!fieldErrors.confirm}
              placeholder="Repita a senha"
              required
            />
            {fieldErrors.confirm && <p className="text-sm text-destructive">{fieldErrors.confirm}</p>}
          </div>
          <Button type="submit" disabled={loading} className="h-13 w-full text-base">
            {loading && <Spinner className="mr-2" />}
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
