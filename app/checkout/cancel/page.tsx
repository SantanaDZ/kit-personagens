import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <XCircle className="h-20 w-20 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Pagamento cancelado</h1>
          <p className="mt-2 text-muted-foreground">
            Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
          </p>
        </div>
        <Button asChild>
          <Link href="/catalog">Voltar ao catálogo</Link>
        </Button>
      </div>
    </div>
  )
}
