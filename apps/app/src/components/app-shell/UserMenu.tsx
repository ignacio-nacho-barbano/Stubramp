'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { LogOut, Settings, UserPlus, UserRound } from 'lucide-react'
import { Avatar, Menu, avatarColor, cn, useToast } from '@stubramp/ui'
import { createInviteFn, logoutFn } from '../../lib/auth'
import { useCurrentUser } from '../../lib/useCurrentUser'

/** User avatar with a dropdown menu — profile shortcuts and sign out. */
export function UserMenu() {
  const { name, email, role } = useCurrentUser()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Admin-only: mint an invite link for this workspace and copy it to the
  // clipboard so it can be shared manually. The token is company-scoped by the
  // API from the caller's session.
  const invite = useMutation({
    mutationFn: createInviteFn,
    onSuccess: async (res) => {
      if (!res.ok) {
        toast({ message: res.error, tone: 'negative' })
        return
      }
      const url = `${window.location.origin}/join?token=${res.token}`
      try {
        await navigator.clipboard.writeText(url)
        toast({ message: 'Invite link copied to clipboard', tone: 'positive' })
      } catch {
        // Clipboard can be blocked (permissions / insecure context) — still hand
        // the link over so it isn't lost.
        toast({ message: url })
      }
    },
  })

  const logout = useMutation({
    mutationFn: logoutFn,
    onSuccess: async () => {
      // Drop any cached queries (bills/vendors) so a next user can't see the
      // previous session's data, then invalidate route context (which holds the
      // resolved user) so the /_app guard re-runs on the way out.
      queryClient.clear()
      await router.invalidate()
      await navigate({ to: '/login' })
    },
  })

  const inviting = invite.isPending
  const signingOut = logout.isPending

  function handleInvite() {
    if (!inviting) invite.mutate()
  }

  function handleLogout() {
    if (!signingOut) logout.mutate()
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
          {role === 'ADMIN' && (
            <MenuAction
              icon={<UserPlus size={15} />}
              label={inviting ? 'Creating link…' : 'Invite teammate'}
              disabled={inviting}
              onSelect={handleInvite}
            />
          )}
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
