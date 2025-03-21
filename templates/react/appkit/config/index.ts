import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { {{#each solanaConfig.wallets}}{{#if @first}}{{else}}, {{/if}}{{.}}WalletAdapter{{/each}} } from '@solana/wallet-adapter-wallets'

// Get projectId from https://cloud.reown.com
export const projectId = import.meta.env.VITE_PROJECT_ID || "{{projectInfo.projectId}}" // replace with your own project ID

// Configure available networks
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
{{#if solanaConfig.includeMainnet}}  solana,
{{/if}}{{#if solanaConfig.includeTestnet}}  solanaTestnet,
{{/if}}{{#if solanaConfig.includeDevnet}}  solanaDevnet{{/if}}
]

// Initialize Solana adapter with available wallets
export const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [
    {{#each solanaConfig.wallets}}new {{.}}WalletAdapter(),
    {{/each}}
  ]
}) 