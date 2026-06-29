import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@stubramp/ui/button'
import { Badge } from '@stubramp/ui/badge'
import { Card } from '@stubramp/ui/card'
import { StatTile } from '@stubramp/ui/stat-tile'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="min-h-screen bg-surface-page p-8 font-sans text-ink-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-medium tracking-[-0.01em]">
            @stubramp/ui integration
          </h1>
          <Badge tone="accent" dot>
            connected
          </Badge>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Spend" value="$12,480" delta="4.2%" deltaDir="up" prefix="$" />
          <StatTile label="Invoices" value="38" delta="2" deltaDir="down" />
          <StatTile label="Vendors" value="12" delta="1" deltaDir="up" />
        </div>

        <Card elevation="md" className="flex flex-col gap-4">
          <p className="text-base">
            These components are rendered from the <code>@stubramp/ui</code>{' '}
            workspace package, styled with the shared Ramp design tokens.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
