import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { KitsTable } from '@/components/kits-table'

export default async function KitsPage() {
  const supabase = await createClient()
  const { data: kits } = await supabase
    .from('kits')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kits</h1>
        <Button asChild>
          <Link href="/dashboard/kits/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Kit
          </Link>
        </Button>
      </div>
      <KitsTable kits={kits ?? []} />
    </div>
  )
}
