import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SideRail } from './SideRail'

export function AppLayout() {
  return (
    <div className="min-h-full">
      <div className="hidden lg:block">
        <SideRail />
      </div>
      <div className="lg:pl-60">
        <main className="mx-auto min-h-screen w-full max-w-app px-4 pb-28 pt-2 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
