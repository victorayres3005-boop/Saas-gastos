import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import { RecurringProcessor } from '@/components/RecurringProcessor'
import { NavigationProgress } from '@/components/layout/NavigationProgress'
import { PageWrapper } from '@/components/layout/PageWrapper'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RecurringProcessor />
      <NavigationProgress />
      <div className="min-h-screen bg-bg-page">
        <Sidebar />
        <div className="ml-[232px] max-md:ml-0 pb-16 md:pb-0">
          <PageWrapper>
            {children}
          </PageWrapper>
        </div>
      </div>
    </ToastProvider>
  )
}
