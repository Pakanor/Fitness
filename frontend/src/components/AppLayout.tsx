import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SideRail } from './SideRail'
import { UserMenu } from './UserMenu'

export function AppLayout() {
  return (
    <div className="min-h-full">
      <SideRail />
      <div className="lg:pl-60">
        <header className="mx-auto flex w-full max-w-app items-center justify-end px-4 pt-4">
          <UserMenu />
        </header>
        <main className="mx-auto min-h-screen w-full max-w-app px-4 pb-28 pt-2 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
