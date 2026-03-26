'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, ArrowLeftRight, PieChart, LogOut, Target,
  RefreshCw, Settings, Wallet, BarChart2, Bell, X, Sun, Moon, Monitor,
  TrendingUp, MoreHorizontal,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks/useProfile'
import { useBudgetAlerts } from '@/lib/hooks/useBudgetAlerts'
import { Avatar } from '../ui/Avatar'
import { useTheme } from '../providers/ThemeProvider'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
      { href: '/accounts',     label: 'Contas',       icon: Wallet },
      { href: '/transactions', label: 'Transações',   icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Planejamento',
    items: [
      { href: '/budget',       label: 'Orçamento',    icon: PieChart,    hasBudgetAlert: true },
      { href: '/recurring',    label: 'Recorrentes',  icon: RefreshCw },
      { href: '/goals',        label: 'Metas',        icon: Target },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { href: '/analysis',     label: 'Análise',      icon: BarChart2 },
      { href: '/settings',     label: 'Configurações', icon: Settings },
    ],
  },
]

const mobileNavItems = [
  { href: '/dashboard',    label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/analysis',     label: 'Análise',    icon: BarChart2 },
  { href: '/goals',        label: 'Metas',      icon: Target },
]

const mobileMoreItems = [
  { href: '/accounts',  label: 'Contas',      icon: Wallet },
  { href: '/budget',    label: 'Orçamento',   icon: PieChart,   hasBudgetAlert: true },
  { href: '/recurring', label: 'Recorrentes', icon: RefreshCw },
  { href: '/settings',  label: 'Config.',     icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useProfile()
  const alerts = useBudgetAlerts()
  const { theme, setTheme } = useTheme()
  const [showAlerts, setShowAlerts] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const alertCount = alerts.length
  const dangerCount = alerts.filter(a => a.severity === 'danger').length

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <aside className="fixed left-0 top-0 h-full w-[232px] bg-bg-surface border-r border-border flex flex-col z-30 max-md:hidden">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-[0_2px_8px_rgba(255,107,53,0.35)]">
                <TrendingUp size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="font-bold text-[15px] text-text-primary leading-none block">FinanceTrack</span>
                <span className="text-[10px] text-text-tertiary leading-none">Controle financeiro</span>
              </div>
            </div>

            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => setShowAlerts(v => !v)}
                className={`relative w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${showAlerts ? 'bg-accent-light text-accent' : 'hover:bg-bg-page text-text-tertiary hover:text-text-primary'}`}
              >
                <Bell size={15} strokeWidth={1.5} />
                {alertCount > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5 ${dangerCount > 0 ? 'bg-negative' : 'bg-warning'}`}>
                    {alertCount}
                  </span>
                )}
              </button>

              {/* Painel de alertas */}
              {showAlerts && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAlerts(false)} />
                  <div className="absolute top-9 left-0 w-72 bg-bg-surface border border-border rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-50 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bell size={13} className="text-text-secondary" />
                        <p className="text-xs font-semibold text-text-primary">Notificações</p>
                        {alertCount > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${dangerCount > 0 ? 'bg-negative-light text-negative' : 'bg-warning-light text-warning'}`}>
                            {alertCount}
                          </span>
                        )}
                      </div>
                      <button onClick={() => setShowAlerts(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                    {alerts.length === 0 ? (
                      <div className="py-6 text-center">
                        <Bell size={24} className="mx-auto mb-2 text-text-tertiary opacity-40" />
                        <p className="text-xs text-text-tertiary">Nenhum alerta no momento</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {alerts.map(a => (
                          <div key={a.id} className={`p-2.5 rounded-lg border ${a.severity === 'danger' ? 'bg-negative-light border-negative/20' : 'bg-warning-light border-warning/20'}`}>
                            <p className={`text-xs font-semibold mb-0.5 ${a.severity === 'danger' ? 'text-negative' : 'text-warning'}`}>{a.title}</p>
                            <p className="text-xs text-text-secondary">{a.message}</p>
                            {a.pct !== undefined && (
                              <div className="mt-1.5 w-full h-1 bg-border rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${a.severity === 'danger' ? 'bg-negative' : 'bg-warning'}`} style={{ width: `${Math.min(a.pct, 100)}%` }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-tertiary px-2.5 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon, hasBudgetAlert }) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
                        active
                          ? 'bg-accent/10 text-accent font-semibold'
                          : 'text-text-secondary hover:bg-bg-page hover:text-text-primary'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                      )}
                      <Icon
                        size={16}
                        strokeWidth={active ? 2.2 : 1.5}
                        className={active ? 'text-accent' : ''}
                      />
                      <span className="flex-1">{label}</span>
                      {hasBudgetAlert && alertCount > 0 && (
                        <span className={`min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 ${dangerCount > 0 ? 'bg-negative' : 'bg-warning'}`}>
                          {alertCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Tema toggle */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-1 bg-bg-page rounded-lg p-1">
            {[
              { value: 'light' as const, icon: Sun, title: 'Claro' },
              { value: 'system' as const, icon: Monitor, title: 'Sistema' },
              { value: 'dark' as const, icon: Moon, title: 'Escuro' },
            ].map(({ value, icon: Icon, title }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                title={title}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all text-xs gap-1 ${
                  theme === value
                    ? 'bg-bg-surface shadow-sm text-text-primary font-medium'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                <Icon size={12} />
              </button>
            ))}
          </div>
        </div>

        {/* Footer — perfil */}
        <div className="px-3 pb-4">
          {profile ? (
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-bg-page hover:border-accent/30 transition-colors group">
              <Link href="/settings" title="Configurações">
                <Avatar name={profile.full_name} imageUrl={profile.avatar_url} />
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate leading-tight">{profile.full_name}</p>
                <Link href="/settings" className="text-[11px] text-text-tertiary hover:text-accent transition-colors truncate block leading-tight mt-0.5">
                  Ver perfil
                </Link>
              </div>
              <button
                onClick={handleSignOut}
                title="Sair"
                className="text-text-tertiary hover:text-negative transition-colors opacity-0 group-hover:opacity-100"
              >
                <LogOut size={14} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-bg-page">
              <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-20 skeleton mb-1.5 rounded" />
                <div className="h-2.5 w-16 skeleton rounded" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border z-30 flex md:hidden">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-medium transition-colors ${active ? 'text-accent' : 'text-text-tertiary'}`}>
              <Icon size={18} strokeWidth={active ? 2.2 : 1.5} />
              {label}
            </Link>
          )
        })}
        <button
          onClick={() => setShowMore(true)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-medium transition-colors ${showMore ? 'text-accent' : 'text-text-tertiary'}`}
        >
          <MoreHorizontal size={18} strokeWidth={showMore ? 2.2 : 1.5} />
          Mais
        </button>
      </nav>

      {/* More Drawer */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-bg-surface rounded-t-2xl z-50 md:hidden pb-safe">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-sm font-semibold text-text-primary">Mais opções</span>
              <button onClick={() => setShowMore(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-3 py-3 space-y-1">
              {mobileMoreItems.map(({ href, label, icon: Icon, hasBudgetAlert }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-page hover:text-text-primary'}`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.5} className={active ? 'text-accent' : ''} />
                    <span className="flex-1">{label}</span>
                    {hasBudgetAlert && alertCount > 0 && (
                      <span className={`min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 ${dangerCount > 0 ? 'bg-negative' : 'bg-warning'}`}>
                        {alertCount}
                      </span>
                    )}
                  </Link>
                )
              })}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-negative-light hover:text-negative transition-colors"
              >
                <LogOut size={18} strokeWidth={1.5} />
                Sair
              </button>
            </div>
            <div className="h-6" />
          </div>
        </>
      )}
    </>
  )
}
