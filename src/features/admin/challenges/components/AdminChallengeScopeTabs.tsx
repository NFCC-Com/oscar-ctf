import React from 'react'
import { SegmentedTabs } from '@/shared/components'

type ScopeValue = 'all' | 'main' | 'private' | 'service'

interface AdminChallengeScopeTabsProps {
  value: ScopeValue
  onChange: (value: ScopeValue) => void
}

export default function AdminChallengeScopeTabs({
  value,
  onChange,
}: AdminChallengeScopeTabsProps) {
  return (
    <div className="shrink-0">
      <SegmentedTabs
        value={value}
        onChange={onChange}
        items={[
          { value: 'all', label: 'All' },
          { value: 'main', label: 'Main' },
          { value: 'private', label: 'Private' },
          { value: 'service', label: 'Service' },
        ]}
        variant="panel"
      />
    </div>
  )
}
