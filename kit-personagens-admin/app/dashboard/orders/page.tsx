import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default async function OrdersPage() {
  const supabase = createAdminClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(full_name, email), kits(title)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <div className="rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Cliente</th>
              <th className="px-4 py-3 text-left font-medium">Kit</th>
              <th className="px-4 py-3 text-left font-medium">Valor</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum pedido encontrado
                </td>
              </tr>
            )}
            {(orders ?? []).map((order) => {
              const profile = order.profiles as { full_name: string | null; email: string | null } | null
              const kit = order.kits as { title: string } | null
              return (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div>{profile?.full_name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{profile?.email}</div>
                  </td>
                  <td className="px-4 py-3">{kit?.title ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(order.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                      {order.status === 'completed' ? 'Concluído' : order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
