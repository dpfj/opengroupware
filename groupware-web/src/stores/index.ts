"use client"
// src/stores/index.ts
// Zustand 전역 상태 — 인증 + 워크스페이스

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, TokenPair } from "@/types"

// ── 인증 스토어 ────────────────────────────────────────────

interface AuthState {
  user:         User | null
  accessToken:  string | null
  refreshToken: string | null
  isLoggedIn:   boolean

  login:  (user: User, tokens: TokenPair) => void
  logout: () => void
  setUser:(user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoggedIn:   false,

      login: (user, tokens) => {
        // localStorage에도 저장 (API 클라이언트에서 직접 읽음)
        localStorage.setItem("access_token",  tokens.access_token)
        localStorage.setItem("refresh_token", tokens.refresh_token)
        set({
          user,
          accessToken:  tokens.access_token,
          refreshToken: tokens.refresh_token,
          isLoggedIn:   true,
        })
      },

      logout: () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name:    "auth-storage",
      partialize: (s) => ({
        user:         s.user,
        accessToken:  s.accessToken,
        refreshToken: s.refreshToken,
        isLoggedIn:   s.isLoggedIn,
      }),
    }
  )
)

// ── 워크스페이스 스토어 ────────────────────────────────────

interface WorkspaceState {
  currentWorkspaceId: string
  setWorkspace: (id: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspaceId: "ws-company",
      setWorkspace: (id) => set({ currentWorkspaceId: id }),
    }),
    { name: "workspace-storage" }
  )
)

// ── 알림 스토어 ────────────────────────────────────────────

import type { SSEEvent } from "@/types"

interface NotificationState {
  items:       SSEEvent[]
  unreadCount: number
  addNotif:    (event: SSEEvent) => void
  markRead:    () => void
  clear:       () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items:       [],
  unreadCount: 0,

  addNotif: (event) =>
    set((s) => ({
      items:       [event, ...s.items].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),

  markRead: () => set({ unreadCount: 0 }),
  clear:    () => set({ items: [], unreadCount: 0 }),
}))
