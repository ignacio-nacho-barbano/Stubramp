'use client'

import { useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { LogOut, Settings, UserRound } from 'lucide-react'
import { Avatar, Menu, avatarColor, cn } from '@stubramp/ui'
import { logoutFn } from '../../lib/auth'
import { useCurrentUser } from '../../lib/useCurrentUser'

/** User avatar with a dropdown menu — profile shortcuts and sign out. */
export function UserMenu() {
  const { name, email } = useCurrentUser()
  const navigate = useNavigate()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleLogout() {
    if (signingOut) return
    setSigningOut(true)
    await logoutFn()
    // Drop cached route context (which holds the resolved user) so the
    // /_app guard re-runs and can't serve stale authed data on the way out.
    await router.invalidate()
    await navigate({ to: '/login' })
  }

  return (
    <Menu
      align="end"
      width={240}
      trigger={
        <Avatar
          name={name}
          size={30}
          style={{ background: avatarColor(name), color: 'var(--paper-0)' }}
        />
      }
    >
      <div>
        <div className="flex items-center gap-2.5 border-b border-gray-200 px-4 py-3">
          <Avatar
            name={name}
            size={34}
            style={{ background: avatarColor(name), color: 'var(--paper-0)' }}
          />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-ink-900">
              {name}
            </div>
            <div className="truncate text-[11.5px] text-gray-500">{email}</div>
          </div>
        </div>
        <div className="p-1.5">
          <MenuAction icon={<UserRound size={15} />} label="Profile" />
          <MenuAction icon={<Settings size={15} />} label="Settings" />
        </div>
        <div className="border-t border-gray-200 p-1.5">
          <MenuAction
            icon={<LogOut size={15} />}
            label={signingOut ? 'Signing out…' : 'Sign out'}
            danger
            disabled={signingOut}
            onSelect={handleLogout}
          />
        </div>
      </div>
    </Menu>
  )
}

function MenuAction({
  icon,
  label,
  danger,
  disabled,
  onSelect,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  disabled?: boolean
  onSelect?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.75 rounded-sm px-2.75 py-2 text-left text-sm font-medium transition-[background-color] duration-120',
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'cursor-pointer hover:bg-surface-page',
        danger ? 'text-status-negative' : 'text-ink-900',
      )}
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </button>
  )
}
