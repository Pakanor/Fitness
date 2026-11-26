import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SideRail } from './SideRail'

/**
 * App shell: desktop left rail + mobile bottom nav (UI-SPEC 1.3 / 2.1).
 * Content is centered in a mobile-width column that expands on desktop.
 */
export function AppLayout() {
  return (
    <div className="min-h-full">
      <SideRail />
      <div className="lg:pl-60">
        <main className="mx-auto min-h-screen w-full max-w-app px-4 pb-28 pt-4 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
