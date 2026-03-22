"use client"
// src/components/layout/Sidebar.tsx

import Link                from "next/link"
import { usePathname }     from "next/navigation"
import {
  LayoutDashboard, FileText, ClipboardCheck,
  Bell, Settings, LogOut, Building2,
} from "lucide-react"
import { cn }              from "@/lib/utils"
import { useAuthStore }    from "@/stores"
import { authApi }         from "@/lib/api"

const NAV_ITEMS = [
  { href: "/dashboard",   label: "대시보드",    icon: LayoutDashboard },
  { href: "/files",       label: "파일 관리",   icon: FileText },
  { href: "/approval",    label: "전자결재",    icon: ClipboardCheck },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    logout()
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      {/* 로고 */}
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">Groupware</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* 하단 사용자 정보 */}
      <div className="border-t p-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
        >
          <Settings className="h-4 w-4" />
          설정
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>

        {/* 사용자 정보 */}
        {user && (
          <div className="mt-2 flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user.display_name[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{user.display_name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
