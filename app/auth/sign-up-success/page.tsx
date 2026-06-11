import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BackButton } from '@/components/ui/back-button'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-[420px]">
        <BackButton label="Voltar" fallbackHref="/auth/login" />
        <Card className="mt-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verifique seu Email</CardTitle>
            <CardDescription>
              Enviamos um link de confirmacao para o seu email. Clique no link para ativar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">Voltar para Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
