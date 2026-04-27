import { createClient } from '@/lib/supabase/server'
import { KitForm } from '@/components/kit-form'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditKitPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: kit } = await supabase.from('kits').select('*').eq('id', id).single()
  if (!kit) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Kit</h1>
      <KitForm kit={kit} />
    </div>
  )
}
