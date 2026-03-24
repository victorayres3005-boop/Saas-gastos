'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, PieChart, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks/useProfile'
import { Avatar } from '../ui/Avatar'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/budget', label: 'Orçamento', icon: PieChart },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useProfile()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[232px] bg-white border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-base text-text-primary">FinanceTrack</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-tertiary px-2 mb-2">Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-accent-light text-accent-text font-medium'
                  : 'text-text-secondary hover:bg-bg-page hover:text-text-primary'
              }`}
            >
              <Icon size={16} strokeWidth={1.5} className={active ? 'text-accent' : ''} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        {profile ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <Avatar name={profile.full_name} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{profile.full_name}</p>
              <p className="text-xs text-text-tertiary truncate">{profile.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sair"
              className="text-text-tertiary hover:text-negative transition-colors"
            >
              <LogOut size={15} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full skeleton" />
            <div className="flex-1">
              <div className="h-3 w-20 skeleton mb-1.5" />
              <div className="h-2.5 w-28 skeleton" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
