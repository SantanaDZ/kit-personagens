'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User as UserIcon, Settings, LayoutDashboard, ShoppingBag, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface DashboardNavProps {
  user: User
  profile: Profile | null
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'border-b bg-background/80 backdrop-blur-md shadow-sm' : 'bg-transparent border-transparent'}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-xl font-bold">Kits Criativos</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Meus Kits</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/catalog" className="flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4" />
                Explorar Kits
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/planos" className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Planos
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {profile?.is_admin && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">Painel Admin</Link>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{profile?.full_name || 'Usuario'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Meus Kits
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/catalog" className="flex items-center">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Explorar Kits
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
