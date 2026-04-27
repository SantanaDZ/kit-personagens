'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/kits', label: 'Kits', icon: Package },
  { href: '/dashboard/users', label: 'Usuários', icon: Users },
  { href: '/dashboard/orders', label: 'Pedidos', icon: ShoppingCart },
]

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 max-w-7xl flex items-center h-14 gap-6">
        <span className="font-bold text-sm shrink-0">Admin</span>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Button
                key={href}
                variant={active ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link href={href} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </Button>
            )
          })}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
