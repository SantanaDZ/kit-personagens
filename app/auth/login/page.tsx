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
import { validateEmail, validateRequired } from '@/lib/validation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type FieldErrors = {
  email?: string | null
  password?: string | null
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: FieldErrors = {
      email: validateEmail(email),
      password: validateRequired(password, 'Você esqueceu de digitar a senha'),
    }
    if (errors.email || errors.password) {
      setFieldErrors(errors)
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
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
            <p className="text-muted-foreground mt-1">Acesse sua conta</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>
                Digite seu email e senha para acessar seus kits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      autoFocus
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Link
                        href="/auth/forgot-password"
                        className="inline-block py-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <PasswordInput
                      id="password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            password: validateRequired(e.target.value, 'Você esqueceu de digitar a senha'),
                          }))
                        }
                      }}
                      onBlur={(e) =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: validateRequired(e.target.value, 'Você esqueceu de digitar a senha'),
                        }))
                      }
                      aria-invalid={!!fieldErrors.password}
                    />
                    {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="h-13 w-full text-base" disabled={isLoading}>
                    {isLoading && <Spinner className="mr-2" />}
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Nao tem uma conta?{' '}
                  <Link
                    href="/auth/sign-up"
                    className="inline-block py-4 underline underline-offset-4"
                  >
                    Cadastre-se
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
