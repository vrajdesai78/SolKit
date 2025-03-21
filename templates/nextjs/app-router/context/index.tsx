'use client'

import { solanaWeb3JsAdapter, projectId, networks } from '@/config'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'

// Set up metadata
const metadata = {
  name: '{{projectInfo.name}}',
  description: '{{projectInfo.description}}',
  url: '{{projectInfo.url}}',
  icons: ['{{projectInfo.icon}}']
}

// Create the modal
export const modal = createAppKit({
  adapters: [solanaWeb3JsAdapter],
  projectId,
  networks,
  metadata,
  themeMode: '{{projectInfo.themeMode}}',
  features: {
    analytics: {{projectInfo.analytics}} // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '{{projectInfo.accentColor}}',
  }
})

function ContextProvider({ children }: { children: ReactNode }) {
  return (
    <modal.Provider>
      {children}
    </modal.Provider>
  )
}

export default ContextProvider 