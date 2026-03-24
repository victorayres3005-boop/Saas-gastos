import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg-page">
        <Sidebar />
        <div className="ml-[232px] max-md:ml-0">
          {children}
        </div>
      </div>
    </ToastProvider>
  )
}
