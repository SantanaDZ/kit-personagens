'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { BackButton } from '@/components/ui/back-button'
import { Spinner } from '@/components/ui/spinner'
import { validatePassword, validatePasswordMatch, validateRequired } from '@/lib/validation'
import { toast } from 'sonner'
import Link from 'next/link'

type FieldErrors = {
  password?: string | null
  confirm?: string | null
}

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('error')) {
      setInvalid(true)
      return
    }
    if (!searchParams.get('code')) {
      setInvalid(true)
      return
    }

    // O client do navegador troca o `code` da URL por sessão sozinho
    // (detectSessionInUrl, ligado por padrão) assim que é criado — não
    // chamamos exchangeCodeForSession aqui de novo, pois o código é de
    // uso único e a segunda tentativa falharia mesmo com a troca
    // automática já tendo dado certo. Só observamos o resultado.
    let resolved = false
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        resolved = true
        setReady(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !resolved) {
        resolved = true
        setReady(true)
      }
    })

    const timeout = setTimeout(() => {
      if (!resolved) setInvalid(true)
    }, 6000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [searchParams])

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
      toast.error('Não foi possível alterar a senha. Solicite um novo link.')
    } else {
      toast.success('Senha definida com sucesso!')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Nova senha</CardTitle>
        <CardDescription>
          {invalid
            ? 'Este link é inválido ou já expirou.'
            : 'Escolha uma nova senha para sua conta'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invalid ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Solicite um novo link na página de login.
            </p>
            <Button className="h-13 w-full text-base" asChild>
              <a href="/auth/forgot-password">Solicitar novo link</a>
            </Button>
          </div>
        ) : !ready ? (
          <p className="text-sm text-muted-foreground text-center py-4">Verificando link...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
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
            <div className="grid gap-2">
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
        )}
      </CardContent>
    </Card>
  )
}

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-[420px]">
        <BackButton label="Voltar" fallbackHref="/auth/login" />
        <div className="mt-2 flex flex-col gap-6">
          <div className="text-center">
            <Link href="/" className="text-[26px] font-bold tracking-tight">Kits Criativos</Link>
            <p className="text-muted-foreground mt-1">Redefinição de senha</p>
          </div>
          <Suspense fallback={
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground text-center">Carregando...</p>
              </CardContent>
            </Card>
          }>
            <UpdatePasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
