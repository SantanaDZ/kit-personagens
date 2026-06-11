'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { BackButton } from '@/components/ui/back-button'
import { Spinner } from '@/components/ui/spinner'
import { validateEmail, validatePassword, validatePasswordMatch, validateRequired } from '@/lib/validation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type FieldErrors = {
  fullName?: string | null
  email?: string | null
  password?: string | null
  repeatPassword?: string | null
}

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: FieldErrors = {
      fullName: validateRequired(fullName, 'Você esqueceu de preencher o seu nome'),
      email: validateEmail(email),
      password: validatePassword(password),
      repeatPassword:
        validateRequired(repeatPassword, 'Repita a senha para confirmar') ??
        validatePasswordMatch(password, repeatPassword),
    }
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors)
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocorreu um erro')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-[420px]">
        <BackButton label="Voltar" fallbackHref="/" />
        <div className="mt-2 flex flex-col gap-6">
          <div className="text-center">
            <Link href="/" className="text-[26px] font-bold tracking-tight">Kits Criativos</Link>
            <p className="text-muted-foreground mt-1">Crie sua conta</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Cadastro</CardTitle>
              <CardDescription>Crie uma conta para acessar seus kits</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome"
                      required
                      autoFocus
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value)
                        if (fieldErrors.fullName) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            fullName: validateRequired(e.target.value, 'Você esqueceu de preencher o seu nome'),
                          }))
                        }
                      }}
                      onBlur={(e) =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          fullName: validateRequired(e.target.value, 'Você esqueceu de preencher o seu nome'),
                        }))
                      }
                      aria-invalid={!!fieldErrors.fullName}
                    />
                    {fieldErrors.fullName && <p className="text-sm text-destructive">{fieldErrors.fullName}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }))
                        }
                      }}
                      onBlur={(e) => setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }))}
                      aria-invalid={!!fieldErrors.email}
                    />
                    {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <PasswordInput
                      id="password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }))
                        }
                      }}
                      onBlur={(e) => setFieldErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }))}
                      aria-invalid={!!fieldErrors.password}
                    />
                    {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Repetir Senha</Label>
                    <PasswordInput
                      id="repeat-password"
                      required
                      value={repeatPassword}
                      onChange={(e) => {
                        setRepeatPassword(e.target.value)
                        if (fieldErrors.repeatPassword) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            repeatPassword:
                              validateRequired(e.target.value, 'Repita a senha para confirmar') ??
                              validatePasswordMatch(password, e.target.value),
                          }))
                        }
                      }}
                      onBlur={(e) =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          repeatPassword:
                            validateRequired(e.target.value, 'Repita a senha para confirmar') ??
                            validatePasswordMatch(password, e.target.value),
                        }))
                      }
                      aria-invalid={!!fieldErrors.repeatPassword}
                    />
                    {fieldErrors.repeatPassword && (
                      <p className="text-sm text-destructive">{fieldErrors.repeatPassword}</p>
                    )}
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="h-13 w-full text-base" disabled={isLoading}>
                    {isLoading && <Spinner className="mr-2" />}
                    {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Ja tem uma conta?{' '}
                  <Link
                    href="/auth/login"
                    className="inline-block py-4 underline underline-offset-4"
                  >
                    Entrar
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
