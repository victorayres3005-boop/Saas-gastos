import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import { RecurringProcessor } from '@/components/RecurringProcessor'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RecurringProcessor />
      <div className="min-h-screen bg-bg-page">
        <Sidebar />
        <div className="ml-[232px] max-md:ml-0 pb-16 md:pb-0">
          {children}
        </div>
      </div>
    </ToastProvider>
  )
}
