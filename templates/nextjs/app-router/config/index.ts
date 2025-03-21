import { solana, solanaTestnet, solanaDevnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// Get projectId from https://cloud.reown.com
export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || "{{projectInfo.projectId}}"; // replace with your own project ID

// Configure available networks
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  solana,
  solanaTestnet,
  solanaDevnet,
];

// Initialize Solana adapter with available wallets
export const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
});
