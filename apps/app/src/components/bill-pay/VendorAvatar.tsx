import { Avatar } from '@stubramp/ui/avatar'
import { avatarColor } from '../../lib/format'

/** Avatar with the deterministic name→color background used across Bill Pay. */
export function VendorAvatar({
  name,
  size = 26,
}: {
  name: string
  size?: number
}) {
  return (
    <Avatar
      name={name}
      size={size}
      style={{ background: avatarColor(name), color: 'var(--paper-0)' }}
    />
  )
}
