import { useEffect } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { solanaWeb3JsAdapter, projectId, networks } from './config'
import ConnectButton from './components/ConnectButton'
import ActionButtonList from './components/ActionButtonList'
import InfoList from './components/InfoList'
import './App.css'

// Initialize AppKit
createAppKit({
  adapters: [solanaWeb3JsAdapter],
  projectId,
  networks,
  metadata: {
    name: '{{projectInfo.name}}',
    description: '{{projectInfo.description}}',
    url: '{{projectInfo.url}}',
    icons: ['{{projectInfo.icon}}']
  },
  themeMode: '{{projectInfo.themeMode}}',
  features: {
    analytics: {{projectInfo.analytics}} // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '{{projectInfo.accentColor}}',
  }
})

function App() {
  return (
    <div className="app-container">
      <h1>AppKit Solana Integration</h1>
      
      <div className="connect-section">
        <h2>Connect Your Wallet</h2>
        <ConnectButton />
        <ActionButtonList />
      </div>
      
      <div className="notice">
        <p>
          Note: The default projectId only works on localhost. 
          <br />Go to <a href="https://cloud.reown.com" target="_blank" rel="noopener noreferrer">Reown Cloud</a> to get your own.
        </p>
      </div>

      <InfoList />
    </div>
  )
}

export default App 