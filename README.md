# SolKit

> CLI tool for seamless Solana wallet and blockchain integration in modern web applications

SolKit simplifies the process of integrating Solana blockchain functionality into your React, Next.js, or Vue application. With a single command, SolKit sets up wallet connection, transaction handling, token management, and NFT support.

## Features

- 🔌 **Easy Setup**: Seamlessly integrate Solana with React, Next.js, or Vue projects
- 💼 **Wallet Integration**: Connect with popular Solana wallets like Phantom, Solflare, and more
- 💸 **Transaction Utilities**: Easily send, sign, and track transactions
- 🪙 **Token Management**: Manage SPL tokens with straightforward components and hooks
- 🖼️ **NFT Support**: Display and interact with NFTs
- 📱 **Client-Side Compatible**: Works perfectly with React Server Components (RSC) in Next.js App Router
- 🔄 **Auto Compatibility**: Automatically handles React 19+ compatibility issues

## Installation

```bash
# Install the CLI globally
npm install -g solkit

# Or use npx to run without installing
npx solkit init
```

## Quick Start

1. Navigate to your project directory:
   ```bash
   cd your-project
   ```

2. Initialize Solana integration:
   ```bash
   solkit init
   ```

3. Follow the interactive prompts to configure your integration.

4. Start using Solana in your project!

## Usage

### Initialize a Project

```bash
solkit init [options]
```

Options:
- `-d, --dir <path>` - Project directory (defaults to current directory)
- `-n, --network <network>` - Solana network (mainnet-beta, testnet, devnet, localnet)
- `-t, --transactions` - Include transaction utilities
- `--tokens` - Include token utilities
- `--nfts` - Include NFT support
- `-f, --framework <framework>` - Specify framework if detection fails
- `-y, --yes` - Skip confirmation prompts with default values
- `-v, --verbose` - Enable verbose logging

### Diagnose Issues

```bash
solkit doctor [options]
```

Options:
- `-d, --dir <path>` - Project directory (defaults to current directory)
- `-v, --verbose` - Enable verbose logging

### Update Integration

```bash
solkit update [options]
```

Options:
- `-d, --dir <path>` - Project directory (defaults to current directory)
- `-v, --verbose` - Enable verbose logging

## Framework Support

SolKit supports the following frameworks:
- React
- Next.js (both App Router and Pages Router)
- Vue (experimental)

## React 19+ Compatibility

SolKit includes special handling for React 19+, which has changes that affect wallet adapter libraries:

- Automatically detects React 19 and adds necessary compatibility fixes
- Creates client-side components with proper 'use client' directives
- Ensures all wallet providers work correctly in server component environments

## Examples

### React Basic Wallet Connection

```jsx
import { useWallet, WalletConnectButton } from '@/solana/wallet';

function WalletComponent() {
  const { publicKey, connected } = useWallet();
  
  return (
    <div>
      <WalletConnectButton />
      {connected && (
        <p>Connected: {publicKey.toBase58()}</p>
      )}
    </div>
  );
}
```

### Next.js App Router Integration

```jsx
// app/layout.tsx (server component)
import { ClientWalletProvider } from '@/solana/wallet';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClientWalletProvider>
          {children}
        </ClientWalletProvider>
      </body>
    </html>
  );
}

// components/WalletSection.tsx (client component)
'use client';

import { useWallet, WalletConnectButton } from '@/solana/wallet';

export default function WalletSection() {
  const { publicKey } = useWallet();
  
  return (
    <div>
      <WalletConnectButton />
      {publicKey && <p>Connected: {publicKey.toString()}</p>}
    </div>
  );
}
```

### Send Transaction Example

```jsx
import { useWallet } from '@/solana/wallet';
import { useSolanaTransaction } from '@/solana/transactions';
import { useState } from 'react';

export function SendSolForm() {
  const { publicKey } = useWallet();
  const { sendSOL } = useSolanaTransaction();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState({ type: 'idle' });
  
  async function handleSend(e) {
    e.preventDefault();
    if (!publicKey) return;
    
    try {
      setStatus({ type: 'processing' });
      const signature = await sendSOL(recipient, parseFloat(amount));
      setStatus({ 
        type: 'success', 
        message: 'Transaction sent!',
        signature
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }
  
  return (
    <form onSubmit={handleSend}>
      {/* Form implementation */}
    </form>
  );
}
```

## Troubleshooting

If you encounter any issues with your Solana integration, run the doctor command:

```bash
solkit doctor -v
```

This will analyze your project and identify any potential problems with your Solana integration.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for the Solana community. 