import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, ShoppingCart } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createAdminClient()

  const [kitsRes, usersRes, ordersRes] = await Promise.all([
    supabase.from('kits').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  const stats = [
    { label: 'Kits cadastrados', value: kitsRes.count ?? 0, icon: Package },
    { label: 'Usuários', value: usersRes.count ?? 0, icon: Users },
    { label: 'Pedidos concluídos', value: ordersRes.count ?? 0, icon: ShoppingCart },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
